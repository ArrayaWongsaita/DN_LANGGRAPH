// แบบฝึกหัด 2: พิมพ์จำนวน token จาก response ดิบ
//
// โจทย์: ส่งคำถามแล้วพิมพ์ 2 บรรทัดนี้ (N คือตัวเลขจริง)
//   token ขาเข้า: N
//   token ขาออก: N
//
// แนวทาง:
// 1. Gemini บอกจำนวน token ไว้ใน response ที่ usageMetadata: promptTokenCount (ขาเข้า)
//    ส่วนขาออกคือ candidatesTokenCount + thoughtsTokenCount (token ที่ใช้คิดก็นับเป็นขาออก)
// 2. จุด 👉: อ่านจาก data (ฟิลด์ที่ไม่มีให้ถือเป็น 0)
// 3. ตอนนี้ไฟล์พิมพ์ response ดิบทั้งก้อนให้ดูรูปร่างก่อน ลบบรรทัดนั้นเมื่อรู้แล้วว่าฟิลด์อยู่ตรงไหน
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 006 exercise-2.google
// (await ที่บนสุดของไฟล์ใช้ได้ เพราะโปรเจกต์เป็น ES module)
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${env("GOOGLE_MODEL").replace(/^models\//, "")}:generateContent`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env("GOOGLE_API_KEY") },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: QUESTION }] }] }),
  },
);
if (!res.ok) {
  throw new Error(`Gemini ตอบ ${res.status}: ${await res.text()}`);
}
const data = (await res.json()) as GeminiResponse;
console.log(JSON.stringify(data, null, 2)); // ดูรูปร่าง response ดิบ ลบบรรทัดนี้เมื่อเสร็จ

// 👉 อ่านจาก data.usageMetadata แทนค่าชั่วคราว (ขาออก = candidatesTokenCount + thoughtsTokenCount) ค่าชั่วคราว 0 ทั้งสองตัว
const inputTokens = 0;
const outputTokens = 0;
console.log(`token ขาเข้า: ${inputTokens}`);
console.log(`token ขาออก: ${outputTokens}`);
