import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../farm-remix/assets/goo-live.js", import.meta.url), "utf8");

for (const lang of ["en", "zh-CN"]) {
  test(`agent names and strategies render as text in ${lang}`, async () => {
    const payload = '<img src=x onerror="alert(1)">';
    let rendered;
    const finished = new Promise((resolve) => { rendered = resolve; });
    const root = { set innerHTML(html) { rendered(html); } };
    runInNewContext(source, {
      document: {
        documentElement: { lang },
        getElementById: (id) => id === "goo-agent-list" ? root : null
      },
      window: {},
      setInterval: () => {},
      fetch: async () => ({
        ok: true,
        json: async () => ({
          agents: [{ id: "safe-id", name: payload, symbol: payload, strategyLabel: payload, status: "active" }],
          summary: { total: 1 }
        })
      })
    });
    const html = await finished;
    assert.ok(!html.includes(payload));
    assert.equal((html.match(/&lt;img/g) || []).length, 3);
    assert.ok(html.includes("&quot;alert(1)&quot;"));
  });
}
