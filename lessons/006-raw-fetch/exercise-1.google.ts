// แบบฝึกหัด 1: เติม body แล้วดึงคำตอบออกจาก response เอง
//
// โจทย์: ส่งคำถาม "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง" ไปที่ Gemini
// แล้วพิมพ์ `คำตอบ: ...` (ข้อความคำตอบอย่างเดียว ไม่ใช่ JSON ทั้งก้อน)
//
// แนวทาง:
// 1. เปิดดู example.google.ts ข้างๆ ดูว่า body หน้าตาอย่างไร
// 2. จุด 👉 ที่ 1: เติม body เป็น { contents: [...] } โดย 1 ข้อความ role "user" มี parts เป็น [{ text: QUESTION }]
// 3. จุด 👉 ที่ 2: เปลี่ยนค่าชั่วคราวของ answer เป็นข้อความคำตอบ: เอา parts ที่ thought ไม่ใช่ true มาต่อ text กัน
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 006 exercise-1.google
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

// 👉 เติม contents ให้มีคำถาม (ตอนนี้ว่างอยู่)
const body: { contents: unknown[] } = {
  contents: [],
};

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้ส่งคำขอที่ยังไม่สมบูรณ์ (ไม่เสีย token) ลบทิ้งได้เมื่อเติม body เสร็จ
  if (body.contents.length === 0) {
    console.log(`👉 ยังไม่ได้เติม contents ใน body ให้ใส่คำถามนี้: ${QUESTION}`);
    return;
  }

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

  // 👉 ตอนนี้ answer เป็น JSON ทั้งก้อน เปลี่ยนให้เหลือแค่ข้อความคำตอบ
  const answer = JSON.stringify(data);
  console.log(`คำตอบ: ${answer}`);
}
