import { spawn } from "node:child_process";
import process from "node:process";
import dotenv from "dotenv";

dotenv.config();

const PROJECT_NAME = process.env.CLOUDFLARE_PAGES_PROJECT || "mission";
const REQUIRED_SECRETS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_BUSINESS",
  "STRIPE_WEBHOOK_SECRET",
];
const OPTIONAL_SECRETS = [
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "OPENROUTER_FALLBACK_MODELS",
  "GITHUB_TOKEN",
  "SLACK_BOT_TOKEN",
  "GOOGLE_ACCESS_TOKEN",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_SHEET_ID",
  "NOTION_TOKEN",
  "HTTP_API_BASE_URL",
  "HTTP_API_TOKEN",
  "DATABASE_URL",
  "MCP_SERVER_URL",
  "MCP_SERVER_TOKEN",
  "DISCORD_WEBHOOK_URL",
  "LINEAR_API_KEY",
  "TRELLO_KEY",
  "TRELLO_TOKEN",
  "HUBSPOT_ACCESS_TOKEN",
];

const missing = REQUIRED_SECRETS.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Cloudflare secrets not synced. Missing local values: ${missing.join(", ")}`);
  console.error("Add them to .env first. Values are never printed by this script.");
  process.exit(1);
}

const secretsToSync = [...REQUIRED_SECRETS, ...OPTIONAL_SECRETS.filter((key) => process.env[key] && !REQUIRED_SECRETS.includes(key))];

for (const key of secretsToSync) {
  await putPagesSecret(key, process.env[key]);
}

console.log(`Cloudflare Pages secrets synced for project "${PROJECT_NAME}". Synced ${secretsToSync.length} key(s).`);

function putPagesSecret(key, value) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["wrangler@latest", "pages", "secret", "put", key, "--project-name", PROJECT_NAME],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      }
    );

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        console.log(`${key}: synced`);
        resolve();
        return;
      }

      reject(new Error(`${key}: wrangler exited with ${code}\n${redact(errorOutput || output)}`));
    });

    child.stdin.write(`${value}\n`);
    child.stdin.end();
  });
}

function redact(value) {
  return String(value || "").replace(/(sk|rk|whsec|price)_[A-Za-z0-9_]+/g, "$1_[redacted]");
}
