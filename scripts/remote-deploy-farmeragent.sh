#!/usr/bin/env bash
set -euo pipefail

PROJECT_SLUG="${PROJECT_SLUG:-farmeragent}"
DOMAIN="${DOMAIN:-farmeragent.forum}"
SERVICE_NAME="${SERVICE_NAME:-${PROJECT_SLUG}}"
APP_USER="${APP_USER:-${PROJECT_SLUG}}"
APP_GROUP="${APP_GROUP:-${PROJECT_SLUG}}"
REMOTE_BUNDLE="${REMOTE_BUNDLE:-/tmp/${PROJECT_SLUG}-bundle.tar.gz}"
REMOTE_ENV="${REMOTE_ENV:-/tmp/${PROJECT_SLUG}.env}"

REMOTE_BASE="/opt/${PROJECT_SLUG}"
REMOTE_APP="${REMOTE_BASE}/app"
REMOTE_RUNTIME="${REMOTE_BASE}/runtime"
REMOTE_NODE="${REMOTE_BASE}/node"
RELEASES_DIR="${REMOTE_BASE}/releases"
STAGING_ROOT="${REMOTE_BASE}/.staging"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
STAGING_DIR="${STAGING_ROOT}/${TIMESTAMP}"
BACKUP_DIR="${RELEASES_DIR}/app-${TIMESTAMP}"
ROLLBACK_NEEDED=0

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command on remote: $1" >&2
    exit 1
  }
}

need_cmd tar
need_cmd curl
need_cmd systemctl
need_cmd caddy
need_cmd ss

detect_port() {
  if [ -f "${SERVICE_FILE}" ]; then
    local existing
    existing="$(awk -F= '/^Environment=PORT=/{print $NF}' "${SERVICE_FILE}" | tail -n 1)"
    if [ -n "${existing}" ]; then
      echo "${existing}"
      return 0
    fi
  fi

  local port=3100
  while ss -lntp | awk '{print $4}' | grep -Eq "[:.]${port}$"; do
    port="$((port + 1))"
  done
  echo "${port}"
}

APP_PORT="${APP_PORT:-$(detect_port)}"

wait_for_health() {
  local attempt
  for attempt in $(seq 1 20); do
    if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

rollback() {
  if [ "${ROLLBACK_NEEDED}" != "1" ]; then
    return 0
  fi

  echo "Rolling back to previous app directory" >&2
  systemctl stop "${SERVICE_NAME}" >/dev/null 2>&1 || true
  rm -rf "${REMOTE_APP}"
  if [ -d "${BACKUP_DIR}" ]; then
    mv "${BACKUP_DIR}" "${REMOTE_APP}"
    chown -R "${APP_USER}:${APP_GROUP}" "${REMOTE_BASE}"
    systemctl start "${SERVICE_NAME}" >/dev/null 2>&1 || true
  fi
}

trap rollback ERR

if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --shell /usr/sbin/nologin "${APP_USER}"
fi

if ! getent group "${APP_GROUP}" >/dev/null 2>&1; then
  groupadd --system "${APP_GROUP}"
  usermod -a -G "${APP_GROUP}" "${APP_USER}"
fi

mkdir -p "${REMOTE_RUNTIME}" "${RELEASES_DIR}" "${STAGING_DIR}"

if [ -f "${REMOTE_ENV}" ]; then
  install -m 600 "${REMOTE_ENV}" "${REMOTE_BASE}/.env"
fi

if [ ! -x "${REMOTE_NODE}/bin/node" ]; then
  NODE_VERSION="v22.22.2"
  NODE_DIST="node-${NODE_VERSION}-linux-x64"
  NODE_ARCHIVE="/tmp/${NODE_DIST}.tar.xz"
  curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/${NODE_DIST}.tar.xz" -o "${NODE_ARCHIVE}"
  tar -xJf "${NODE_ARCHIVE}" -C "${REMOTE_RUNTIME}"
  ln -sfn "${REMOTE_RUNTIME}/${NODE_DIST}" "${REMOTE_NODE}"
  rm -f "${NODE_ARCHIVE}"
fi

tar -xzf "${REMOTE_BUNDLE}" -C "${STAGING_DIR}"
mkdir -p "${STAGING_DIR}/server/data"

if [ -f "${REMOTE_APP}/server/data/state.json" ]; then
  cp "${REMOTE_APP}/server/data/state.json" "${STAGING_DIR}/server/data/state.json"
fi

cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=Farmer Agent web app
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${REMOTE_APP}
EnvironmentFile=-${REMOTE_BASE}/.env
Environment=PORT=${APP_PORT}
Environment=HOST=127.0.0.1
ExecStart=${REMOTE_NODE}/bin/node ${REMOTE_APP}/server/index.mjs
Restart=always
RestartSec=3
KillSignal=SIGINT
TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
EOF

if ! grep -Fq "${DOMAIN} {" /etc/caddy/Caddyfile; then
  cat >> /etc/caddy/Caddyfile <<EOF

${DOMAIN} {
	encode zstd gzip
	reverse_proxy 127.0.0.1:${APP_PORT}
}
EOF
fi

caddy validate --config /etc/caddy/Caddyfile >/dev/null
systemctl reload caddy

systemctl daemon-reload

if systemctl is-active --quiet "${SERVICE_NAME}"; then
  systemctl stop "${SERVICE_NAME}"
fi

if [ -d "${REMOTE_APP}" ]; then
  mv "${REMOTE_APP}" "${BACKUP_DIR}"
  ROLLBACK_NEEDED=1
fi

mv "${STAGING_DIR}" "${REMOTE_APP}"
chown -R "${APP_USER}:${APP_GROUP}" "${REMOTE_BASE}"

su -s /bin/bash "${APP_USER}" -c "export PATH='${REMOTE_NODE}/bin:\$PATH'; cd '${REMOTE_APP}' && npm install --omit=dev --no-fund --no-audit"

systemctl enable --now "${SERVICE_NAME}" >/dev/null

wait_for_health
ROLLBACK_NEEDED=0

rm -f "${REMOTE_BUNDLE}"
rm -f "${REMOTE_ENV}"
find "${STAGING_ROOT}" -mindepth 1 -maxdepth 1 -type d -empty -delete

echo "Remote deploy complete"
echo "APP_DIR=${REMOTE_APP}"
echo "APP_PORT=${APP_PORT}"
echo "DOMAIN=${DOMAIN}"
