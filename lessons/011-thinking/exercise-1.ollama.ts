// เฉลยแบบฝึกหัด 1: ดึงความคิดของโมเดลออกมาจาก AIMessage
//
// โจทย์: เติม reasoningOf ให้คืนข้อความความคิดของโมเดล (ต่อทุก block ชนิด reasoning เข้าด้วยกัน)
// แล้วไฟล์จะถามโมเดลด้วย think: true และพิมพ์ 2 ส่วน
//   ความคิด (80 ตัวอักษรแรก): <ความคิด 80 ตัวอักษรแรก>
//   คำตอบ: <คำตอบ>
// รัน: pnpm lesson 011 exercise-1.ollama
import { AIMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "ซื้อกาแฟ 3 แก้ว แก้วละ 65 บาท มีคูปองลด 10% แต่ลดได้ไม่เกิน 15 บาท ต้องจ่ายเท่าไร";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
  think: true,
});

function reasoningOf(msg: AIMessage): string {
  // เฉลยจุดที่ 1: ความคิดอยู่ใน block ชนิด reasoning ของ contentBlocks (ไม่ปนใน .text) จึงวนต่อทุก block ชนิดนี้
  // เริ่มจากสตริงว่าง ถ้าไม่มี block reasoning เลยจะคืน "" ตามโจทย์ ไม่ใช่ undefined
  let thought = "";
  for (const block of msg.contentBlocks) {
    if (block.type === "reasoning") thought += block.reasoning;
  }
  return thought;
}

export async function main(): Promise<void> {
  const res = await model.invoke(QUESTION);
  const thought = [...reasoningOf(res)].slice(0, 80).join("").replace(/\s+/g, " ");
  console.log(`ความคิด (80 ตัวอักษรแรก): ${thought}`);
  console.log(`คำตอบ: ${res.text}`);
}
