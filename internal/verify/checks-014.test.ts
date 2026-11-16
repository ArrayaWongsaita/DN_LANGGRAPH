import { describe, expect, it } from "vitest";
import checks from "../checks/014";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "014", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

const STEP1 = [
  "--- ขั้นที่ 1: จำกัดงานพร้อมกัน (งานปลอม) ---",
  "ไม่จำกัด: พร้อมกันสูงสุด 5",
  "จำกัด 2: พร้อมกันสูงสุด 2",
  "ลำดับผล: 1, 2, 3, 4, 5",
];
const answers = (n: number, text = "แก้วสวยทนทาน"): string[] => Array.from({ length: n }, (_, i) => `ข้อ ${i + 1}: ${text}`);
const step2 = (peak: string, count: number, lines: string[]): string[] => [
  "--- ขั้นที่ 2: model.batch กับ maxConcurrency 2 ---", `งานพร้อมกันสูงสุด: ${peak}`, `ได้คำตอบ: ${count} ข้อ`, ...lines,
];

describe("เกณฑ์ตรวจบท 014 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ", () => {
    expect(() => check(run([...STEP1, ...step2("2", 5, answers(5))].join("\n")))).not.toThrow();
    expect(() => check(run([...STEP1, ...step2("1", 5, answers(5))].join("\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 ผิด งานพร้อมกันเกิน 2 หรือเป็น 0 หรือไม่ใช่ตัวเลข", () => {
    expect(() => check(run([...STEP1.map((l) => l.replace("สูงสุด 2", "สูงสุด 3")), ...step2("2", 5, answers(5))].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("3", 5, answers(5))].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("0", 5, answers(5))].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("undefined", 5, answers(5))].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อได้คำตอบไม่ครบ ผิดลำดับ ว่าง หรือไม่ใช่ไทย", () => {
    expect(() => check(run([...STEP1, ...step2("2", 4, answers(4))].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("2", 5, [...answers(5)].reverse())].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("2", 5, answers(5, "undefined"))].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("2", 5, answers(5, "nice cup"))].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("2", 5, answers(5, ""))].join("\n")))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 014 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  const lines = (ok: string[]): string => [...ok, "สำเร็จ 4 ล้มเหลว 1", "ตรวจนับตัวอย่าง: สำเร็จ 2 ล้มเหลว 1"].join("\n");
  const SAMPLE = "ตรวจนับตัวอย่าง: สำเร็จ 2 ล้มเหลว 1";
  const items = ["ข้อ 1: สำเร็จ", "ข้อ 2: ล้มเหลว (ข้อนี้ตั้งใจให้ล้ม)", "ข้อ 3: สำเร็จ", "ข้อ 4: สำเร็จ", "ข้อ 5: สำเร็จ"];
  it("ผ่านเมื่อสรุปตรงกับรายข้อ", () => {
    expect(() => check(run(lines(items)))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อไม่มีข้อล้ม ผลรวมไม่ใช่ 5 หรือสรุปไม่ตรงรายข้อ", () => {
    expect(() => check(run(["ข้อ 1: สำเร็จ", "ข้อ 2: สำเร็จ", "ข้อ 3: สำเร็จ", "ข้อ 4: สำเร็จ", "ข้อ 5: สำเร็จ", "สำเร็จ 5 ล้มเหลว 0", "ตรวจนับตัวอย่าง: สำเร็จ 2 ล้มเหลว 1"].join("\n")))).toThrow();
    expect(() => check(run([...items, "สำเร็จ 3 ล้มเหลว 1", SAMPLE].join("\n")))).toThrow();
    expect(() => check(run([...items, "สำเร็จ 3 ล้มเหลว 2", SAMPLE].join("\n")))).toThrow();
    expect(() => check(run([...items, "สำเร็จ undefined ล้มเหลว undefined", SAMPLE].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ countResults คืนค่าคงที่ (ชุดตัวอย่างไม่ตรง หรือไม่มีบรรทัด)", () => {
    expect(() => check(run([...items, "สำเร็จ 4 ล้มเหลว 1", "ตรวจนับตัวอย่าง: สำเร็จ 4 ล้มเหลว 1"].join("\n")))).toThrow();
    expect(() => check(run([...items, "สำเร็จ 4 ล้มเหลว 1"].join("\n")))).toThrow();
    expect(() => check(run([...items, "สำเร็จ 4 ล้มเหลว 1", "ตรวจนับตัวอย่าง: สำเร็จ undefined ล้มเหลว undefined"].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อข้อที่ล้มไม่มีข้อความ error", () => {
    expect(() => check(run(lines(items.map((l) => l.replace("ข้อนี้ตั้งใจให้ล้ม", "undefined")))))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 014 (exercise-2)", () => {
  const check = checks["exercise-2.ollama"].check;
  const out = (k: string, n: string, count = 6): string => `maxConcurrency: ${k}\nงานพร้อมกันสูงสุด: ${n}\nได้คำตอบ: ${count} ข้อ\n`;
  it("ผ่านเมื่อ N ไม่เกิน K", () => {
    expect(() => check(run(out("2", "2")))).not.toThrow();
    expect(() => check(run(out("1", "1")))).not.toThrow();
    expect(() => check(run(out("3", "2")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อ K นอกช่วง N เกิน K N เป็น 0 หรือได้คำตอบไม่ครบ", () => {
    expect(() => check(run(out("4", "2")))).toThrow();
    expect(() => check(run(out("0", "0")))).toThrow();
    expect(() => check(run(out("2", "3")))).toThrow();
    expect(() => check(run(out("2", "0")))).toThrow();
    expect(() => check(run(out("2", "2", 5)))).toThrow();
    expect(() => check(run("👉 ยังไม่ได้เติม pickConcurrency (ดูบรรทัดที่มี 👉)\n"))).toThrow();
  });
});
