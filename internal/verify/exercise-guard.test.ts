import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { guardProblem, guardTargets, runGuard } from "./exercise-guard";

const root = path.resolve(import.meta.dirname, "..", "..");
let dir: string;
const lessonsDir = () => path.join(dir, "lessons");
const f = (rel: string) => path.join(lessonsDir(), ...rel.split("/"));

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "dn-guard-"));
  const w = (rel: string, body: string) => {
    fs.mkdirSync(path.dirname(f(rel)), { recursive: true });
    fs.writeFileSync(f(rel), body);
  };
  fs.writeFileSync(path.join(dir, "package.json"), '{"type":"module"}');
  const printed = 'console.log("👉 ยังไม่ได้เติม x");';
  w("007-a/exercise-1.ts", `// 👉 เติมตรงนี้\nexport async function main() {\n  ${printed}\n}\n`);
  w("007-a/exercise-2.ts", `// 👉 เติมตรงนี้\nexport async function main() {\n  try { await fetch("http://127.0.0.1:9"); } catch { /* ignore */ }\n  ${printed}\n}\n`);
  w("007-a/exercise-3.ts", `// 👉 เติมตรงนี้\nexport async function main() {\n  throw new Error("boom");\n}\n`);
  w("007-a/exercise-4.ts", `export async function main() {\n  ${printed}\n}\n`);
  w("006-b/exercise-1.ts", `// 👉 เติมตรงนี้\nexport async function main() {\n  ${printed}\n}\n`);
  w("007-a/helper.ts", `// 👉 เติมตรงนี้\nexport async function main() {\n  ${printed}\n}\n`);
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("exercise guard", () => {
  it("guardTargets เลือกเฉพาะ exercise ที่มี 👉 ในบท >= from", () =>
    expect(guardTargets(lessonsDir(), "007")).toEqual([f("007-a/exercise-1.ts"), f("007-a/exercise-2.ts"), f("007-a/exercise-3.ts")]));

  it("ผ่านเมื่อพิมพ์ 👉 และไม่เรียก API", async () => {
    const r = await runGuard(root, f("007-a/exercise-1.ts"));
    expect(guardProblem(r)).toBeNull();
  }, 60000);
  it("จับการเรียก fetch", async () => {
    const r = await runGuard(root, f("007-a/exercise-2.ts"));
    expect(guardProblem(r)).toBe("เรียก API ทั้งที่ยังไม่ได้เติม (1 ครั้ง)");
  }, 60000);
  it("จับ exit code ไม่เป็น 0", async () => {
    const r = await runGuard(root, f("007-a/exercise-3.ts"));
    expect(guardProblem(r)?.startsWith("exit code 1")).toBe(true);
  }, 60000);
  it("guardProblem: หมดเวลาและไม่มี 👉", () => {
    const base = { file: "x", exitCode: 0, stdout: "", stderr: "", fetchCalls: 0, timedOut: false };
    expect(guardProblem({ ...base, timedOut: true })).toBe("ค้างเกิน 30 วินาที");
    expect(guardProblem(base)).toBe("ไม่พิมพ์บรรทัด 👉 บอกผู้เรียน");
  });
});
