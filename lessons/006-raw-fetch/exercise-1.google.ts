// เฉลยแบบฝึกหัด 1: เติม body แล้วดึงคำตอบออกจาก response เอง
//
// โจทย์: ส่งคำถาม "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง" ไปที่ Gemini
// แล้วพิมพ์ `คำตอบ: ...` (ข้อความคำตอบอย่างเดียว ไม่ใช่ JSON ทั้งก้อน)
// รัน: pnpm lesson 006 exercise-1.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

interface GeminiPart {
  text?: string;
  thought?: boolean;
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
}

// เฉลยจุดที่ 1: Gemini ใช้ contents แทน messages และข้อความอยู่ใน parts: [{ text }]
// role "user" บอกว่าเป็นคำถามจากเรา (โมเดลจำครั้งก่อนไม่ได้ จึงส่งทุกครั้ง)
const body: { contents: unknown[] } = {
  contents: [{ role: "user", parts: [{ text: QUESTION }] }],
};

export async function main(): Promise<void> {
  const model = env("GOOGLE_MODEL").replace(/^models\//, "");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env("GOOGLE_API_KEY") },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini ตอบ ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as GeminiResponse;

  // เฉลยจุดที่ 2: คำตอบอยู่ใน candidates[0].content.parts ซึ่งเป็นรายการ
  // ทำไมต้อง filter: part ที่ thought เป็น true คือส่วนที่โมเดลคิดในใจ ไม่ใช่คำตอบ ต้องข้าม
  // แล้วต่อ text ของ part ที่เหลือเข้าด้วยกัน (?? "" กันกรณี part ไม่มี text)
  const answer = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => part.thought !== true)
    .map((part) => part.text ?? "")
    .join("");
  console.log(`คำตอบ: ${answer}`);
}
