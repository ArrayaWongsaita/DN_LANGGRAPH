// เฉลยแบบฝึกหัด 2: เลือกเปิด/ปิดการคิดตามชนิดของคำถาม
//
// โจทย์: เติม chooseThink ให้คืน true เมื่อคำถามมีตัวเลข (ต้องคำนวณ จึงควรให้โมเดลคิด) และ false เมื่อไม่มี
// แล้วไฟล์จะถาม 2 คำถาม (ทักทาย แล้วคำนวณ) โดยตั้ง think ตามที่ chooseThink เลือก และพิมพ์ข้อละ 2 บรรทัด
//   คำถาม: <คำถาม> → think: <true หรือ false>
//   คำตอบ: <คำตอบ>
// รัน: pnpm lesson 011 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTIONS = [
  "สวัสดีครับ",
  "ซื้อกาแฟ 3 แก้ว แก้วละ 65 บาท มีคูปองลด 10% แต่ลดได้ไม่เกิน 15 บาท ต้องจ่ายเท่าไร",
];

const apiKey = optionalEnv("OLLAMA_API_KEY");

function chooseThink(question: string): boolean {
  // เฉลยจุดที่ 1: คำถามที่มีตัวเลขมักต้องคำนวณ จึงเปิดการคิด ส่วนคำทักทายไม่ต้องคิด จะได้ไม่เสียเวลาและ token เปล่าๆ
  return /\d/.test(question);
}

export async function main(): Promise<void> {
  for (const question of QUESTIONS) {
    const think = chooseThink(question);
    console.log(`คำถาม: ${question} → think: ${String(think)}`);
    const model = new ChatOllama({
      model: env("OLLAMA_MODEL"),
      baseUrl: env("OLLAMA_BASE_URL"),
      headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
      think,
    });
    const res = await model.invoke(question);
    console.log(`คำตอบ: ${res.text}`);
  }
}
