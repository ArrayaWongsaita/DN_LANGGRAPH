// เฉลยแบบฝึกหัด 2: พิมพ์จำนวน token จาก response ดิบ
//
// โจทย์: ส่งคำถามแล้วพิมพ์ 2 บรรทัดนี้ (N คือตัวเลขจริง)
//   token ขาเข้า: N
//   token ขาออก: N
// รัน: pnpm lesson 006 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง
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

// เฉลย: ขาเข้าคือ promptTokenCount
// ขาออกคือ candidatesTokenCount + thoughtsTokenCount เพราะโมเดลแบบคิดก่อนตอบใช้ token กับการคิดด้วย
// และ token ที่ใช้คิดก็นับเป็นขาออกเช่นเดียวกับ eval_count ของ Ollama
// ทำไมใส่ ?? 0: แต่ละฟิลด์อาจไม่มีมา (เช่นโมเดลที่ไม่คิดจะไม่มี thoughtsTokenCount) ถ้าไม่ใส่ผลบวกจะเป็น NaN
const usage = data.usageMetadata;
const inputTokens = usage?.promptTokenCount ?? 0;
const outputTokens = (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
console.log(`token ขาเข้า: ${inputTokens}`);
console.log(`token ขาออก: ${outputTokens}`);
