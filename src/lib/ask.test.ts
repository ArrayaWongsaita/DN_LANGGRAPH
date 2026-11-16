import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const askUrl = pathToFileURL(path.join(root, "src", "lib", "ask.ts")).href;
let dir: string;

beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "dn-ask-test-")); });
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

function lastLine(s: string): string {
  const parts = s.split("\n").filter((l) => l !== "");
  return parts[parts.length - 1] ?? "";
}

async function runAsk(times: number, input: string, opts: { keepStdinOpen?: boolean; killAfterMs?: number } = {}) {
  const script = path.join(dir, `ask-${times}-${Math.random().toString(36).slice(2)}.mts`);
  fs.writeFileSync(script,
    `import { ask } from ${JSON.stringify(askUrl)};\nconst out: (string | null)[] = [];\nfor (let i = 0; i < ${times}; i++) out.push(await ask("คุณ: "));\nconsole.log(JSON.stringify(out));\n`);
  return new Promise<{ stdout: string; exitCode: number | null; killed: boolean }>((resolve) => {
    const child = spawn(process.execPath, ["--import", "tsx", script], { cwd: root, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let killed = false;
    child.stdout.setEncoding("utf8").on("data", (d: string) => { stdout += d; });
    const timer = setTimeout(() => { killed = true; child.kill(); }, opts.killAfterMs ?? 20000);
    child.on("close", (code) => { clearTimeout(timer); resolve({ stdout, exitCode: code, killed }); });
    child.stdin.on("error", () => undefined);
    if (opts.keepStdinOpen) child.stdin.write(input);
    else child.stdin.end(input);
  });
}

describe("ask", () => {
  it("อ่านหลายบรรทัดที่ส่งมาพร้อมกันได้ครบตามลำดับ", async () => {
    const r = await runAsk(3, "สวัสดี\nจบ\n");
    expect(lastLine(r.stdout)).toBe(JSON.stringify(["สวัสดี", "จบ", null]));
  }, 30000);
  it("ภาษาไทยมีสระอำ วรรณยุกต์ และ CRLF จาก Windows ไม่เพี้ยน", async () => {
    const r = await runAsk(2, "น้ำเปล่า 2 ขวด ก่อนเที่ยง\r\n");
    expect(JSON.parse(lastLine(r.stdout))).toEqual(["น้ำเปล่า 2 ขวด ก่อนเที่ยง", null]);
  }, 30000);
  it("echo บรรทัดที่อ่านเมื่อ stdin ไม่ใช่ terminal", async () => {
    const r = await runAsk(3, "สวัสดี\n\n");
    expect(r.stdout.startsWith("คุณ: สวัสดี\nคุณ: \nคุณ: \n")).toBe(true);
    expect(JSON.parse(lastLine(r.stdout))).toEqual(["สวัสดี", "", null]);
  }, 30000);
  it("EOF แล้วถามต่อก็ยังได้ null ไม่ค้าง", async () => {
    const r = await runAsk(2, "");
    expect(JSON.parse(lastLine(r.stdout))).toEqual([null, null]);
    expect(r.exitCode).toBe(0);
  }, 30000);
  it("จบเองหลังถามครั้งสุดท้าย แม้ stdin ยังไม่ปิด", async () => {
    const r = await runAsk(1, "หนึ่ง\n", { keepStdinOpen: true, killAfterMs: 5000 });
    expect(r.killed).toBe(false);
    expect(r.exitCode).toBe(0);
  }, 30000);
});
