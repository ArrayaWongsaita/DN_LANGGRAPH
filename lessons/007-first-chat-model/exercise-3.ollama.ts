// เฉลยแบบฝึกหัด 3 ⭐: อ่านชื่อโมเดลจากตัวโมเดล
//
// โจทย์: เติม modelName ให้คืนชื่อโมเดลที่ ChatOllama ใช้ แล้วพิมพ์ 2 ส่วน
//   โมเดล: <ชื่อโมเดลตรงกับ OLLAMA_MODEL ใน .env>
//   คำตอบ: <คำตอบของโมเดล>
// รัน: pnpm lesson 007 exercise-3.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function modelName(m: ChatOllama): string {
  // เฉลยจุดที่ 1: ชื่อโมเดลอยู่ในฟิลด์ model ของตัวโมเดลอยู่แล้ว ไม่ต้องเก็บแยกเอง
  return m.model;
}

export async function main(): Promise<void> {

  console.log(`โมเดล: ${modelName(model)}`);
  const res = await model.invoke(QUESTION);
  console.log(`คำตอบ: ${res.text}`);
}
