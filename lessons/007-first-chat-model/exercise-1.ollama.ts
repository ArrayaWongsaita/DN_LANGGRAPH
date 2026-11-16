// เฉลยแบบฝึกหัด 1: สร้าง ChatOllama เอง
//
// โจทย์: เติมฟังก์ชัน createModel ให้คืน ChatOllama ที่ตั้งค่าจาก .env แล้วถามคำถามเดิม
// ผลที่ต้องเห็น: บรรทัด `คำตอบ: ...` เป็นภาษาไทย
// รัน: pnpm lesson 007 exercise-1.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

function createModel(): ChatOllama {
  // เฉลยจุดที่ 1: สร้างโมเดลในฟังก์ชันนี้เอง ค่าชื่อโมเดลและที่อยู่เซิร์ฟเวอร์อ่านจาก .env ไม่ฝังในโค้ด
  // ใส่ header Authorization เฉพาะเมื่อมี OLLAMA_API_KEY (Ollama ในเครื่องไม่ต้องใช้ key)
  const apiKey = optionalEnv("OLLAMA_API_KEY");
  return new ChatOllama({
    model: env("OLLAMA_MODEL"),
    baseUrl: env("OLLAMA_BASE_URL"),
    headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
  });
}

export async function main(): Promise<void> {
  const model = createModel();

  const res = await model.invoke(QUESTION);
  console.log(`คำตอบ: ${res.text}`);
}
