// แบบฝึกหัด 1: ประเมินค่าใช้จ่ายจาก usage_metadata
//
// โจทย์: เติม estimateCost ให้คำนวณค่าใช้จ่าย (ดอลลาร์) จากจำนวน token แล้วพิมพ์ 4 บรรทัด
//   ราคาสมมุติ: ขาเข้า 0.3 ขาออก 2.5 ดอลลาร์ต่อ 1 ล้าน token
//   ขาเข้า: N
//   ขาออก: M
//   ค่าใช้จ่ายโดยประมาณ: X ดอลลาร์   (X มี 6 ตำแหน่งทศนิยม)
//
// แนวทาง:
// 1. PRICE เป็นราคาสมมุติ (ไม่ใช่ราคาจริงของโมเดลใดๆ) หน่วยดอลลาร์ต่อ 1 ล้าน token
// 2. จุด 👉: คืน (input_tokens × PRICE.input + output_tokens × PRICE.output) หารด้วย 1_000_000
//    (u มีฟิลด์ input_tokens และ output_tokens)
// 3. ตอนนี้ estimateCost คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 008 exercise-1.ollama
import type { UsageMetadata } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "ร้านกาแฟควรมีเมนูอะไรบ้าง ตอบ 3 ข้อ";
const PRICE = { input: 0.3, output: 2.5 }; // ดอลลาร์ต่อ 1 ล้าน token (ราคาสมมุติ)

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function estimateCost(u: UsageMetadata): number | undefined {
  void u; // ลบบรรทัดนี้เมื่อเริ่มใช้ u
  // 👉 คำนวณค่าใช้จ่ายจาก u และ PRICE (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ estimateCost ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const sample: UsageMetadata = { input_tokens: 1_000_000, output_tokens: 0, total_tokens: 1_000_000 };
  if (estimateCost(sample) === undefined) {
    console.log("👉 ยังไม่ได้เติม estimateCost (ดูบรรทัดที่มี 👉)");
    return;
  }

  const res = await model.invoke(QUESTION);
  const usage = res.usage_metadata;
  if (usage === undefined) {
    console.log("ไม่พบ usage_metadata ใน response");
    return;
  }
  console.log(`ราคาสมมุติ: ขาเข้า ${PRICE.input} ขาออก ${PRICE.output} ดอลลาร์ต่อ 1 ล้าน token`);
  console.log(`ขาเข้า: ${usage.input_tokens}`);
  console.log(`ขาออก: ${usage.output_tokens}`);
  console.log(`ค่าใช้จ่ายโดยประมาณ: ${estimateCost(usage)?.toFixed(6)} ดอลลาร์`);
}
