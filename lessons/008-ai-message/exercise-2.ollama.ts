// เฉลยแบบฝึกหัด 2: คำถามยาวขึ้น token ขาเข้าเพิ่มจริงไหม
//
// โจทย์: เขียนคำถามยาว 200 ตัวอักษรขึ้นไป แล้วถามโมเดลทั้งคำถามสั้นและคำถามยาว พิมพ์ 3 บรรทัด
//   คำถามสั้น: ขาเข้า N token
//   คำถามยาว: ขาเข้า M token
//   ต่างกัน: D token   (D = M - N)
// รัน: pnpm lesson 008 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const SHORT_QUESTION = "ร้านเปิดกี่โมง";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function longQuestion(): string {
  // เฉลยจุดที่ 1: ใช้ .repeat() ต่อข้อความซ้ำให้ยาวเกิน 200 ตัวอักษร (ประโยคนี้ยาวเกิน 40 ตัวอักษร ซ้ำ 6 รอบจึงเกิน 200 แน่นอน)
  // เนื้อหาไม่สำคัญ สิ่งที่วัดคือจำนวน token ขาเข้าที่เพิ่มตามความยาว
  return "ร้านกาแฟของฉันเปิดมาสามปีแล้วและลูกค้าประจำถามเมนูใหม่ๆ ทุกสัปดาห์ ".repeat(6);
}

// ถามแล้วคืนจำนวน token ขาเข้าจาก usage_metadata
async function inputTokens(question: string): Promise<number> {
  const res = await model.invoke(question);
  return res.usage_metadata?.input_tokens ?? 0;
}

export async function main(): Promise<void> {
  const long = longQuestion();

  const shortTokens = await inputTokens(SHORT_QUESTION);
  const longTokens = await inputTokens(long);
  console.log(`คำถามสั้น: ขาเข้า ${shortTokens} token`);
  console.log(`คำถามยาว: ขาเข้า ${longTokens} token`);
  console.log(`ต่างกัน: ${longTokens - shortTokens} token`);
}
