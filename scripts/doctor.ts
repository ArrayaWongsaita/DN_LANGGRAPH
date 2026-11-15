import fs from "node:fs";
import { formatResults, runDoctor } from "./lib/doctor-checks";

const ENV_PATH = ".env";

function readEnvFile(): string | null {
  try {
    return fs.readFileSync(ENV_PATH, "utf8");
  } catch {
    return null;
  }
}

try {
  if (fs.existsSync(ENV_PATH)) process.loadEnvFile(ENV_PATH);
} catch {
  // ไฟล์ .env อ่านไม่ได้: ให้ตัวตรวจรายงานเอง
}

const results = await runDoctor({
  env: process.env,
  fetch,
  nodeVersion: process.version,
  userAgent: process.env.npm_config_user_agent,
  readEnvFile,
});
console.log(formatResults(results));
if (results.some((r) => !r.ok)) process.exitCode = 1;
