import { CheckFailure, expectIncludes, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const STEP1 = "--- ขั้นที่ 1: ไม่ส่งประวัติ vs ส่งประวัติ (โมเดลปลอม) ---";
const STEP2 = "--- ขั้นที่ 2: แชทบอท DN Shop (พิมพ์ จบ เพื่อออก) ---";
const STEP1_LINES = ["ไม่ส่งประวัติ: ส่งไป 1 ข้อความ → ไม่ทราบชื่อครับ", "ส่งประวัติ: ส่งไป 3 ข้อความ → คุณชื่อสมชายครับ"];

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
  expectIncludes(run.stdout, "ลาก่อนครับ", label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");

// คำตอบ = ข้อความหลัง "ผู้ช่วย: " แต่ละครั้ง ถึงก่อน "\nคุณ: " หรือ "\nลาก่อนครับ"
export function extractReplies(stdout: string): string[] {
  const out = norm(stdout);
  return [...out.matchAll(/ผู้ช่วย: ([\s\S]*?)(?=\nคุณ: |\nลาก่อนครับ)/g)].map((m) => m[1].trim());
}

function expectReplies(run: RunResult, count: number, label: string): string[] {
  const replies = extractReplies(run.stdout);
  if (replies.length !== count) throw new CheckFailure(`${label}: ต้องได้ ${count} คำตอบ (ได้ ${replies.length})`);
  replies.forEach((r, i) => {
    if (r === "" || /^(undefined|null)$/.test(r)) throw new CheckFailure(`${label}: คำตอบที่ ${i + 1} ว่างหรือเป็น ${r || "ค่าว่าง"}`);
    expectThai(r, `${label} (คำตอบที่ ${i + 1})`);
  });
  return replies;
}

function expectHistory(out: string, count: number, label: string): void {
  const m = expectMatches(out, /^จำนวนข้อความในประวัติ: (\d+)$/m, `${label} (จำนวนข้อความในประวัติ)`);
  if (Number(m[1]) !== count) throw new CheckFailure(`${label}: จำนวนข้อความในประวัติต้องเป็น ${count} (ได้ ${m[1]})`);
}

const example = (label: string): FileCheck => ({
  input: ["สวัสดี ฉันชื่อสมชาย", "", "ฉันชื่ออะไร", "จบ"],
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const step1 = linesOf(extractSection(out, STEP1, STEP2, label));
    if (step1.join("\n") !== STEP1_LINES.join("\n")) throw new CheckFailure(`${label}: ผลขั้นที่ 1 ไม่ตรงกับที่ต้องได้\n${step1.join("\n")}`);
    const replies = expectReplies(run, 2, label);
    // คำตอบที่ 2 ต้องจำชื่อได้ (มาจากประวัติที่ส่งไป)
    if (!replies[1].includes("สมชาย")) throw new CheckFailure(`${label}: คำตอบที่ 2 ต้องมีคำว่า สมชาย (โมเดลต้องเห็นประวัติ)`);
    expectHistory(out, 5, label);
  },
});

const exercise1 = (label: string): FileCheck => ({
  // ไม่มี "จบ" ตั้งใจ: ทดสอบว่า input หมด (EOF) แล้วโปรแกรมจบเองด้วย exit 0
  input: ["ฉันชื่อสมชาย", "/ล้าง", "ฉันชื่ออะไร"],
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    expectMatches(out, /^ล้างประวัติแล้ว$/m, `${label} (ล้างประวัติแล้ว)`);
    expectReplies(run, 2, label);
    expectHistory(out, 3, label);
  },
});

const exercise2 = (label: string): FileCheck => ({
  input: ["ฉันชื่อสมชาย", "ชอบกาแฟคั่วเข้ม", "มีเมล็ดกาแฟแนะนำไหม", "ราคาเท่าไร", "จบ"],
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    if (/\(เตือน:/.test(out)) throw new CheckFailure(`${label}: trimHistory คืนรูปร่างไม่ถูก (${/\(เตือน:[^)]*\)/.exec(out)?.[0] ?? ""})`);
    const sent = [...out.matchAll(/^\(ส่งไป (\d+) ข้อความ\)$/gm)].map((m) => Number(m[1]));
    if (sent.join(",") !== "2,4,4,4") throw new CheckFailure(`${label}: (ส่งไป N ข้อความ) ต้องเป็น 2, 4, 4, 4 ตามลำดับ (ได้ ${sent.join(", ") || "ไม่มีเลย"})`);
    expectReplies(run, 4, label);
    expectHistory(out, 9, label);
  },
});

const exercise3 = (label: string): FileCheck => ({
  input: ["สวัสดี ฉันชื่อสมชาย", "ฉันชื่ออะไร", "จบ"],
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    expectReplies(run, 2, label);
    const usage = [...out.matchAll(/^\(token ขาเข้า (\d+) ขาออก (\d+)\)$/gm)].map((m) => ({ input: Number(m[1]), output: Number(m[2]) }));
    if (usage.length !== 2) throw new CheckFailure(`${label}: ต้องมี "(token ขาเข้า N ขาออก M)" 2 ครั้ง (ได้ ${usage.length}) ตัวเลขต้องเป็นจำนวนเต็ม ไม่ใช่ "ไม่มี" หรือ undefined`);
    usage.forEach((u, i) => {
      if (u.input <= 0 || u.output <= 0) throw new CheckFailure(`${label}: ตาที่ ${i + 1} ต้องมี token ขาเข้าและขาออกมากกว่า 0 (ได้ ${u.input} และ ${u.output})`);
    });
    // ตาที่ 2 ส่งประวัติยาวขึ้น token ขาเข้าต้องมากขึ้น (กันคืนค่าคงที่)
    if (usage[1].input <= usage[0].input) throw new CheckFailure(`${label}: token ขาเข้าตาที่ 2 (${usage[1].input}) ต้องมากกว่าตาที่ 1 (${usage[0].input})`);
  },
});

export default {
  "example.ollama": example("example.ollama"),
  "example.google": example("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama"),
  "exercise-2.google": exercise2("exercise-2.google"),
  "exercise-3.ollama": exercise3("exercise-3.ollama"),
  "exercise-3.google": exercise3("exercise-3.google"),
} satisfies Record<string, FileCheck>;
