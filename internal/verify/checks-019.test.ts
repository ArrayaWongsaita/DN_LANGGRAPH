import { describe, expect, it } from "vitest";
import checks, { parseRound } from "../checks/019";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "019", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

const STEP1 = [
  "--- ขั้นที่ 1: ข้อความที่ส่งเมื่อมีตัวอย่าง ---",
  "system: แยกประเภทข้อความของลูกค้าร้าน DN Shop เป็น product, order, policy หรือ other",
  "user: มีแก้วเก็บความเย็นไหม", "assistant: product",
  "user: ขอเลขพัสดุของคำสั่งซื้อ O1005", "assistant: order",
  "user: ค่าส่งต่างจังหวัดเท่าไร", "assistant: policy",
  "user: แนะนำหนังสนุกๆ หน่อย", "assistant: other",
  "user: เมล็ดกาแฟคั่วอ่อนมีรสเปรี้ยวไหม",
  "รวม 10 ข้อความ",
];
const round = (labels: string[], y: number, x: number): string[] => [
  ...labels.map((l, i) => `ข้อ ${i + 1}: ${l}`), `รูปแบบถูก: ${y}/5`, `ตรงกับที่คาด: ${x}/5`,
];
const TESTS = ["product", "order", "policy", "other", "order"];
const ZERO = "--- ขั้นที่ 2: ไม่มีตัวอย่าง (zero-shot) ---";
const FEW = "--- ขั้นที่ 2: มีตัวอย่าง (few-shot) ---";
const example = (zero: string[], few: string[]): string => [...STEP1, ZERO, ...zero, FEW, ...few].join("\n");
const GOOD = example(round(["product", "order bla bla", "policy", "other", "order"], 4, 4), round(TESTS, 5, 5));

describe("parseRound", () => {
  it("นับ Y และ X เองจากบรรทัดรายข้อ และรับป้ายว่าง", () => {
    const r = parseRound(round(["product", "x", "", "other", "order"], 3, 3).join("\n").trim(), TESTS, "t");
    expect(r).toMatchObject({ formatOk: 3, matched: 3 });
  });
});

