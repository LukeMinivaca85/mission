import { spawn } from "node:child_process";
import process from "node:process";

const PROJECT_NAME = process.env.CLOUDFLARE_PAGES_PROJECT || "mission";
const args = ["wrangler@latest", "pages", "deploy", ".", "--project-name", PROJECT_NAME];

const child = spawn("npx", args, {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code || 0);
});
