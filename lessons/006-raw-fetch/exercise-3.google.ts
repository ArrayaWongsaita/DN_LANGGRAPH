// แบบฝึกหัด 3 ⭐: ห่อการเรียกเป็นฟังก์ชัน ask แล้วถามคำถามเดิม 3 รอบ
//
// โจทย์: เขียน ask(question) ที่ส่งคำถามไป Gemini แล้วคืน { text, inputTokens, outputTokens }
// จากนั้น main ถามคำถามเดิม 3 รอบ ทีละรอบต่อกัน (ไม่ยิงพร้อมกัน) พิมพ์รอบละ 2 บรรทัด:
//   ครั้งที่ 1: <คำตอบ>
//   (token <ขาเข้า>→<ขาออก>)
// คำตอบของแต่ละรอบอาจไม่เหมือนกัน เหมือนที่เรียนในบท 001 ไม่ต้องกังวล
//
// แนวทาง:
// 1. ย้ายโค้ด fetch จาก exercise-1 และ exercise-2 มาไว้ในตัว ask
// 2. จุด 👉 ที่ 1: เขียนตัว ask (อย่าลืมข้าม part ที่ thought เป็น true)
// 3. จุด 👉 ที่ 2: เขียนลูป 3 รอบใน main ด้วย for และ await ในลูป
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 006 exercise-3.google
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

export interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

interface Answer {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

// 👉 เขียนตัว ask: fetch ไป generateContent ด้วย header x-goog-api-key, ตรวจ res.ok, อ่าน JSON
function ask(question: string): Promise<Answer> {
  void question;
  void env;
  return Promise.resolve({ text: "", inputTokens: 0, outputTokens: 0 });
}

export async function main(): Promise<void> {
  // 👉 วนถาม 3 รอบ (i = 1, 2, 3) แล้วพิมพ์ 2 บรรทัดต่อรอบตามรูปแบบในโจทย์
  const first = await ask(QUESTION);
  console.log(`ครั้งที่ 1: ${first.text}`);
  console.log(`(token ${first.inputTokens}→${first.outputTokens})`);
}
