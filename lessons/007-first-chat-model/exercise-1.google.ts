// แบบฝึกหัด 1: สร้าง ChatGoogle เอง
//
// โจทย์: เติมฟังก์ชัน createModel ให้คืน ChatGoogle ที่ตั้งค่าจาก .env แล้วถามคำถามเดิม
// ผลที่ต้องเห็น: บรรทัด `คำตอบ: ...` เป็นภาษาไทย
//
// แนวทาง:
// 1. เปิด example.google.ts ข้างๆ ดูวิธีสร้าง model
// 2. จุด 👉: สร้าง new ChatGoogle({ model, apiKey }) ค่าทั้งสองมาจาก .env (env("GOOGLE_MODEL") และ env("GOOGLE_API_KEY"))
//    อย่าลืมเพิ่ม import ของ env จาก "../../src/lib/env" ที่หัวไฟล์
// 3. ตอนนี้ createModel คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล) เมื่อคืนโมเดลจริงแล้วจะทำงานต่อ
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 007 exercise-1.google
import { ChatGoogle } from "@langchain/google";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

function createModel(): ChatGoogle | undefined {
  // 👉 สร้างและคืน ChatGoogle ตรงนี้ (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  const model = createModel();
  // บล็อกนี้กันไม่ให้เรียกโมเดลที่ยังไม่ได้สร้าง (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (model === undefined) {
    console.log("👉 ยังไม่ได้เติม createModel (ดูบรรทัดที่มี 👉)");
    return;
  }

  const res = await model.invoke(QUESTION);
  console.log(`คำตอบ: ${res.text}`);
}
