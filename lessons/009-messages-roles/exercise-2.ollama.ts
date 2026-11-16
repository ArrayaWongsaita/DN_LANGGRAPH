// เฉลยแบบฝึกหัด 2: ตั้งชื่อและนิสัยให้ผู้ช่วยด้วย system message
//
// โจทย์: เติม systemMessage ให้ตั้งชื่อผู้ช่วยว่า "น้องดีเอ็น" แล้วถามว่า "คุณชื่ออะไร และช่วยอะไรได้บ้าง"
// ผลที่ต้องเห็น: `คำตอบ: ...` ที่มีคำว่า ดีเอ็น
// รัน: pnpm lesson 009 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "คุณชื่ออะไร และช่วยอะไรได้บ้าง";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

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
