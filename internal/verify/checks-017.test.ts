import { describe, expect, it } from "vitest";
import checks from "../checks/017";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "017", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

const PROMPT = [
  "## บทบาท",
  "คุณคือผู้ช่วยตอบคำถามของร้าน DN Shop",
  "",
  "## ขอบเขต",
  "- ตอบเฉพาะเรื่องสินค้า",
  "- ถ้านอกขอบเขต ให้ขึ้นต้นด้วย [นอกขอบเขต]",
  "",
  "## น้ำเสียง",
  "- ตอบภาษาไทย สุภาพ",
  "- ลงท้ายด้วย ครับ",
  "",
  "## สิ่งที่ห้ามตอบ",
  "- ห้ามแต่งราคา",
].join("\n");

const STEP1 = ["--- ขั้นที่ 1: ประกอบ system prompt จาก 4 ส่วน ---", PROMPT, `ความยาว: ${[...PROMPT].length} ตัวอักษร`];
const step2 = (q1Yes: string, q2No: string, q2Yes: string, q1No = "ต่างกันที่วิธีบดครับ"): string[] => [
  "--- ขั้นที่ 2: คำถามเดิม มีและไม่มี system prompt ---",
  "--- คำถามที่ 1 ไม่มี system prompt ---", q1No,
  "--- คำถามที่ 1 มี system prompt ---", q1Yes,
  "--- คำถามที่ 2 ไม่มี system prompt ---", q2No,
  "--- คำถามที่ 2 มี system prompt ---", q2Yes,
];
const GOOD_STEP2 = step2("เครื่องบดมือหมุนราคาถูกกว่าครับ", "ดวงดาวพร่างพราวบนฟ้า แม่จ๋ารักเสมอ", "[นอกขอบเขต] ช่วยเรื่องสินค้าได้ครับ");
const EXAMPLE = [...STEP1, ...GOOD_STEP2].join("\n");

