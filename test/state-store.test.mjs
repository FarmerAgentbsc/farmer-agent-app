import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createStateStore } from "../server/lib/state-store.mjs";

test("readers always see a complete JSON snapshot during writes", async (t) => {
  const dataDir = await mkdtemp(join(tmpdir(), "farmer-state-test-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  const store = createStateStore({
    dataDir,
    stateFile: join(dataDir, "state.json"),
    seedState: () => ({ version: 0, data: "initial" }),
    hydrateState: (state) => state
  });
  await store.init();
  const reader = (async () => {
    for (let i = 0; i < 100; i++) {
      const state = await store.readState();
      assert.ok(Number.isInteger(state.version));
      assert.equal(state.data, state.version === 0 ? "initial" : "x".repeat(128 * 1024));
    }
  })();
  for (let version = 1; version <= 20; version++) {
    await store.writeState({ version, data: "x".repeat(128 * 1024) });
  }
  await reader;
  assert.equal((await store.readState()).version, 20);
  assert.deepEqual(await readdir(dataDir), ["state.json"]);
});
