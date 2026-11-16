import { describe, expect, it } from "vitest";
import checks, { extractReplies } from "../checks/016";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "016", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

const STEP1 = [
  "--- ขั้นที่ 1: ไม่ส่งประวัติ vs ส่งประวัติ (โมเดลปลอม) ---",
  "ไม่ส่งประวัติ: ส่งไป 1 ข้อความ → ไม่ทราบชื่อครับ",
  "ส่งประวัติ: ส่งไป 3 ข้อความ → คุณชื่อสมชายครับ",
];
const HEAD2 = "--- ขั้นที่ 2: แชทบอท DN Shop (พิมพ์ จบ เพื่อออก) ---";
const EXAMPLE = [
  ...STEP1, HEAD2,
  "คุณ: สวัสดี ฉันชื่อสมชาย", "ผู้ช่วย: สวัสดีครับ คุณสมชาย",
  "คุณ: ", "คุณ: ฉันชื่ออะไร", "ผู้ช่วย: คุณชื่อสมชายครับ",
  "คุณ: จบ", "ลาก่อนครับ", "จำนวนข้อความในประวัติ: 5",
].join("\n");

describe("extractReplies", () => {
  it("แยกคำตอบหลายบรรทัดและตัดที่ คุณ: หรือ ลาก่อนครับ", () => {
    const out = "คุณ: ก\nผู้ช่วย: บรรทัด 1\nบรรทัด 2\nคุณ: ข\nผู้ช่วย: จบแล้ว\nลาก่อนครับ\n";
    expect(extractReplies(out)).toEqual(["บรรทัด 1\nบรรทัด 2", "จบแล้ว"]);
  });
  it("รับ CRLF", () => {
    expect(extractReplies("ผู้ช่วย: สวัสดี\r\nลาก่อนครับ\r\n")).toEqual(["สวัสดี"]);
  });
});

