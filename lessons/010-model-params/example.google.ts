// บท 010: ตั้งค่าโมเดล (system prompt คุมความนิ่ง และการจำกัดความยาว) กับ ChatGoogle
// ขั้นที่ 1 คำนวณดูว่า temperature เปลี่ยนโอกาสของคำถัดไปอย่างไร ไม่ยิงเน็ต ขั้นที่ 2 ถามโมเดลจริงซ้ำๆ
// รัน: pnpm lesson 010 example.google
import { ChatGoogle } from "@langchain/google";
import type { BaseMessageLike } from "@langchain/core/messages";
import { env } from "../../src/lib/env";

const NAME_QUESTION = "ตั้งชื่อร้านกาแฟเล็กๆ ในซอย 1 ชื่อ ตอบแค่ชื่อ";
const LONG_QUESTION = "อธิบายวิธีชงกาแฟดริปให้ละเอียดทุกขั้นตอน";
const FORMAT_SYSTEM = "ตอบเป็นชื่อร้าน 1 ชื่อ ภาษาไทย ไม่เกิน 3 คำ ไม่มีคำอธิบาย";
const ROUNDS = 3;

// ไม่ส่ง temperature เพราะ Gemini รุ่นใหม่แนะนำให้ใช้ค่าเริ่มต้น ใช้ system prompt ที่ชัดเจนเพื่อคุมคำตอบแทน
const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

// softmax: แปลงคะแนนของแต่ละคำเป็นโอกาส (รวมกัน 100%) โดยหารคะแนนด้วย t ก่อน
// t น้อย = คะแนนสูงสุดได้โอกาสเกือบทั้งหมด, t มาก = โอกาสเฉลี่ยกันมากขึ้น
function softmax(scores: Record<string, number>, t: number): Record<string, number> {
  const entries = Object.entries(scores);
  const top = Math.max(...entries.map(([, s]) => s / t));
  // ลบค่าสูงสุดออกก่อน exp เพื่อกันตัวเลขใหญ่เกินไป ผลหลังหารเท่าเดิม
  const exps = entries.map(([word, s]) => [word, Math.exp(s / t - top)] as const);
  const total = exps.reduce((sum, [, e]) => sum + e, 0);
  return Object.fromEntries(exps.map(([word, e]) => [word, Math.round((e / total) * 100)]));
}

// ถามคำถามเดิมซ้ำทีละครั้ง (ไม่ขนาน) แล้วคืนคำตอบที่ย่อเป็นบรรทัดเดียว
async function askRepeatedly(input: BaseMessageLike[]): Promise<string[]> {
  const answers: string[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    const res = await model.invoke(input);
    answers.push(res.text.replace(/\s+/g, " ").trim());
  }
  return answers;
}

async function printSet(label: string, input: BaseMessageLike[]): Promise<void> {
  const answers = await askRepeatedly(input);
  console.log(`${label}: ${answers.join(" | ")}`);
  console.log(`ต่างกัน: ${new Set(answers).size} แบบ จาก ${ROUNDS} ครั้ง`);
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: temperature เปลี่ยนโอกาสของคำถัดไป ---");
  const scores = { กาแฟ: 2, ชา: 1, โกโก้: 0.5 };
  for (const t of [0.2, 1, 2]) {
    const percents = Object.entries(softmax(scores, t)).map(([word, p]) => `${word} ${p}%`);
    console.log(`t=${t}: ${percents.join(" | ")}`);
  }

  // ขั้นที่ 2: ถามโมเดลจริง ผลเปลี่ยนได้ทุกครั้ง
  console.log("--- ขั้นที่ 2: ถามซ้ำ 3 ครั้ง ---");
  await printSet("ชุดที่ 1 (ไม่มี system prompt)", [{ role: "user", content: NAME_QUESTION }]);
  await printSet("ชุดที่ 2 (มี system prompt คุมรูปแบบ)", [
    { role: "system", content: FORMAT_SYSTEM },
    { role: "user", content: NAME_QUESTION },
  ]);

  // maxOutputTokens คือจำนวน token สูงสุดที่โมเดลจะสร้าง ถึงเมื่อไรก็ถูกตัดทันที
  console.log("--- จำกัดความยาว (maxOutputTokens 20) ---");
  const limited = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), maxOutputTokens: 20 });
  const res = await limited.invoke(LONG_QUESTION);
  // Gemini บอกเหตุที่หยุดไว้ใน finish_reason หรือ finishReason (เหมือนบท 008)
  const finish: unknown = res.response_metadata.finish_reason ?? res.response_metadata.finishReason;
  if (typeof finish !== "string") {
    throw new Error("ไม่พบเหตุที่โมเดลหยุดใน response_metadata (ลองพิมพ์ res.response_metadata ดูว่าฟิลด์ชื่ออะไร)");
  }
  console.log(`จบเพราะ: ${finish}`);
  console.log(`ได้ข้อความ: ${[...res.text].length} ตัวอักษร`);
}
