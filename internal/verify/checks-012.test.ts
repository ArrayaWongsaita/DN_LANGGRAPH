import { describe, expect, it } from "vitest";
import checks from "../checks/012";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "012", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

const STEP1 = [
  "--- ขั้นที่ 1: อ่าน error ให้ออก (error ปลอม) ---",
  "TypeError: fetch failed → ต่อ provider ไม่ได้",
  "status 404 → ไม่พบโมเดล",
  "status 401 → key ผิด",
  "status 429 → เรียกถี่เกิน",
].join("\n");

function exampleOllama(scenario3: string[]): string {
  return [
    STEP1, "--- ขั้นที่ 2: เจอ error จริง ---",
    "สถานการณ์ 1: ต่อ Ollama ไม่ได้", "  ชนิด: TypeError", "  status: -", "  ข้อความ: fetch failed", "  อธิบาย: ต่อไม่ได้",
    "สถานการณ์ 2: ชื่อโมเดลผิด", "  ชนิด: ResponseError", "  status: 404", "  ข้อความ: not found", "  อธิบาย: ไม่พบโมเดล",
    "สถานการณ์ 3: key ผิด", ...scenario3,
    "สถานการณ์ 4: ตั้งค่าถูกต้อง", "  คำตอบ: สวัสดีครับ",
  ].join("\n");
}

describe("เกณฑ์ตรวจบท 012", () => {
  const check = checks["example.ollama"].check;

  it("example.ollama ผ่านทั้งแบบข้าม (ต่อ Ollama ในเครื่อง) และแบบ status 401 (ต่อ Cloud ตรง)", () => {
    expect(() => check(run(exampleOllama(["  ข้าม: ทดลองได้เฉพาะตอนต่อ Ollama Cloud ตรง"])))).not.toThrow();
    expect(() => check(run(exampleOllama(["  ชนิด: ResponseError", "  status: 401", "  ข้อความ: unauthorized", "  อธิบาย: key ผิด"])))).not.toThrow();
  });

  it("example.ollama ไม่ผ่านเมื่อสถานการณ์ 3 ไม่ข้ามและ status ไม่ใช่ 401", () => {
    expect(() => check(run(exampleOllama(["  ชนิด: ResponseError", "  status: 500", "  ข้อความ: x", "  อธิบาย: y"])))).toThrow();
  });

  const ex1 = checks["exercise-1.ollama"].check;
  const ex1Out = (a: string, b: string): string =>
    `สถานการณ์ 1: ก\n  อธิบาย: ${a}\nสถานการณ์ 2: ข\n  อธิบาย: ${b}\n`;

  it("exercise-1 ไม่ผ่านเมื่อคืนข้อความคงที่ และผ่านเมื่อแยกกัน", () => {
    expect(() => ex1(run(ex1Out("เกิดข้อผิดพลาด", "เกิดข้อผิดพลาด")))).toThrow();
    expect(() => ex1(run(ex1Out("ต่อไม่ได้", "ไม่พบโมเดล")))).not.toThrow();
  });

  const ex1g = checks["exercise-1.google"].check;
  it("exercise-1.google ไม่ผ่านเมื่อทั้ง 3 สถานการณ์เหมือนกัน", () => {
    const same = [1, 2, 3].map((n) => `สถานการณ์ ${n}: ก\n  อธิบาย: เกิดข้อผิดพลาด`).join("\n");
    expect(() => ex1g(run(same))).toThrow();
    expect(() => ex1g(run(same.replace("เกิดข้อผิดพลาด", "ไม่พบโมเดล")))).not.toThrow();
  });

  const ex2 = (n: string, vals: string[]): string => vals.map((v, i) => `สถานการณ์ ${i + 1}: ก\n  ควรลองใหม่: ${v}`).join("\n") + n;
  it("exercise-2 ไม่ผ่านเมื่อตอบ ไม่ใช่ ทุกข้อ (สถานการณ์ 3 ต้องเป็น ใช่)", () => {
    expect(() => checks["exercise-2.google"].check(run(ex2("", ["ไม่ใช่", "ไม่ใช่", "ไม่ใช่"])))).toThrow();
    expect(() => checks["exercise-2.google"].check(run(ex2("", ["ไม่ใช่", "ไม่ใช่", "ใช่"])))).not.toThrow();
    expect(() => checks["exercise-2.ollama"].check(run(ex2("", ["ใช่", "ไม่ใช่", "ใช่"])))).not.toThrow();
  });
});