describe("เกณฑ์ตรวจบท 016 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ", () => {
    expect(() => check(run(EXAMPLE))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 ผิด", () => {
    expect(() => check(run(EXAMPLE.replace("ไม่ทราบชื่อครับ", "คุณชื่อสมชายครับ")))).toThrow();
  });
  it("ไม่ผ่านเมื่อคำตอบที่ 2 ไม่จำชื่อ (ไม่ส่งประวัติ)", () => {
    expect(() => check(run(EXAMPLE.replace("ผู้ช่วย: คุณชื่อสมชายครับ", "ผู้ช่วย: ขออภัยครับ ไม่ทราบชื่อ")))).toThrow();
  });
  it("ไม่ผ่านเมื่อส่งบรรทัดว่างไปที่โมเดล (ได้ 3 คำตอบ หรือประวัติเป็น 7)", () => {
    const three = EXAMPLE.replace("คุณ: \n", "คุณ: \nผู้ช่วย: ขออภัยครับ\n").replace("จำนวนข้อความในประวัติ: 5", "จำนวนข้อความในประวัติ: 7");
    expect(() => check(run(three))).toThrow();
  });
  it("ไม่ผ่านเมื่อประวัติไม่ครบ 5 ไม่มีลาก่อนครับ คำตอบว่าง ไม่ใช่ไทย หรือ undefined", () => {
    expect(() => check(run(EXAMPLE.replace("จำนวนข้อความในประวัติ: 5", "จำนวนข้อความในประวัติ: 3")))).toThrow();
    expect(() => check(run(EXAMPLE.replace("จำนวนข้อความในประวัติ: 5", "จำนวนข้อความในประวัติ: undefined")))).toThrow();
    expect(() => check(run(EXAMPLE.replace("ลาก่อนครับ\n", "")))).toThrow();
    expect(() => check(run(EXAMPLE.replace("ผู้ช่วย: สวัสดีครับ คุณสมชาย", "ผู้ช่วย: ")))).toThrow();
    expect(() => check(run(EXAMPLE.replace("ผู้ช่วย: สวัสดีครับ คุณสมชาย", "ผู้ช่วย: hello")))).toThrow();
    expect(() => check(run(EXAMPLE.replace("ผู้ช่วย: สวัสดีครับ คุณสมชาย", "ผู้ช่วย: undefined")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ exit code ไม่ใช่ 0 และกำหนด input ครบ 4 บรรทัด", () => {
    expect(() => check({ ...run(EXAMPLE), exitCode: 1 })).toThrow();
    expect(checks["example.google"].input).toEqual(["สวัสดี ฉันชื่อสมชาย", "", "ฉันชื่ออะไร", "จบ"]);
  });
});

describe("เกณฑ์ตรวจบท 016 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  const good = [
    HEAD2, "คุณ: ฉันชื่อสมชาย", "ผู้ช่วย: ยินดีที่ได้รู้จักครับ", "คุณ: /ล้าง", "ล้างประวัติแล้ว",
    "คุณ: ฉันชื่ออะไร", "ผู้ช่วย: ขออภัยครับ ยังไม่ทราบชื่อ", "คุณ: ", "ลาก่อนครับ", "จำนวนข้อความในประวัติ: 3",
  ].join("\n");
  it("ผ่านเมื่อ input หมดโดยไม่มี จบ (ไม่มีบรรทัด คุณ: จบ)", () => {
    expect(() => check(run(good))).not.toThrow();
    expect(checks["exercise-1.google"].input).toEqual(["ฉันชื่อสมชาย", "/ล้าง", "ฉันชื่ออะไร"]);
  });
  it("ไม่ผ่านเมื่อไม่มีข้อความล้างประวัติ หรือประวัติไม่ถูกล้าง (5) หรือถือ /ล้าง เป็นคำถาม", () => {
    expect(() => check(run(good.replace("ล้างประวัติแล้ว\n", "")))).toThrow();
    expect(() => check(run(good.replace("จำนวนข้อความในประวัติ: 3", "จำนวนข้อความในประวัติ: 5")))).toThrow();
    expect(() => check(run(good.replace("ล้างประวัติแล้ว\n", "ล้างประวัติแล้ว\nผู้ช่วย: ได้ครับ\n").replace("จำนวนข้อความในประวัติ: 3", "จำนวนข้อความในประวัติ: 5")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ handleCommand คืน true ทุกครั้ง (ได้คำตอบไม่ครบ 2)", () => {
    const all = [HEAD2, "คุณ: ฉันชื่อสมชาย", "ล้างประวัติแล้ว", "คุณ: /ล้าง", "ล้างประวัติแล้ว", "คุณ: ฉันชื่ออะไร", "ล้างประวัติแล้ว", "คุณ: ", "ลาก่อนครับ", "จำนวนข้อความในประวัติ: 1"].join("\n");
    expect(() => check(run(all))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 016 (exercise-2)", () => {
  const check = checks["exercise-2.ollama"].check;
  const turns = (sent: number[]): string => [
    HEAD2,
    ...sent.flatMap((n, i) => [`คุณ: คำถาม ${i + 1}`, `(ส่งไป ${n} ข้อความ)`, `ผู้ช่วย: ตอบข้อ ${i + 1} ครับ`]),
    "คุณ: จบ", "ลาก่อนครับ", "จำนวนข้อความในประวัติ: 9",
  ].join("\n");
  it("ผ่านเมื่อเป็น 2, 4, 4, 4 และประวัติ 9", () => {
    expect(() => check(run(turns([2, 4, 4, 4])))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อไม่ตัด (2, 4, 6, 8) หรือตัดแล้วเลขผิด", () => {
    expect(() => check(run(turns([2, 4, 6, 8])))).toThrow();
    expect(() => check(run(turns([4, 4, 4, 4])))).toThrow();
    expect(() => check(run(turns([2, 3, 4, 4])))).toThrow();
    expect(() => check(run(turns([2, 4, 4])))).toThrow();
  });
  it("ไม่ผ่านเมื่อ history ถูกตัดทิ้งจริง (ประวัติไม่ใช่ 9) หรือมีคำเตือนรูปร่างผิด", () => {
    expect(() => check(run(turns([2, 4, 4, 4]).replace("ประวัติ: 9", "ประวัติ: 5")))).toThrow();
    expect(() => check(run(turns([2, 4, 4, 4]).replace("(ส่งไป 4 ข้อความ)", "(ส่งไป 4 ข้อความ)\n(เตือน: trimHistory ต้องคืน system)")))).toThrow();
  });
});

describe("เกณฑ์ตรวจบท 016 (exercise-3)", () => {
  const check = checks["exercise-3.ollama"].check;
  const chat = (tokens: string[]): string => [
    HEAD2,
    "คุณ: สวัสดี ฉันชื่อสมชาย", "ผู้ช่วย: สวัสดีครับ", tokens[0],
    "คุณ: ฉันชื่ออะไร", "ผู้ช่วย: คุณชื่อสมชายครับ", tokens[1],
    "คุณ: จบ", "ลาก่อนครับ", "จำนวนข้อความในประวัติ: 5",
  ].join("\n");
  it("ผ่านเมื่อ token มากกว่า 0 และขาเข้าตาที่ 2 มากกว่าตาที่ 1", () => {
    expect(() => check(run(chat(["(token ขาเข้า 30 ขาออก 8)", "(token ขาเข้า 52 ขาออก 9)"])))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อ token เป็น 0 ไม่มี undefined หรือจำนวนครั้งไม่ครบ", () => {
    expect(() => check(run(chat(["(token ขาเข้า 0 ขาออก 0)", "(token ขาเข้า 52 ขาออก 9)"])))).toThrow();
    expect(() => check(run(chat(["(token ขาเข้า ไม่มี ขาออก ไม่มี)", "(token ขาเข้า ไม่มี ขาออก ไม่มี)"])))).toThrow();
    expect(() => check(run(chat(["(token ขาเข้า undefined ขาออก undefined)", "(token ขาเข้า 52 ขาออก 9)"])))).toThrow();
    expect(() => check(run(chat(["", "(token ขาเข้า 52 ขาออก 9)"])))).toThrow();
  });
  it("ไม่ผ่านเมื่อ token ขาเข้าเท่าเดิมหรือลดลง (ค่าคงที่)", () => {
    expect(() => check(run(chat(["(token ขาเข้า 30 ขาออก 8)", "(token ขาเข้า 30 ขาออก 8)"])))).toThrow();
    expect(() => check(run(chat(["(token ขาเข้า 52 ขาออก 8)", "(token ขาเข้า 30 ขาออก 8)"])))).toThrow();
  });
});
