// เฉลยแบบฝึกหัด 2: รวมยอด token ที่ใช้ไปหลายคำถาม
//
// โจทย์: เติม addUsage(total, msg) ให้คืนยอดรวมใหม่ = total บวกกับ token ของ msg (ขาเข้า ขาออก และรวม)
// แล้วไฟล์จะถามโมเดล 3 คำถามต่อกัน พิมพ์ token ของแต่ละข้อ และยอดรวมทั้งหมด
//   ข้อ i: ขาเข้า N ขาออก M
//   รวมทั้งหมด: ขาเข้า N ขาออก M รวม T
// รัน: pnpm lesson 013 exercise-2.ollama

import { AIMessage, type UsageMetadata } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTIONS = [
  "กาแฟดริปต่างจากเอสเปรสโซอย่างไร ตอบ 1 ประโยค",
  "ชาเขียวมีคาเฟอีนไหม ตอบ 1 ประโยค",
  "ควรเก็บเมล็ดกาแฟอย่างไร ตอบ 1 ประโยค",
];

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

const ZERO: UsageMetadata = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

function addUsage(total: UsageMetadata, msg: AIMessage): UsageMetadata {
  // เฉลยจุดที่ 1: usage_metadata อาจเป็น undefined (บางครั้ง provider ไม่ส่งมา) ถ้าไม่มีถือว่าไม่เพิ่ม
  // คืนก้อนใหม่เสมอเพื่อไม่แก้ total เดิมของผู้เรียก (ไม่มี side effect จึงทดสอบและต่อยอดง่าย)
  const usage = msg.usage_metadata;
  if (usage === undefined) return { ...total };
  return {
    input_tokens: total.input_tokens + usage.input_tokens,
    output_tokens: total.output_tokens + usage.output_tokens,
    total_tokens: total.total_tokens + usage.total_tokens,
  };
}

export async function main(): Promise<void> {
  let total = ZERO;
  for (const [i, q] of QUESTIONS.entries()) {
    const res = await model.invoke(q);
    console.log(`ข้อ ${i + 1}: ขาเข้า ${res.usage_metadata?.input_tokens ?? 0} ขาออก ${res.usage_metadata?.output_tokens ?? 0}`);
    total = addUsage(total, res);
  }
  console.log(`รวมทั้งหมด: ขาเข้า ${total.input_tokens} ขาออก ${total.output_tokens} รวม ${total.total_tokens}`);
}
