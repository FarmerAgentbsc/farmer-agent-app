import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function loadEnvFile(envPath) {
  let text = "";
  try {
    text = await readFile(envPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] != null && process.env[key] !== "") continue;
    process.env[key] = stripQuotes(rawValue.trim());
  }
}

export async function loadAppConfig(projectRoot) {
  await loadEnvFile(resolve(projectRoot, ".env"));

  return {
    appBaseUrl: process.env.APP_BASE_URL || "http://127.0.0.1:3000",
    host: process.env.HOST || "127.0.0.1",
    port: Number(process.env.PORT || 3000),
    databaseUrl: process.env.DATABASE_URL || "",
    bscRpcUrl: process.env.BSC_RPC_URL || "",
    bscWsUrl: process.env.BSC_WS_URL || "",
    openAIApiKey: process.env.OPENAI_API_KEY || ""
  };
}
