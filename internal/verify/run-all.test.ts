import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { verifyLessons, type VerifyOptions } from "./run-all";

const root = path.resolve(import.meta.dirname, "..", "..");
let tmp: string;
let lines: string[];
let base: Omit<VerifyOptions, "range" | "examplesOnly">;

function write(rel: string, text: string): void {
  const p = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}
const checkOf = (key: string) =>
  `export default { "${key}": { check(run: { stdout: string }) { if (!run.stdout.includes("สวัสดี")) throw new Error("ไม่พบคำทักทาย"); } } };\n`;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dn-runall-"));
  const hello = 'console.log("สวัสดี");\n';
  write("lessons/001-ok/example.ts", hello);
  write("lessons/002-broken/example.ts", hello);
  write("lessons/003-ok/example.ts", hello);
  write("lessons/004-a/example.ts", hello);
  write("lessons/004-b/example.ts", hello);
  write("lessons/005-exonly/exercise-1.ts", hello);
  for (const n of ["001", "003", "004"]) write(`checks/${n}.ts`, checkOf("example"));
  write("checks/002.ts", 'import "./missing-module";\n' + checkOf("example"));
  write("checks/005.ts", checkOf("exercise-1"));
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
beforeEach(() => {
  lines = [];
  base = {
    root, lessonsDir: path.join(tmp, "lessons"), checksDir: path.join(tmp, "checks"),
    provider: "google", env: {}, repeat: 1, log: (l) => lines.push(l),
  };
});

describe("verifyLessons", () => {
  it("ไฟล์เกณฑ์ตรวจที่ import พังไม่ทำให้บทอื่นหยุด", async () => {
    const s = await verifyLessons({ ...base, range: null, examplesOnly: false });
    expect(lines.join("\n")).toContain("❌ 002 โหลดเกณฑ์ตรวจไม่ได้ (internal/checks/002.ts)");
    expect(lines.join("\n")).toContain("✅ 003 example #1");
    expect(s).toMatchObject({ passed: 3, failed: 2, runs: 3, exitCode: 1 });
  });
  it("เลขบทซ้ำขึ้น ❌ และไม่รัน", async () => {
    const s = await verifyLessons({ ...base, range: { lo: 4, hi: 4 }, examplesOnly: false });
    expect(lines).toContain("❌ บท 004 มีหลายโฟลเดอร์: 004-a, 004-b ข้ามบทนี้");
    expect(s).toMatchObject({ passed: 0, failed: 1, runs: 0, exitCode: 1 });
  });
  it("ช่วงที่ไม่มีบทจบด้วย exit 1", async () => {
    const s = await verifyLessons({ ...base, range: { lo: 999, hi: 999 }, examplesOnly: false });
    expect(lines).toContain("ไม่พบบทในช่วงที่ระบุ (999–999)");
    expect(s).toMatchObject({ runs: 0, exitCode: 1 });
  });
  it("ได้ 0 รอบถือว่าไม่ผ่าน", async () => {
    const s = await verifyLessons({ ...base, range: { lo: 5, hi: 5 }, examplesOnly: true });
    expect(lines).toContain("– 005 ไม่มีไฟล์ให้รัน");
    expect(lines).toContain("ไม่มีไฟล์ให้ตรวจเลย (0 รอบ) ตรวจเลขบทและ --examples-only อีกครั้ง");
    expect(s).toMatchObject({ runs: 0, exitCode: 1 });
  });
  it("ผ่านหมดได้ exit 0", async () => {
    const s = await verifyLessons({ ...base, range: { lo: 1, hi: 1 }, examplesOnly: false });
    expect(s).toMatchObject({ passed: 1, failed: 0, exitCode: 0 });
    expect(lines.some((l) => l.startsWith("สรุป") || l.includes("สรุป: ผ่าน 1 ไม่ผ่าน 0"))).toBe(true);
  });
});
