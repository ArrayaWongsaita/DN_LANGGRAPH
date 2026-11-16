// เฉลยแบบฝึกหัด 1: ประเมินค่าใช้จ่ายจาก usage_metadata
//
// โจทย์: เติม estimateCost ให้คำนวณค่าใช้จ่าย (ดอลลาร์) จากจำนวน token แล้วพิมพ์ 4 บรรทัด
//   ราคาสมมุติ: ขาเข้า 0.3 ขาออก 2.5 ดอลลาร์ต่อ 1 ล้าน token
//   ขาเข้า: N
//   ขาออก: M
//   ค่าใช้จ่ายโดยประมาณ: X ดอลลาร์   (X มี 6 ตำแหน่งทศนิยม)
// รัน: pnpm lesson 008 exercise-1.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import type { UsageMetadata } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "ร้านกาแฟควรมีเมนูอะไรบ้าง ตอบ 3 ข้อ";
const PRICE = { input: 0.3, output: 2.5 }; // ดอลลาร์ต่อ 1 ล้าน token (ราคาสมมุติ)

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function estimateCost(u: UsageMetadata): number {
  // เฉลยจุดที่ 1: ราคาเป็นต่อ 1 ล้าน token จึงคูณจำนวน token แล้วหาร 1_000_000
  // ขาเข้ากับขาออกราคาต่างกัน ต้องคิดแยกกันแล้วค่อยรวม
  return (u.input_tokens * PRICE.input + u.output_tokens * PRICE.output) / 1_000_000;
}

export async function main(): Promise<void> {
  const res = await model.invoke(QUESTION);
  const usage = res.usage_metadata;
  if (usage === undefined) {
    console.log("ไม่พบ usage_metadata ใน response");
    return;
  }
  console.log(`ราคาสมมุติ: ขาเข้า ${PRICE.input} ขาออก ${PRICE.output} ดอลลาร์ต่อ 1 ล้าน token`);
  console.log(`ขาเข้า: ${usage.input_tokens}`);
  console.log(`ขาออก: ${usage.output_tokens}`);
  console.log(`ค่าใช้จ่ายโดยประมาณ: ${estimateCost(usage).toFixed(6)} ดอลลาร์`);
}
