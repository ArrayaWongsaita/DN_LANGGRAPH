// เฉลยแบบฝึกหัด 2: ตั้งชื่อและนิสัยให้ผู้ช่วยด้วย system message
//
// โจทย์: เติม systemMessage ให้ตั้งชื่อผู้ช่วยว่า "น้องดีเอ็น" แล้วถามว่า "คุณชื่ออะไร และช่วยอะไรได้บ้าง"
// ผลที่ต้องเห็น: `คำตอบ: ...` ที่มีคำว่า ดีเอ็น
// รัน: pnpm lesson 009 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "คุณชื่ออะไร และช่วยอะไรได้บ้าง";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function systemMessage(): { role: "system"; content: string } {
  // เฉลยจุดที่ 1: system message กำหนดชื่อและหน้าที่ให้ผู้ช่วยตั้งแต่ต้นบทสนทนา
  // ใส่ไว้ในข้อความ system ที่เดียว ผู้ใช้ไม่ต้องบอกซ้ำในทุกคำถาม
  return { role: "system", content: "คุณชื่อ น้องดีเอ็น เป็นผู้ช่วยของร้าน DN Shop ช่วยตอบเรื่องสินค้าและบริการของร้านอย่างสุภาพ" };
}

export async function main(): Promise<void> {
  const system = systemMessage();

  const res = await model.invoke([system, { role: "user", content: QUESTION }]);
  console.log(`คำตอบ: ${res.text}`);
}
