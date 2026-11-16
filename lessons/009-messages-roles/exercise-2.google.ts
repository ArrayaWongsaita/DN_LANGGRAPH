// แบบฝึกหัด 2: ตั้งชื่อและนิสัยให้ผู้ช่วยด้วย system message
//
// โจทย์: เติม systemMessage ให้ตั้งชื่อผู้ช่วยว่า "น้องดีเอ็น" แล้วถามว่า "คุณชื่ออะไร และช่วยอะไรได้บ้าง"
// ผลที่ต้องเห็น: `คำตอบ: ...` ที่มีคำว่า ดีเอ็น
//
// แนวทาง:
// 1. system message รูปย่อคือ { role: "system", content: "..." }
// 2. จุด 👉: คืน object นั้น โดย content บอกชื่อ (น้องดีเอ็น) และหน้าที่ของผู้ช่วย (เช่น ช่วยตอบเรื่องสินค้าของร้าน DN Shop)
// 3. ตอนนี้ systemMessage คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 009 exercise-2.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "คุณชื่ออะไร และช่วยอะไรได้บ้าง";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function systemMessage(): { role: "system"; content: string } | undefined {
  // 👉 คืน { role: "system", content: "..." } ที่ตั้งชื่อ น้องดีเอ็น (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ยังไม่มี system (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const system = systemMessage();
  if (system === undefined) {
    console.log("👉 ยังไม่ได้เติม systemMessage (ดูบรรทัดที่มี 👉)");
    return;
  }

  const res = await model.invoke([system, { role: "user", content: QUESTION }]);
  console.log(`คำตอบ: ${res.text}`);
}
