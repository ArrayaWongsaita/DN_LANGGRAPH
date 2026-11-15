// แบบฝึกหัด 2: พิมพ์จำนวน token จาก response ดิบ
//
// โจทย์: ส่งคำถามแล้วพิมพ์ 2 บรรทัดนี้ (N คือตัวเลขจริง)
//   token ขาเข้า: N
//   token ขาออก: N
//
// แนวทาง:
// 1. Gemini บอกจำนวน token ไว้ใน response ที่ usageMetadata.promptTokenCount (ขาเข้า)
//    และ usageMetadata.candidatesTokenCount (ขาออก)
// 2. จุด 👉: อ่านสองฟิลด์นี้จาก data (ถ้าไม่มีให้ถือเป็น 0)
// 3. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 006 exercise-2.google
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${env("GOOGLE_MODEL")}:generateContent`,
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
void data;

// 👉 อ่านจาก data.usageMetadata แทนค่าชั่วคราว 0 ทั้งสองตัว
const inputTokens = 0;
const outputTokens = 0;
console.log(`token ขาเข้า: ${inputTokens}`);
console.log(`token ขาออก: ${outputTokens}`);
