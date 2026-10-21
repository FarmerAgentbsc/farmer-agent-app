import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdtemp, rm, symlink } from "node:fs/promises";
import { request } from "node:http";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

async function startApp(t) {
  const root = await mkdtemp(join(tmpdir(), "farmer-agent-test-"));
  let child;
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
    await rm(root, { recursive: true, force: true });
  });
  // Isolate both state and .env so tests never use a developer's database or keys.
  await cp(join(projectRoot, "server"), join(root, "server"), {
    recursive: true,
    filter: (source) => !source.startsWith(join(projectRoot, "server", "data"))
  });
  await symlink(join(projectRoot, "node_modules"), join(root, "node_modules"), "junction");
  await symlink(join(projectRoot, "farm-remix"), join(root, "farm-remix"), "junction");

  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));

  child = spawn(process.execPath, [join(root, "server", "index.mjs")], {
    cwd: root,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      DATABASE_URL: "",
      BSC_RPC_URL: "",
      BSC_WS_URL: "",
      OPENAI_API_KEY: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stderr.on("data", (chunk) => { output += chunk; });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server startup timed out: ${output}`)), 10000);
    const finish = (error) => {
      clearTimeout(timeout);
      child.off("error", onError);
      child.off("exit", onExit);
      child.stdout.off("data", onData);
      error ? reject(error) : resolve();
    };
    const onError = (error) => finish(error);
    const onExit = (code) => finish(new Error(`Server exited (${code}): ${output}`));
    const onData = (chunk) => {
      output += chunk;
      if (output.includes("Farmer Agent app running")) finish();
    };
    child.once("error", onError);
    child.once("exit", onExit);
    child.stdout.on("data", onData);
  });

  return (path, { method = "GET", body, headers = {} } = {}) => new Promise((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port, path, method, headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("error", reject);
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({ status: res.statusCode, headers: res.headers, text, json: () => JSON.parse(text) });
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => req.destroy(new Error("Request timed out")));
    req.end(body);
  });
}

const post = (body = {}) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body)
});

test("malformed URL escapes return 400 and leave the server running", async (t) => {
  const call = await startApp(t);
  for (const path of ["/%", "/%E0%A4%A", "/%00"]) {
    assert.equal((await call(path)).status, 400);
  }
  assert.equal((await call("/api/health")).status, 200);
});

test("directory requests return 404 while public pages and HEAD still work", async (t) => {
  const call = await startApp(t);
  assert.equal((await call("/cloud")).status, 404);
  assert.equal((await call("/assets/")).status, 404);
  for (const path of ["/", "/dashboard", "/en/dashboard"]) {
    const page = await call(path);
    assert.equal(page.status, 200);
    assert.match(page.headers["content-type"], /text\/html/);
  }
  const head = await call("/dashboard", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.text, "");
});

test("invalid JSON and non-object bodies cannot create agents", async (t) => {
  const call = await startApp(t);
  const initial = (await call("/api/goo/agents")).json().agents.length;
  for (const body of ["{broken", "null", "[]", '"text"', "42"]) {
    const response = await call("/api/goo/agents/spawn", { ...post(), body });
    assert.equal(response.status, 400, body);
  }
  assert.equal((await call("/api/goo/agents")).json().agents.length, initial);
  assert.equal((await call("/api/goo/agents/spawn", post())).status, 200);
});

test("oversized JSON is rejected without changing state", async (t) => {
  const call = await startApp(t);
  const initial = (await call("/api/goo/agents")).json().agents.length;
  const response = await call("/api/goo/agents/spawn", post({ strategy: "x".repeat(65536) }));
  assert.equal(response.status, 413);
  assert.equal((await call("/api/goo/agents")).json().agents.length, initial);
});

test("concurrent spawns preserve every agent and assign distinct IDs", async (t) => {
  const call = await startApp(t);
  const initial = (await call("/api/goo/agents")).json().agents.length;
  const responses = await Promise.all(Array.from({ length: 20 }, (_, i) =>
    call("/api/goo/agents/spawn", post({ strategy: `strategy-${i}`, treasury: 1 }))
  ));
  assert.ok(responses.every((response) => response.status === 200));
  const created = responses.map((response) => response.json().agent);
  assert.equal(new Set(created.map((agent) => agent.id)).size, 20);
  const stored = (await call("/api/goo/agents")).json().agents;
  assert.equal(stored.length, initial + 20);
  for (const agent of created) assert.ok(stored.some((item) => item.id === agent.id));
});

test("a concurrent harvest claim succeeds once and produces one ledger entry", async (t) => {
  const call = await startApp(t);
  const initial = (await call("/api/airdrop/status")).json();
  const wallet = initial.recipients[0].wallet;
  const responses = await Promise.all(Array.from({ length: 8 }, () =>
    call("/api/airdrop/claim", post({ wallet }))
  ));
  assert.equal(responses.filter((response) => response.status === 200).length, 1);
  assert.equal(responses.filter((response) => response.status === 409).length, 7);
  const current = (await call("/api/airdrop/status")).json();
  assert.equal(current.ledger.length, initial.ledger.length + 1);
  assert.equal(current.summary.rehearsalRuns, initial.summary.rehearsalRuns + 1);
});

test("repeat acquisitions cannot increase absorption weights again", async (t) => {
  const call = await startApp(t);
  const initial = (await call("/api/goo/agents")).json();
  const agent = initial.agents.find((item) => !item.acquired && item.status !== "active");
  const path = `/api/goo/agents/${agent.id}/acquire`;
  assert.equal((await call(path, post())).status, 200);
  assert.equal((await call(path, post())).status, 409);
  const current = (await call("/api/absorption/status")).json();
  assert.equal(current.totalAbsorbed, initial.absorption.totalAbsorbed + 1);
});

test("a rejected mutation does not block the following valid request", async (t) => {
  const call = await startApp(t);
  assert.equal((await call("/api/airdrop/claim", post({ wallet: "unknown" }))).status, 404);
  assert.equal((await call("/api/goo/agents/spawn", post())).status, 200);
  assert.equal((await call("/api/health")).status, 200);
});

test("concurrent acquisitions count an agent once and reject active agents", async (t) => {
  const call = await startApp(t);
  const initial = (await call("/api/goo/agents")).json();
  const active = (await call("/api/goo/agents/spawn", post())).json().agent;
  assert.equal((await call(`/api/goo/agents/${active.id}/acquire`, post())).status, 409);
  const agent = initial.agents.find((item) => !item.acquired && item.status !== "active");
  const responses = await Promise.all(Array.from({ length: 8 }, () =>
    call(`/api/goo/agents/${agent.id}/acquire`, post())
  ));
  assert.equal(responses.filter((response) => response.status === 200).length, 1);
  assert.equal(responses.filter((response) => response.status === 409).length, 7);
  assert.equal((await call("/api/absorption/status")).json().totalAbsorbed,
    initial.absorption.totalAbsorbed + 1);
});

test("malformed cookies do not break sign-in and session cookies are HttpOnly", async (t) => {
  const call = await startApp(t);
  assert.deepEqual((await call("/api/cloud/session", {
    headers: { cookie: "farmer_session=%" }
  })).json(), { authenticated: false });
  const flow = (await call("/api/eliza-cloud/hosted/start", post())).json();
  const completed = await call("/api/eliza-cloud/hosted/complete", post({ sessionId: flow.sessionId }));
  assert.equal(completed.status, 200);
  const cookie = completed.headers["set-cookie"][0];
  assert.match(cookie, /; HttpOnly(?:;|$)/);
  const headers = { cookie: `unrelated=%; ${cookie.split(";")[0]}` };
  assert.equal((await call("/api/cloud/session", { headers })).json().authenticated, true);
  assert.equal((await call("/api/cloud/agents", { headers })).status, 200);
});

test("mock sign-in renders session IDs as text without executable markup", async (t) => {
  const call = await startApp(t);
  const sessionId = '</script><script>globalThis.injected=true</script><img src=x onerror="alert(1)">';
  const page = await call(`/auth/mock-cloud?session=${encodeURIComponent(sessionId)}`);
  assert.equal(page.status, 200);
  assert.ok(!page.text.includes(sessionId));
  assert.ok(page.text.includes("&lt;/script&gt;"));
  const scripts = [...page.text.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  let handler;
  let sentBody;
  const context = {
    document: { getElementById: () => ({ addEventListener: (_, fn) => { handler = fn; } }) },
    fetch: async (_, options) => { sentBody = JSON.parse(options.body); },
    window: { location: {} }
  };
  runInNewContext(scripts[0][1], context);
  await handler();
  assert.equal(context.injected, undefined);
  assert.equal(sentBody.sessionId, sessionId);
});
