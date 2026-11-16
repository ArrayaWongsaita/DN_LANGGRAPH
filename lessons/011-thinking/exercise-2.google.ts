// เฉลยแบบฝึกหัด 2: เลือกระดับการคิดตามชนิดของคำถาม
//
// โจทย์: เติม chooseLevel ให้คืน "high" เมื่อคำถามมีตัวเลข (ต้องคำนวณ จึงควรให้โมเดลคิดมาก) และ "low" เมื่อไม่มี
// แล้วไฟล์จะถาม 2 คำถาม (ทักทาย แล้วคำนวณ) โดยตั้ง thinkingLevel ตามที่ chooseLevel เลือก และพิมพ์ข้อละ 2 บรรทัด
//   คำถาม: <คำถาม> → thinkingLevel: <low หรือ high>
//   คำตอบ: <คำตอบ>
// รัน: pnpm lesson 011 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTIONS = [
  "สวัสดีครับ",
  "ซื้อกาแฟ 3 แก้ว แก้วละ 65 บาท มีคูปองลด 10% แต่ลดได้ไม่เกิน 15 บาท ต้องจ่ายเท่าไร",
];

function chooseLevel(question: string): "low" | "high" {
  // เฉลยจุดที่ 1: คำถามที่มีตัวเลขมักต้องคำนวณ จึงให้คิดมาก ส่วนคำทักทายให้คิดน้อยจะได้ไม่เสียเวลาและ token เปล่าๆ
  return /\d/.test(question) ? "high" : "low";
}

export async function main(): Promise<void> {
  for (const question of QUESTIONS) {
    const level = chooseLevel(question);
    console.log(`คำถาม: ${question} → thinkingLevel: ${String(level)}`);
    const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), thinkingLevel: level });
    const res = await model.invoke(question);
    console.log(`คำตอบ: ${res.text}`);
  }
}
