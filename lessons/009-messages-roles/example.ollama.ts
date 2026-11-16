// บท 009: ข้อความ 3 บทบาท (system / human / ai) และรูปย่อ { role, content } กับ ChatOllama
// ขั้นที่ 1 สร้างข้อความด้วยคลาสแล้วดูชนิด ขั้นที่ 2 ถามคำถามเดิมด้วย system ต่างกัน 2 แบบ
// รัน: pnpm lesson 009 example.ollama
import { AIMessage, coerceMessageLikeToMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "มีสินค้าอะไรแนะนำสำหรับคนชอบกาแฟบ้าง";
const SYSTEM_SHORT = "คุณคือพนักงานร้าน DN Shop ตอบสุภาพ สั้น ไม่เกิน 2 ประโยค";
const SYSTEM_LIST = 'คุณคือพนักงานร้าน DN Shop ตอบเป็นข้อๆ อย่างน้อย 3 ข้อ ขึ้นต้นแต่ละข้อด้วย "- "';

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

// ถามคำถามเดิมด้วย system ที่ส่งเข้ามา ใช้รูปย่อ { role, content } แทนการสร้างคลาส
async function askWith(system: string): Promise<string> {
  const res = await model.invoke([
    { role: "system", content: system },
    { role: "user", content: QUESTION },
  ]);
  return res.text;
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: สร้างข้อความ 3 บทบาทด้วยคลาส ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: ข้อความ 3 บทบาท ---");
  const messages = [
    new SystemMessage(SYSTEM_SHORT),
    new HumanMessage("ร้านมีบริการห่อของขวัญไหม"),
    new AIMessage("มีครับ ห่อฟรีทุกออร์เดอร์"),
  ];
  // m.type คือชื่อบทบาทภายในของ LangChain: system, human, ai
  for (const m of messages) console.log(`${m.type}: ${m.text}`);
  // รูปย่อใช้ role "user" แต่ LangChain แปลงเป็นข้อความชนิด human ให้
  console.log(`แบบย่อ {role: "user"} กลายเป็น: ${coerceMessageLikeToMessage({ role: "user", content: "x" }).type}`);

  // ขั้นที่ 2: คำถามเดิม system ต่างกัน คำตอบเปลี่ยนไปตาม system
  console.log("--- ขั้นที่ 2: คำถามเดิม system ต่างกัน ---");
  console.log("--- system แบบที่ 1: ตอบสั้น ---");
  console.log(await askWith(SYSTEM_SHORT));
  console.log("--- system แบบที่ 2: ตอบเป็นข้อ ---");
  console.log(await askWith(SYSTEM_LIST));
}
