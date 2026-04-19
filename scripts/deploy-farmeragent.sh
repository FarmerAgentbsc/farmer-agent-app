#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-104.238.141.201}"
REMOTE_SSH_PORT="${REMOTE_SSH_PORT:-2222}"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"

PROJECT_SLUG="${PROJECT_SLUG:-farmeragent}"
DOMAIN="${DOMAIN:-farmeragent.forum}"
SERVICE_NAME="${SERVICE_NAME:-${PROJECT_SLUG}}"
APP_USER="${APP_USER:-${PROJECT_SLUG}}"
APP_GROUP="${APP_GROUP:-${PROJECT_SLUG}}"

TMP_DIR="$(mktemp -d)"
BUNDLE_PATH="${TMP_DIR}/${PROJECT_SLUG}-bundle.tar.gz"
REMOTE_BUNDLE="/tmp/${PROJECT_SLUG}-bundle.tar.gz"
REMOTE_SCRIPT="/tmp/${PROJECT_SLUG}-remote-deploy.sh"
REMOTE_ENV="/tmp/${PROJECT_SLUG}.env"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

need_cmd tar
need_cmd ssh
need_cmd scp
need_cmd curl

echo "==> Building deployment bundle"
export COPYFILE_DISABLE=1
tar \
  --no-mac-metadata \
  --exclude=".DS_Store" \
  --exclude=".env" \
  --exclude="server/data/state.json" \
  -czf "${BUNDLE_PATH}" \
  -C "${ROOT_DIR}" \
  package.json \
  package-lock.json \
  README.md \
  .env.example \
  server \
  farm-remix \
  scripts \
  start-farmer-agent.command \
  update-farmeragent.command

echo "==> Uploading bundle to ${REMOTE}"
scp -P "${REMOTE_SSH_PORT}" "${BUNDLE_PATH}" "${REMOTE}:${REMOTE_BUNDLE}"
scp -P "${REMOTE_SSH_PORT}" "${ROOT_DIR}/scripts/remote-deploy-farmeragent.sh" "${REMOTE}:${REMOTE_SCRIPT}"
if [ -f "${ROOT_DIR}/.env" ]; then
  scp -P "${REMOTE_SSH_PORT}" "${ROOT_DIR}/.env" "${REMOTE}:${REMOTE_ENV}"
fi

echo "==> Running remote deploy"
ssh -p "${REMOTE_SSH_PORT}" "${REMOTE}" \
  "chmod +x '${REMOTE_SCRIPT}' && PROJECT_SLUG='${PROJECT_SLUG}' DOMAIN='${DOMAIN}' SERVICE_NAME='${SERVICE_NAME}' APP_USER='${APP_USER}' APP_GROUP='${APP_GROUP}' REMOTE_BUNDLE='${REMOTE_BUNDLE}' REMOTE_ENV='${REMOTE_ENV}' bash '${REMOTE_SCRIPT}'"

echo "==> Public verify"
curl -I --max-time 20 "https://${DOMAIN}" | sed -n '1,5p'
for path in /dashboard /goo /airdrop /api/health; do
  printf "%s " "${path}"
  curl -fsS -o /dev/null -w "%{http_code}\n" --max-time 20 "https://${DOMAIN}${path}"
done
curl -fsS --max-time 20 "https://${DOMAIN}/api/health"

echo
echo "Deploy finished for https://${DOMAIN}"
