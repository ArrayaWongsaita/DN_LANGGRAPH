import { describe, expect, it } from "vitest";
import checks from "../checks/015";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "015", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

const STEP1 = ["--- ขั้นที่ 1: for await กับ stream ปลอม ---", "ร้าน|เปิด|ทุก|วัน", "ได้ 4 ชิ้น รวมเป็น: ร้านเปิดทุกวัน"];
const step2 = (text: string, pieces: string, chars: string): string[] => [
  "--- ขั้นที่ 2: stream จากโมเดลจริง ---", text, `ชิ้นที่มีข้อความ: ${pieces}`, `ความยาวรวม: ${chars} ตัวอักษร`,
];
const ABORT = ["--- หยุดกลางทางด้วย AbortController ---", "กาแฟมีประวัติ", "หยุดกลางทาง หลังได้ 3 ชิ้น"];
const good = (): string[] => [...STEP1, ...step2("เก็บในที่เย็นและแห้ง", "5", "20"), ...ABORT];

describe("เกณฑ์ตรวจบท 015 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ", () => {
    expect(() => check(run(good().join("\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 ผิด", () => {
    expect(() => check(run([...STEP1.slice(0, 2), "ได้ 3 ชิ้น รวมเป็น: ร้านเปิดทุกวัน", ...step2("เก็บในที่เย็น", "5", "20"), ...ABORT].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อไม่ได้ stream (ชิ้นเดียว) ความยาว 0 หรือไม่ใช่ตัวเลข", () => {
    expect(() => check(run([...STEP1, ...step2("เก็บในที่เย็น", "1", "20"), ...ABORT].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("เก็บในที่เย็น", "5", "0"), ...ABORT].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("เก็บในที่เย็น", "undefined", "20"), ...ABORT].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อข้อความ stream ว่าง ไม่ใช่ไทย หรือเป็น undefined", () => {
    expect(() => check(run([...STEP1, ...step2("", "5", "20"), ...ABORT].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("keep it dry", "5", "20"), ...ABORT].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("undefined", "5", "20"), ...ABORT].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อหยุดกลางทางไม่ครบ 3 ชิ้น หรือไม่มีบรรทัดนั้น", () => {
    expect(() => check(run(good().join("\n").replace("หลังได้ 3 ชิ้น", "หลังได้ 4 ชิ้น")))).toThrow();
    expect(() => check(run(good().slice(0, -1).join("\n")))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 015 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  const text = "เก็บในที่เย็น"; // 13 ตัวอักษร
  const out = (streamed: string, n: string, ms = "120 ms"): string => `${streamed}\nได้ทั้งหมด: ${n} ตัวอักษร\nใช้เวลาถึงชิ้นแรก: ${ms}\n`;
  it("ผ่านเมื่อความยาวตรงกับข้อความที่พิมพ์", () => {
    expect(() => check(run(out(text, String([...text].length))))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อคืนค่าคงที่ (ความยาวไม่ตรงข้อความที่ stream) หรือ 0", () => {
    expect(() => check(run(out(text, "2")))).toThrow();
    expect(() => check(run(out("", "0")))).toThrow();
  });
  it("ไม่ผ่านเมื่อไม่มีเวลาถึงชิ้นแรก หรือเป็นค่าที่ไม่ใช่ตัวเลข", () => {
    expect(() => check(run(out(text, String([...text].length), "ไม่มี")))).toThrow();
    expect(() => check(run(out(text, String([...text].length), "undefined ms")))).toThrow();
    expect(() => check(run(`${text}\nได้ทั้งหมด: ${[...text].length} ตัวอักษร\n`))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 015 (exercise-2)", () => {
  const check = checks["exercise-2.ollama"].check;
  const SAMPLE = "ตรวจตัวอย่าง: 49 ตัว=false 50 ตัว=true";
  it("ผ่านเมื่อหยุดที่ 50 ตัวอักษรขึ้นไป", () => {
    expect(() => check(run(`${SAMPLE}\nข้อความ\nหยุดเมื่อได้ 58 ตัวอักษร (ตั้งไว้ 50)\n`))).not.toThrow();
    expect(() => check(run(`${SAMPLE}\nข้อความ\nหยุดเมื่อได้ 50 ตัวอักษร (ตั้งไว้ 50)\n`))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อหยุดเร็วเกินไป หรือไม่ใช่ตัวเลข", () => {
    expect(() => check(run(`${SAMPLE}\nหยุดเมื่อได้ 12 ตัวอักษร (ตั้งไว้ 50)\n`))).toThrow();
    expect(() => check(run(`${SAMPLE}\nหยุดเมื่อได้ undefined ตัวอักษร (ตั้งไว้ 50)\n`))).toThrow();
  });
  it("ไม่ผ่านเมื่อ shouldStop คืนค่าคงที่ (ตรวจตัวอย่างไม่ตรง)", () => {
    for (const sample of ["49 ตัว=true 50 ตัว=true", "49 ตัว=false 50 ตัว=false", "49 ตัว=undefined 50 ตัว=undefined"]) {
      expect(() => check(run(`ตรวจตัวอย่าง: ${sample}\nหยุดเมื่อได้ 58 ตัวอักษร (ตั้งไว้ 50)\n`))).toThrow();
    }
    expect(() => check(run("หยุดเมื่อได้ 58 ตัวอักษร (ตั้งไว้ 50)\n"))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 015 (ทุกไฟล์)", () => {
  it("ไม่ผ่านเมื่อ exit code ไม่ใช่ 0", () => {
    const bad = { ...run(good().join("\n")), exitCode: 1 };
    expect(() => checks["example.google"].check(bad)).toThrow();
  });
});
