// เฉลยแบบฝึกหัด 2: ทำให้คำตอบนิ่งด้วย system prompt (Gemini รุ่นใหม่ไม่ใช้ temperature ใช้ system prompt คุมแทน)
//
// โจทย์: เติม systemPrompt ให้คืน system prompt ที่บอกว่าร้านเปิด 09:00-20:00 และบังคับให้ตอบรูปแบบเดียวเสมอ
//   เวลาเปิด: HH:MM-HH:MM
// แล้วไฟล์จะถาม "ร้านเปิดกี่โมงครับ" 3 ครั้ง และพิมพ์ครั้งละ 1 บรรทัด `ครั้งที่ i: <คำตอบ>` ทุกครั้งต้องอยู่ในรูปแบบเดียวกัน
// รัน: pnpm lesson 010 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "ร้านเปิดกี่โมงครับ";
const ROUNDS = 3;

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function systemPrompt(): string {
  // เฉลยจุดที่ 1: system prompt ที่นิ่งต้องมีทั้งข้อเท็จจริง (เวลาเปิด) รูปแบบที่ต้องการ และตัวอย่างรูปแบบ
  // ใส่ตัวอย่างรูปแบบไว้ตรงๆ โมเดลจะลอกรูปแบบตามได้นิ่งกว่าการอธิบายด้วยคำพูดอย่างเดียว
  return "ร้านนี้เปิดทุกวัน 09:00-20:00\nเมื่อถูกถามเวลาเปิด ให้ตอบบรรทัดเดียวในรูปแบบนี้เท่านั้น ห้ามมีข้อความอื่นปน\nเวลาเปิด: 09:00-20:00";
}

export async function main(): Promise<void> {
  const system = systemPrompt();

  for (let i = 1; i <= ROUNDS; i++) {
    const res = await model.invoke([
      { role: "system", content: system },
      { role: "user", content: QUESTION },
    ]);
    console.log(`ครั้งที่ ${i}: ${res.text.replace(/\s+/g, " ").trim()}`);
  }
}
