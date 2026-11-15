import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runModule } from "./run";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const g = globalThis as unknown as { __dnRan?: string };
let dir: string;
let withMain: string;
let topLevel: string;
let envFixture: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "dn-run-"));
  withMain = path.join(dir, "with-main.ts");
  topLevel = path.join(dir, "top-level.ts");
  envFixture = path.join(dir, "env-fixture.ts");
  fs.writeFileSync(withMain, 'export function main() { (globalThis as any).__dnRan = "main"; }\n');
  fs.writeFileSync(topLevel, '(globalThis as any).__dnRan = "top";\n');
  const envUrl = pathToFileURL(path.join(repoRoot, "src", "lib", "env.ts")).href;
  fs.writeFileSync(envFixture, `import { env } from ${JSON.stringify(envUrl)};\nenv("GOOGLE_API_KEY");\n`);
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("runModule", () => {
  it("เรียก main() ถ้ามี", async () => { await runModule(withMain); expect(g.__dnRan).toBe("main"); });
  it("ไม่มี main → รันโค้ดบนสุดของไฟล์", async () => { await runModule(topLevel); expect(g.__dnRan).toBe("top"); });
  it("run-cli: EnvError → ข้อความไทยบรรทัดเดียว exit 1", () => {
    const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/run-cli.ts", envFixture], { cwd: repoRoot, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot }, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr.trim()).toBe("ยังไม่ได้ตั้งค่า GOOGLE_API_KEY ในไฟล์ .env (ดูวิธีตั้งในบท 005)");
  });
  it("pnpm lesson 999 → หาบทไม่เจอ exit 1", () => {
    const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/lesson.ts", "999"], { cwd: repoRoot, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("ไม่พบบท 999 ในโฟลเดอร์ lessons/");
  });
});