describe("เกณฑ์ตรวจบท 019 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และ CRLF", () => {
    expect(() => check(run(GOOD))).not.toThrow();
    expect(() => checks["example.google"].check(run(GOOD))).not.toThrow();
    expect(() => check(run(GOOD.replace(/\n/g, "\r\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 ไม่ตรง 12 บรรทัด", () => {
    expect(() => check(run(GOOD.replace("assistant: policy", "assistant: other")))).toThrow(/ขั้นที่ 1/);
    expect(() => check(run(GOOD.replace("รวม 10 ข้อความ", "รวม 9 ข้อความ")))).toThrow(/ขั้นที่ 1/);
  });
  it("ไม่ผ่านเมื่อขาดข้อ หรือเรียงผิด", () => {
    expect(() => check(run(GOOD.replace("ข้อ 3: policy\n", "")))).toThrow(/ข้อ 1:/);
    expect(() => check(run(GOOD.replace("ข้อ 2: order bla bla", "ข้อ 4: order")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ ตรงกับที่คาด หรือ รูปแบบถูก ไม่ตรงกับบรรทัดรายข้อ", () => {
    const fake = example(round(["product", "order", "policy", "other", "order"], 5, 5), round(["product", "order", "policy", "other", "product"], 5, 5));
    expect(() => check(run(fake))).toThrow(/ตรงกับที่คาด/);
    const fakeY = example(round(["product", "order", "policy", "other", "order"], 5, 5), round(["product", "order", "policy", "other", "I think order"], 5, 4));
    expect(() => check(run(fakeY))).toThrow(/รูปแบบถูก/);
    // รอบ zero-shot ที่เลขสรุปโกหกก็ไม่ผ่านเช่นกัน
    expect(() => check(run(example(round(["a", "b", "c", "d", "e"], 5, 5), round(TESTS, 5, 5))))).toThrow(/รูปแบบถูก/);
  });
  it("ไม่ผ่านเมื่อ few-shot รูปแบบไม่ครบ 5 หรือตรงน้อยกว่า 4 (แม้เลขสรุปตรงกับรายข้อ)", () => {
    expect(() => check(run(example(round(TESTS, 5, 5), round(["product", "order", "policy", "other", "order please"], 4, 4))))).toThrow(/5\/5/);
    expect(() => check(run(example(round(TESTS, 5, 5), round(["order", "order", "policy", "product", "order"], 5, 3))))).toThrow(/4\/5/);
  });
  it("ไม่ผ่านเมื่อป้ายเป็น undefined หรือ exit code ไม่ใช่ 0", () => {
    expect(() => check(run(example(round(TESTS, 5, 5), round(["undefined", "order", "policy", "other", "order"], 4, 4))))).toThrow();
    expect(() => check({ ...run(GOOD), exitCode: 1 })).toThrow();
  });
});

const GOOD1 = ["ตัวอย่างทั้งหมด: 6 ข้อ", "ตัวอย่างที่ซ้ำกับข้อสอบ: 0 ข้อ", ...round(["order", "product", "policy", "order", "product"], 5, 5)].join("\n");
const withX = (labels: string[], y: number, x: number): string => ["ตัวอย่างทั้งหมด: 6 ข้อ", "ตัวอย่างที่ซ้ำกับข้อสอบ: 0 ข้อ", ...round(labels, y, x)].join("\n");

describe("เกณฑ์ตรวจบท 019 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  it("ผ่านเมื่อครบ", () => {
    expect(() => check(run(GOOD1))).not.toThrow();
    expect(() => checks["exercise-1.google"].check(run(GOOD1))).not.toThrow();
  });
  it("ผ่านเมื่อมีแค่บรรทัด ตรงกับที่คาด (ไม่มีรูปแบบถูก ตามที่ไฟล์พิมพ์)", () => {
    const noY = GOOD1.replace(/\nรูปแบบถูก: \d\/5/, "");
    expect(noY).not.toContain("รูปแบบถูก");
    expect(() => check(run(noY))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อยังไม่เติม หรือ N < 6", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม moreExamples (ดูบรรทัดที่มี 👉)"))).toThrow();
    expect(() => check(run(GOOD1.replace("ตัวอย่างทั้งหมด: 6 ข้อ", "ตัวอย่างทั้งหมด: 5 ข้อ")))).toThrow(/6 ข้อ/);
    expect(() => check(run(GOOD1.replace("ตัวอย่างทั้งหมด: 6 ข้อ", "ตัวอย่างทั้งหมด: undefined ข้อ")))).toThrow();
  });
  it("ไม่ผ่านเมื่อก๊อปข้อสอบมาเป็นตัวอย่าง", () => {
    expect(() => check(run(GOOD1.replace("ซ้ำกับข้อสอบ: 0 ข้อ", "ซ้ำกับข้อสอบ: 2 ข้อ")))).toThrow(/ซ้ำกับข้อสอบ/);
  });
  it("ไม่ผ่านเมื่อ X ไม่ตรงกับรายข้อ หรือต่ำกว่า 4", () => {
    expect(() => check(run(withX(["order", "product", "policy", "order", "other"], 5, 5)))).toThrow(/ไม่ตรงกับที่นับ/);
    expect(() => check(run(withX(["order", "product", "other", "other", "other"], 5, 2)))).toThrow(/4\/5/);
  });
  it("ไม่ผ่านเมื่อเลขสรุปมาถูกแต่ไม่มีรายข้อ", () => {
    expect(() => check(run(["ตัวอย่างทั้งหมด: 6 ข้อ", "ตัวอย่างที่ซ้ำกับข้อสอบ: 0 ข้อ", "รูปแบบถูก: 5/5", "ตรงกับที่คาด: 5/5"].join("\n")))).toThrow(/ข้อ 1:/);
  });
});

const GOOD2 = [
  "ตรวจตัวอย่าง: ข้อความ: มีแก้วเก็บความเย็นไหม → ประเภท: product | ข้อความ: ขอเลขพัสดุของคำสั่งซื้อ O1005 → ประเภท: order",
  ...round(TESTS, 5, 5),
].join("\n");

describe("เกณฑ์ตรวจบท 019 (exercise-2)", () => {
  const check = checks["exercise-2.ollama"].check;
  it("ผ่านเมื่อครบ", () => {
    expect(() => check(run(GOOD2))).not.toThrow();
    expect(() => checks["exercise-2.google"].check(run(GOOD2))).not.toThrow();
    expect(() => check(run(GOOD2.replace(" | ", " ")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อยังไม่เติม หรือคืนข้อความคงที่ (ไม่มีข้อความของตัวอย่าง)", () => {
    expect(() => check(run(["👉 ยังไม่ได้เติม examplesAsText (ดูบรรทัดที่มี 👉)"].join("\n")))).toThrow();
    expect(() => check(run(GOOD2.replace(/ตรวจตัวอย่าง: .*/, "ตรวจตัวอย่าง: x")))).toThrow(/ตรวจตัวอย่าง/);
  });
  it("ไม่ผ่านเมื่อขาดป้ายของตัวอย่างใดตัวอย่างหนึ่ง หรือป้ายสลับข้อ", () => {
    expect(() => check(run(GOOD2.replace("→ ประเภท: product", "→ ประเภท:")))).toThrow(/ตัวอย่างที่ 1/);
    expect(() => check(run(GOOD2.replace("→ ประเภท: order", "→ ประเภท:")))).toThrow(/ตัวอย่างที่ 2/);
    // ป้าย product ของข้อแรกไปอยู่ท้ายข้อที่ 2 แทน ต้องไม่ผ่าน
    const swapped = "ตรวจตัวอย่าง: ข้อความ: มีแก้วเก็บความเย็นไหม ข้อความ: ขอเลขพัสดุของคำสั่งซื้อ O1005 → product order";
    expect(() => check(run([swapped, ...round(TESTS, 5, 5)].join("\n")))).toThrow(/ตัวอย่างที่ 1/);
  });
  it("ไม่ผ่านเมื่อมี undefined ในบรรทัดตรวจตัวอย่าง", () => {
    expect(() => check(run(GOOD2.replace("ตรวจตัวอย่าง: ", "ตรวจตัวอย่าง: undefined ")))).toThrow(/undefined/);
  });
  it("ไม่ผ่านเมื่อ Y หรือ X ต่ำกว่า 4 หรือไม่ตรงกับรายข้อ", () => {
    expect(() => check(run([GOOD2.split("\n")[0], ...round(["I think product", "order", "policy", "other bla", "order"], 3, 3)].join("\n")))).toThrow(/4\/5/);
    expect(() => check(run([GOOD2.split("\n")[0], ...round(["product", "order", "policy", "other", "product"], 5, 5)].join("\n")))).toThrow(/ไม่ตรงกับที่นับ/);
    expect(() => check(run([GOOD2.split("\n")[0], ...round(["product", "order", "policy", "other", "other"], 5, 3)].join("\n")))).toThrow(/4\/5/);
  });
});
