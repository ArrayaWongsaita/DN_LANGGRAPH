import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const STEP1 = "--- ขั้นที่ 1: จำกัดงานพร้อมกัน (งานปลอม) ---";
const STEP2 = "--- ขั้นที่ 2: model.batch กับ maxConcurrency 2 ---";
const STEP1_LINES = ["ไม่จำกัด: พร้อมกันสูงสุด 5", "จำกัด 2: พร้อมกันสูงสุด 2", "ลำดับผล: 1, 2, 3, 4, 5"];

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");

// อ่านตัวเลขของบรรทัด "<หัวข้อ>: N" (ต้องเป็นจำนวนเต็มล้วน ไม่รับ undefined/NaN)
function numberAfter(out: string, heading: string, label: string): number {
  const m = expectMatches(out, new RegExp(`^${heading}: (\\d+)$`, "m"), label);
  return Number(m[1]);
}

function expectRange(value: number, min: number, max: number, what: string, label: string): void {
  if (value < min || value > max) throw new CheckFailure(`${label}: ${what} ต้องอยู่ระหว่าง ${min} ถึง ${max} (ได้ ${value})`);
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const step1 = linesOf(extractSection(out, STEP1, STEP2, label));
    if (step1.join("\n") !== STEP1_LINES.join("\n")) throw new CheckFailure(`${label}: ผลขั้นที่ 1 ไม่ตรงกับที่ต้องได้\n${step1.join("\n")}`);
    const s2 = extractSection(out, STEP2, null, label);
    expectRange(numberAfter(s2, "งานพร้อมกันสูงสุด", label), 1, 2, "งานพร้อมกันสูงสุด", label);
    expectMatches(s2, /^ได้คำตอบ: 5 ข้อ$/m, `${label} (ได้คำตอบ: 5 ข้อ)`);
    // ข้อ 1 ถึง 5 ต้องมาตามลำดับ และแต่ละข้อเป็นภาษาไทย
    const answers = [...s2.matchAll(/^ข้อ (\d+): (.*)$/gm)];
    if (answers.map((m) => m[1]).join(",") !== "1,2,3,4,5") {
      throw new CheckFailure(`${label}: ต้องมีบรรทัด "ข้อ 1:" ถึง "ข้อ 5:" ตามลำดับ (ได้ ${answers.map((m) => m[1]).join(",") || "ไม่มีเลย"})`);
    }
    for (const m of answers) {
      const text = m[2].trim();
      if (text === "" || /^(undefined|null)$/.test(text)) throw new CheckFailure(`${label}: ข้อ ${m[1]} ว่างหรือเป็น ${text || "ค่าว่าง"}`);
      expectThai(text, `${label} (ข้อ ${m[1]})`);
    }
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const m = expectMatches(out, /^สำเร็จ (\d+) ล้มเหลว (\d+)$/m, `${label} (สรุป)`);
    const [ok, failed] = [Number(m[1]), Number(m[2])];
    if (ok + failed !== 5) throw new CheckFailure(`${label}: สำเร็จ ${ok} + ล้มเหลว ${failed} ต้องรวมเป็น 5`);
    if (ok < 1 || failed < 1) throw new CheckFailure(`${label}: ต้องมีทั้งข้อที่สำเร็จและข้อที่ล้มเหลวอย่างน้อยอย่างละ 1 (ได้ ${ok} และ ${failed})`);
    // ชุดตัวอย่างที่ 2 (["ก","ข",Error]) ต้องนับได้ 2 สำเร็จ 1 ล้มเหลว (กันคืนค่าคงที่)
    if (!/^ตรวจนับตัวอย่าง: สำเร็จ 2 ล้มเหลว 1$/m.test(out)) throw new CheckFailure(`${label}: ต้องมีบรรทัด "ตรวจนับตัวอย่าง: สำเร็จ 2 ล้มเหลว 1"`);
    // ตัวเลขสรุปต้องตรงกับบรรทัดรายข้อ (กันคืนตัวเลขคงที่)
    const items = [...out.matchAll(/^ข้อ (\d+): (สำเร็จ|ล้มเหลว \((.*)\))$/gm)];
    if (items.map((i) => i[1]).join(",") !== "1,2,3,4,5") throw new CheckFailure(`${label}: ต้องมีบรรทัด "ข้อ 1:" ถึง "ข้อ 5:" ตามลำดับ`);
    const itemOk = items.filter((i) => i[2] === "สำเร็จ").length;
    if (itemOk !== ok || items.length - itemOk !== failed) {
      throw new CheckFailure(`${label}: สรุป (สำเร็จ ${ok} ล้มเหลว ${failed}) ไม่ตรงกับบรรทัดรายข้อ (สำเร็จ ${itemOk} ล้มเหลว ${items.length - itemOk})`);
    }
    for (const i of items) {
      if (i[2] !== "สำเร็จ" && (i[3].trim() === "" || /\b(undefined|null)\b/.test(i[3]))) {
        throw new CheckFailure(`${label}: ข้อ ${i[1]} ล้มเหลวแต่ไม่มีข้อความ error ที่อ่านได้`);
      }
    }
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const k = numberAfter(out, "maxConcurrency", label);
    expectRange(k, 1, 3, "maxConcurrency", label);
    const n = numberAfter(out, "งานพร้อมกันสูงสุด", label);
    expectRange(n, 1, k, "งานพร้อมกันสูงสุด", label);
    expectMatches(out, /^ได้คำตอบ: 6 ข้อ$/m, label);
  },
});

export default {
  "example.ollama": example("example.ollama"),
  "example.google": example("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama"),
  "exercise-2.google": exercise2("exercise-2.google"),
} satisfies Record<string, FileCheck>;
