// แบบฝึกหัด 1: เติม body แล้วดึงคำตอบออกจาก response เอง
//
// โจทย์: ส่งคำถาม "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง" ไปที่ Gemini
// แล้วพิมพ์ `คำตอบ: ...` (ข้อความคำตอบอย่างเดียว ไม่ใช่ JSON ทั้งก้อน)
//
// แนวทาง:
// 1. เปิดดู example.google.ts ข้างๆ ดูว่า body หน้าตาอย่างไร
// 2. จุด 👉 ที่ 1: เติม body เป็น { contents: [...] } โดย 1 ข้อความ role "user" มี parts เป็น [{ text: คำถาม }]
// 3. จุด 👉 ที่ 2: ดึงข้อความคำตอบจาก data: เอา parts ที่ thought ไม่ใช่ true มาต่อ text กัน
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 006 exercise-1.google
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

interface GeminiPart {
  text?: string;
  thought?: boolean;
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

// 👉 เติม body ให้มีคำถาม (ตอนนี้ contents ว่าง Gemini จะตอบ error 400 จนกว่าจะเติม)
const body: { contents: unknown[] } = {
  contents: [],
};
void QUESTION;

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${env("GOOGLE_MODEL")}:generateContent`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env("GOOGLE_API_KEY") },
    body: JSON.stringify(body),
  },
);
if (!res.ok) {
  throw new Error(`Gemini ตอบ ${res.status}: ${await res.text()}`);
}
const data = (await res.json()) as GeminiResponse;
void data;

// 👉 เปลี่ยนค่าชั่วคราวนี้เป็นข้อความคำตอบ (ต่อ text ของ parts ที่ไม่ใช่ thought)
const answer = "";
console.log(`คำตอบ: ${answer}`);
