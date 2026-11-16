// แบบฝึกหัด 2: ดูว่า content เป็นแบบไหน
//
// โจทย์: เติม contentKind ให้บอกว่า content ของ AIMessage เป็น "string" หรือ "array" แล้วพิมพ์ 2 บรรทัด
//   ชนิดของ content: string
//   text: <คำตอบของโมเดล>
//
// แนวทาง:
// 1. content ของ AIMessage มีชนิด string หรือ array (ดูตัวอย่างขั้นที่ 1 ใน example.google.ts)
// 2. จุด 👉: ใช้ typeof content === "string" หรือ Array.isArray(content) แล้วคืน "string" หรือ "array"
// 3. ตอนนี้ contentKind คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 007 exercise-2.google
import type { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function contentKind(content: AIMessage["content"]): "string" | "array" | undefined {
  void content; // ลบบรรทัดนี้เมื่อเริ่มใช้ content
  // 👉 คืน "string" หรือ "array" ตามชนิดของ content (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ contentKind ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (contentKind("ทดสอบ") === undefined) {
    console.log("👉 ยังไม่ได้เติม contentKind (ดูบรรทัดที่มี 👉)");
    return;
  }

  const res = await model.invoke(QUESTION);
  console.log(`ชนิดของ content: ${contentKind(res.content)}`);
  console.log(`text: ${res.text}`);
}
