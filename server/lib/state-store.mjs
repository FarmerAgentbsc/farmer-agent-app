import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import pg from "pg";

const { Pool } = pg;

function wantsSsl(connectionString) {
  return /sslmode=require/i.test(connectionString) || /supabase\.com/i.test(connectionString);
}

function normalizeConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return connectionString.replace(/([?&])sslmode=require(&)?/i, (_, prefix, suffix) => {
      if (prefix === "?" && suffix) return "?";
      if (prefix === "&" && suffix) return "&";
      return "";
    }).replace(/[?&]$/, "");
  }
}

export function createStateStore(options) {
  return new StateStore(options);
}

class StateStore {
  constructor({ dataDir, stateFile, seedState, hydrateState, databaseUrl }) {
    this.dataDir = dataDir;
    this.stateFile = stateFile;
    this.seedState = seedState;
    this.hydrateState = hydrateState;
    this.databaseUrl = databaseUrl || "";
    this.backend = this.databaseUrl ? "postgres" : "json";
    this.pool = this.databaseUrl
      ? new Pool({
          connectionString: normalizeConnectionString(this.databaseUrl),
          max: 5,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 10000,
          allowExitOnIdle: true,
          ssl: wantsSsl(this.databaseUrl) ? { rejectUnauthorized: false } : undefined
        })
      : null;
    this.initPromise = null;
  }

  async init() {
    if (!this.initPromise) {
      this.initPromise = this.backend === "postgres" ? this.initPostgres() : this.initJson();
    }
    return this.initPromise;
  }

  async initJson() {
    await mkdir(this.dataDir, { recursive: true });
    try {
      await access(this.stateFile);
    } catch {
      await this.writeSnapshotToDisk(this.seedState());
    }
  }

  async initPostgres() {
    await mkdir(this.dataDir, { recursive: true });
    await this.pool.query(`
      create table if not exists app_state (
        state_key text primary key,
        payload jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);

    const seeded = await this.readSeedSource();
    const existing = await this.readPostgresRow();
    if (!existing) {
      await this.writePostgresState(seeded);
      await this.writeSnapshotToDisk(seeded);
      return;
    }
    await this.writeSnapshotToDisk(existing);
  }

  async readSeedSource() {
    try {
      await access(this.stateFile);
      const raw = JSON.parse(await readFile(this.stateFile, "utf8"));
      return this.hydrateState(raw);
    } catch {
      return this.hydrateState(this.seedState());
    }
  }

  async readPostgresRow() {
    const result = await this.pool.query(
      "select payload from app_state where state_key = $1",
      ["main"]
    );
    if (!result.rowCount) return null;
    return this.hydrateState(result.rows[0].payload);
  }

  async writePostgresState(state) {
    const hydrated = this.hydrateState(state);
    await this.pool.query(
      `
        insert into app_state (state_key, payload, updated_at)
        values ($1, $2::jsonb, now())
        on conflict (state_key)
        do update set payload = excluded.payload, updated_at = now()
      `,
      ["main", JSON.stringify(hydrated)]
    );
    return hydrated;
  }

  async writeSnapshotToDisk(state) {
    await mkdir(dirname(this.stateFile), { recursive: true });
    await writeFile(this.stateFile, JSON.stringify(this.hydrateState(state), null, 2), "utf8");
  }

  async readState() {
    await this.init();
    if (this.backend === "postgres") {
      const state = (await this.readPostgresRow()) || this.hydrateState(this.seedState());
      await this.writeSnapshotToDisk(state);
      return state;
    }
    return this.hydrateState(JSON.parse(await readFile(this.stateFile, "utf8")));
  }

  async writeState(state) {
    await this.init();
    const hydrated = this.hydrateState(state);
    if (this.backend === "postgres") {
      await this.writePostgresState(hydrated);
    }
    await this.writeSnapshotToDisk(hydrated);
    return hydrated;
  }

  async health() {
    await this.init();
    if (this.backend === "postgres") {
      const result = await this.pool.query("select now() as now");
      return {
        ok: true,
        backend: "postgres",
        connectedAt: result.rows[0]?.now?.toISOString?.() || null
      };
    }
    return {
      ok: true,
      backend: "json",
      file: this.stateFile
    };
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
