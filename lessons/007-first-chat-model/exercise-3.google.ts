// เฉลยแบบฝึกหัด 3 ⭐: อ่านชื่อโมเดลจากตัวโมเดล
//
// โจทย์: เติม modelName ให้คืนชื่อโมเดลที่ ChatGoogle ใช้ แล้วพิมพ์ 2 ส่วน
//   โมเดล: <ชื่อโมเดลตรงกับ GOOGLE_MODEL ใน .env>
//   คำตอบ: <คำตอบของโมเดล>
// รัน: pnpm lesson 007 exercise-3.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function modelName(m: ChatGoogle): string {
  // เฉลยจุดที่ 1: ชื่อโมเดลอยู่ในฟิลด์ model ของตัวโมเดลอยู่แล้ว ไม่ต้องเก็บแยกเอง
  return m.model;
}

export async function main(): Promise<void> {
  console.log(`โมเดล: ${modelName(model)}`);
  const res = await model.invoke(QUESTION);
  console.log(`คำตอบ: ${res.text}`);
}