describe("เกณฑ์ตรวจบท 017 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider", () => {
    expect(() => check(run(EXAMPLE))).not.toThrow();
    expect(() => checks["example.google"].check(run(EXAMPLE))).not.toThrow();
    expect(() => check(run(EXAMPLE.replace(/\n/g, "\r\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อหัวข้อขาด หรือเรียงผิดลำดับ", () => {
    expect(() => check(run(EXAMPLE.replace("## น้ำเสียง", "## เสียง")))).toThrow(/## น้ำเสียง/);
    const swapped = EXAMPLE.replace("## ขอบเขต", "## TMP").replace("## น้ำเสียง", "## ขอบเขต").replace("## TMP", "## น้ำเสียง");
    expect(() => check(run(swapped))).toThrow();
  });
  it("รับ marker ที่โมเดลพิมพ์เพี้ยนเล็กน้อย แต่ไม่รับถ้าไม่มีวงเล็บเหลี่ยม", () => {
    expect(() => check(run([...STEP1, ...step2("ราคาถูกกว่าครับ", "กลอนวันแม่", "[nอกขอบเขต] ขออภัยครับ")].join("\n")))).not.toThrow();
    expect(() => check(run([...STEP1, ...step2("ราคาถูกกว่าครับ", "กลอนวันแม่", "นอกขอบเขต ขออภัยครับ")].join("\n")))).toThrow(/นอกขอบเขต/);
  });
  it("ไม่ผ่านเมื่อบรรทัดที่ขึ้นต้นด้วย - ไม่ครบ 5", () => {
    expect(() => check(run(EXAMPLE.replace("- ห้ามแต่งราคา", "ห้ามแต่งราคา")))).toThrow(/5 บรรทัด/);
  });
  it("ไม่ผ่านเมื่อความยาวไม่ตรงกับ prompt ที่พิมพ์ (นับด้วย length ธรรมดาแทนนับตัวอักษร ก็ไม่ผ่านถ้าต่างกัน)", () => {
    expect(() => check(run(EXAMPLE.replace(`ความยาว: ${[...PROMPT].length}`, "ความยาว: 5")))).toThrow(/ความยาว/);
    expect(() => check(run(EXAMPLE.replace(`ความยาว: ${[...PROMPT].length} ตัวอักษร`, "ความยาว: undefined ตัวอักษร")))).toThrow();
    expect(() => check(run(EXAMPLE.replace(/\nความยาว: \d+ ตัวอักษร/, "")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ [นอกขอบเขต] ไม่อยู่ในคำถามที่ 2 มี system หรือโผล่ในที่ที่ไม่ควรมี", () => {
    expect(() => check(run([...STEP1, ...step2("ครับ ราคาถูกกว่า", "แต่งกลอนให้ครับ", "ขออภัย แต่งกลอนไม่ได้ครับ")].join("\n")))).toThrow(/\[นอกขอบเขต\]/);
    // marker โผล่ในคำตอบที่ไม่มี system
    expect(() => check(run([...STEP1, ...step2("ราคาถูกกว่าครับ", "[นอกขอบเขต] กลอนวันแม่", "[นอกขอบเขต] ครับ")].join("\n")))).toThrow(/ไม่มี system/);
    // marker โผล่ในคำถามที่ 1 มี system
    expect(() => check(run([...STEP1, ...step2("[นอกขอบเขต] ราคาถูกกว่าครับ", "กลอนวันแม่", "[นอกขอบเขต] ครับ")].join("\n")))).toThrow(/คำถามที่ 1 มี system/);
  });
  it("ไม่ผ่านเมื่อคำถามที่ 1 มี system ไม่มี ครับ คำตอบว่าง ไม่ใช่ไทย หรือเป็น undefined", () => {
    expect(() => check(run([...STEP1, ...step2("ราคาถูกกว่า", "กลอน", "[นอกขอบเขต] ค่ะ")].join("\n")))).toThrow(/ครับ/);
    expect(() => check(run([...STEP1, ...step2("ราคาถูกกว่าครับ", "", "[นอกขอบเขต] ครับ")].join("\n")))).toThrow();
    expect(() => check(run([...STEP1, ...step2("ราคาถูกกว่าครับ", "poem", "[นอกขอบเขต] ครับ")].join("\n")))).toThrow(/ไทย/);
    expect(() => check(run([...STEP1, ...step2("ราคาถูกกว่าครับ", "undefined", "[นอกขอบเขต] ครับ")].join("\n")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ exit code ไม่ใช่ 0", () => {
    expect(() => check({ ...run(EXAMPLE), exitCode: 1 })).toThrow();
  });
});

const GOOD1 = [
  "กฎที่ห้าม: 1 ข้อ",
  "--- คำถามที่ห้ามตอบ ---", "[ไม่ตอบ] ขออภัยครับ ให้ข้อมูลลูกค้าท่านอื่นไม่ได้",
  "--- คำถามปกติ ---", "ฉีกซอง แขวนปากแก้ว เทน้ำร้อนครับ",
].join("\n");

describe("เกณฑ์ตรวจบท 017 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  it("ผ่านเมื่อครบ", () => {
    expect(() => check(run(GOOD1))).not.toThrow();
    expect(() => checks["exercise-1.google"].check(run(GOOD1))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม (พิมพ์ 👉 แล้วจบ)", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม forbiddenRules (ดูบรรทัดที่มี 👉)"))).toThrow();
  });
  it("ไม่ผ่านเมื่อ N เป็น 0 หรือไม่ใช่ตัวเลข", () => {
    expect(() => check(run(GOOD1.replace("กฎที่ห้าม: 1 ข้อ", "กฎที่ห้าม: 0 ข้อ")))).toThrow();
    expect(() => check(run(GOOD1.replace("กฎที่ห้าม: 1 ข้อ", "กฎที่ห้าม: undefined ข้อ")))).toThrow();
  });
  it("ไม่ผ่านเมื่อคำถามที่ห้ามไม่มี [ไม่ตอบ] หรือคำถามปกติมี [ไม่ตอบ] (กฎที่ห้ามทุกอย่าง)", () => {
    expect(() => check(run(GOOD1.replace("[ไม่ตอบ] ขออภัย", "ขออภัย")))).toThrow(/\[ไม่ตอบ\]/);
    expect(() => check(run(GOOD1.replace("ฉีกซอง", "[ไม่ตอบ] ฉีกซอง")))).toThrow(/คำถามปกติ/);
  });
  it("รับ [ไม่ตอบ] ที่เพี้ยนเล็กน้อย แต่ไม่รับถ้าไม่มีวงเล็บเหลี่ยม", () => {
    expect(() => check(run(GOOD1.replace("[ไม่ตอบ]", "[นไม่ตอบ]")))).not.toThrow();
    expect(() => check(run(GOOD1.replace("[ไม่ตอบ]", "ไม่ตอบ")))).toThrow(/\[ไม่ตอบ\]/);
  });
  it("ไม่ผ่านเมื่อคำตอบว่าง ไม่ใช่ไทย หรือเป็น undefined", () => {
    expect(() => check(run(GOOD1.replace("ฉีกซอง แขวนปากแก้ว เทน้ำร้อนครับ", "")))).toThrow();
    expect(() => check(run(GOOD1.replace("ฉีกซอง แขวนปากแก้ว เทน้ำร้อนครับ", "tear and pour")))).toThrow(/ไทย/);
    expect(() => check(run(GOOD1.replace("ฉีกซอง แขวนปากแก้ว เทน้ำร้อนครับ", "undefined")))).toThrow();
  });
});

const GOOD2 = [
  "--- คำถามที่ 1 ---", "ส่งภายใน 2-3 วันครับ ขอบคุณที่อุดหนุน DN Shop ครับ",
  "--- คำถามที่ 2 ---", "ไม่แนะนำครับ ขอบคุณที่อุดหนุน DN Shop ครับ",
].join("\n");

describe("เกณฑ์ตรวจบท 017 (exercise-2)", () => {
  const check = checks["exercise-2.ollama"].check;
  it("ผ่านเมื่อทั้ง 2 คำตอบลงท้ายตามสั่ง", () => {
    expect(() => check(run(GOOD2))).not.toThrow();
    expect(() => checks["exercise-2.google"].check(run(GOOD2))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม หรือมีคำตอบเดียวที่ไม่ลงท้ายตามสั่ง", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม toneRules (ดูบรรทัดที่มี 👉)"))).toThrow();
    expect(() => check(run(GOOD2.replace("ไม่แนะนำครับ ขอบคุณที่อุดหนุน DN Shop ครับ", "ไม่แนะนำครับ")))).toThrow(/คำตอบที่ 2/);
    expect(() => check(run(GOOD2.replace("ส่งภายใน 2-3 วันครับ ขอบคุณที่อุดหนุน DN Shop ครับ", "ขอบคุณที่อุดหนุน DN Shop ครับ undefined").replace("ขอบคุณที่อุดหนุน DN Shop ครับ undefined", "undefined")))).toThrow();
  });
  it("ไม่ผ่านเมื่อไม่ใช่ภาษาไทย (ลงท้ายถูกแต่คำตอบเป็นอังกฤษ)", () => {
    expect(() => check(run(GOOD2.replace("ส่งภายใน 2-3 วันครับ ", "Ships in 2 days. ").replace("ขอบคุณที่อุดหนุน DN Shop ครับ", "DN Shop")))).toThrow();
  });
});
