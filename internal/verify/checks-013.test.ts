import { describe, expect, it } from "vitest";
import checks from "../checks/013";
import type { RunResult } from "./types";

function run(stdout: string, usage: RunResult["usage"] = null): RunResult {
  return {
    lesson: "013", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage,
  };
}

const STEP1 = [
  "--- ขั้นที่ 1: ลองใหม่เมื่อเจอ 429 (การเรียกปลอม) ---",
  "ครั้งที่ 1: ล้มเหลว (429) รอ 100 ms",
  "ครั้งที่ 2: ล้มเหลว (429) รอ 200 ms",
  "ครั้งที่ 3: สำเร็จ",
  "--- กรณี 401: ไม่ลองใหม่ ---",
  "ครั้งที่ 1: ล้มเหลว (401) หยุด เพราะลองใหม่ก็ไม่หาย",
];
const STEP2 = ["--- ขั้นที่ 2: timeout และลองใหม่กับโมเดลจริง ---", "ครั้งที่ 1: ล้มเหลว (TimeoutError)", "ครั้งที่ 2: สำเร็จ", "คำตอบ: เปิด 8 โมงเช้าครับ"];

describe("เกณฑ์ตรวจบท 013 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบทุกบรรทัด", () => {
    expect(() => check(run([...STEP1, ...STEP2].join("\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 ขาดบรรทัดหรือผิดตัวเลข", () => {
    expect(() => check(run([...STEP1.slice(0, 4), ...STEP2].join("\n")))).toThrow();
    expect(() => check(run([...STEP1.map((l) => l.replace("200 ms", "300 ms")), ...STEP2].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 2 ไม่มีการล้มก่อนสำเร็จ หรือคำตอบไม่ใช่ไทย", () => {
    expect(() => check(run([...STEP1, STEP2[0], "ครั้งที่ 1: สำเร็จ", "คำตอบ: เปิด 8 โมงเช้าครับ"].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...STEP2.slice(0, 3), "คำตอบ: open at 8"].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...STEP2.slice(0, 3), "คำตอบ: "].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อบรรทัดล้มเหลวมาหลังบรรทัดสำเร็จ", () => {
    expect(() => check(run([...STEP1, STEP2[0], STEP2[2], STEP2[1], STEP2[3]].join("\n")))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 013 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  const table = (v: string[]): string[] => v.map((x, i) => `รอก่อนลองครั้งที่ ${i + 2}: ${x} ms`);
  const tail = ["ครั้งที่ 1: ล้มเหลว (TimeoutError) รอ 500 ms", "ครั้งที่ 2: สำเร็จ", "คำตอบ: เปิด 8 โมงครับ"];
  it("ผ่านเมื่อตารางและ loop ถูก", () => {
    expect(() => check(run([...table(["500", "1000", "2000", "4000", "4000"]), ...tail].join("\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อค่าคงที่ ไม่มีเพดาน หรือมี undefined รั่ว", () => {
    expect(() => check(run([...table(["500", "500", "500", "500", "500"]), ...tail].join("\n")))).toThrow();
    expect(() => check(run([...table(["500", "1000", "2000", "4000", "8000"]), ...tail].join("\n")))).toThrow();
    expect(() => check(run([...table(["undefined", "undefined", "undefined", "undefined", "undefined"]), ...tail].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ loop ไม่พิมพ์เวลารอ 500 ms", () => {
    expect(() => check(run([...table(["500", "1000", "2000", "4000", "4000"]), "ครั้งที่ 1: ล้มเหลว (TimeoutError) รอ 0 ms", ...tail.slice(1)].join("\n")))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 013 (exercise-2)", () => {
  const out = (items: [number, number][], total: string): string =>
    items.map(([n, o], i) => `ข้อ ${i + 1}: ขาเข้า ${n} ขาออก ${o}`).join("\n") + `\n${total}\n`;
  const items: [number, number][] = [[10, 20], [11, 21], [12, 22]];
  const ok = out(items, "รวมทั้งหมด: ขาเข้า 33 ขาออก 63 รวม 96");
  it("ผ่านเมื่อผลรวมตรงและ usage ตรงกับที่วัด", () => {
    expect(() => checks["exercise-2.ollama"].check(run(ok, { input: 33, output: 63 }))).not.toThrow();
    expect(() => checks["exercise-2.ollama"].check(run(ok))).not.toThrow();
    expect(() => checks["exercise-2.google"].check(run(ok, { input: 1, output: 1 }))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อ addUsage ไม่บวก (ยอดรวมเป็น 0) หรือผลรวมผิด หรือ T ไม่เท่า N+M", () => {
    expect(() => checks["exercise-2.ollama"].check(run(out(items, "รวมทั้งหมด: ขาเข้า 0 ขาออก 0 รวม 0")))).toThrow();
    expect(() => checks["exercise-2.ollama"].check(run(out(items, "รวมทั้งหมด: ขาเข้า 33 ขาออก 60 รวม 93")))).toThrow();
    expect(() => checks["exercise-2.ollama"].check(run(out(items, "รวมทั้งหมด: ขาเข้า 33 ขาออก 63 รวม 100")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ token รายข้อเป็น 0 (usage_metadata หาย) หรือไม่ตรง usage ที่วัดได้ (ollama)", () => {
    expect(() => checks["exercise-2.ollama"].check(run(out([[0, 0], [0, 0], [0, 0]], "รวมทั้งหมด: ขาเข้า 0 ขาออก 0 รวม 0")))).toThrow();
    expect(() => checks["exercise-2.ollama"].check(run(ok, { input: 33, output: 99 }))).toThrow();
  });
});
