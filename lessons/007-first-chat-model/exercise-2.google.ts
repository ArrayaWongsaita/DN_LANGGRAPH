// เฉลยแบบฝึกหัด 2: ดูว่า content เป็นแบบไหน
//
// โจทย์: เติม contentKind ให้บอกว่า content ของ AIMessage เป็น "string" หรือ "array" แล้วพิมพ์ 3 บรรทัด
//   ชนิดของ content: string
//   text: <คำตอบของโมเดล>
//   ตรวจตัวอย่าง: string array   (ผลของ contentKind กับ string และกับ array ตัวอย่าง ไม่ใช่ค่าคงที่)
// รัน: pnpm lesson 007 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import type { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function contentKind(content: AIMessage["content"]): "string" | "array" {
  // เฉลยจุดที่ 1: content เป็นได้แค่ string หรือ array ตรวจด้วย typeof ก็พอ
  // (Gemini อาจคืน array จึงต้องแยกแยะ และการอ่านข้อความควรใช้ .text เสมอ ไม่อ่าน content เอง)
  return typeof content === "string" ? "string" : "array";
}

export async function main(): Promise<void> {
  const res = await model.invoke(QUESTION);
  console.log(`ชนิดของ content: ${contentKind(res.content)}`);
  console.log(`text: ${res.text}`);
  // บรรทัดนี้พิสูจน์ว่า contentKind แยกแยะได้จริง (คืนคำตอบเดียวตายตัวไม่ผ่าน)
  console.log(`ตรวจตัวอย่าง: ${contentKind("ก")} ${contentKind([{ type: "text", text: "ก" }])}`);
}
