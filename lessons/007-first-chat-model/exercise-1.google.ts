// เฉลยแบบฝึกหัด 1: สร้าง ChatGoogle เอง
//
// โจทย์: เติมฟังก์ชัน createModel ให้คืน ChatGoogle ที่ตั้งค่าจาก .env แล้วถามคำถามเดิม
// ผลที่ต้องเห็น: บรรทัด `คำตอบ: ...` เป็นภาษาไทย
// รัน: pnpm lesson 007 exercise-1.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

function createModel(): ChatGoogle {
  // เฉลยจุดที่ 1: สร้างโมเดลในฟังก์ชันนี้เอง ค่าชื่อโมเดลและ key อ่านจาก .env ไม่ฝังในโค้ด
  return new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });
}

export async function main(): Promise<void> {
  const model = createModel();

  const res = await model.invoke(QUESTION);
  console.log(`คำตอบ: ${res.text}`);
}
