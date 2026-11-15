// แบบฝึกหัด 2: พิมพ์จำนวน token จาก response ดิบ
//
// โจทย์: ส่งคำถามแล้วพิมพ์ 2 บรรทัดนี้ (N คือตัวเลขจริง)
//   token ขาเข้า: N
//   token ขาออก: N
//
// แนวทาง:
// 1. Ollama บอกจำนวน token ไว้ใน response ที่ฟิลด์ prompt_eval_count (ขาเข้า) และ eval_count (ขาออก)
// 2. จุด 👉: อ่านสองฟิลด์นี้จาก data (ถ้าไม่มีให้ถือเป็น 0)
// 3. ตอนนี้ไฟล์พิมพ์ response ดิบทั้งก้อนให้ดูรูปร่างก่อน ลบบรรทัดนั้นเมื่อรู้แล้วว่าฟิลด์อยู่ตรงไหน
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 006 exercise-2.ollama
// (await ที่บนสุดของไฟล์ใช้ได้ เพราะโปรเจกต์เป็น ES module)
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

interface OllamaChatResponse {
  message: { role: string; content: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

const headers: Record<string, string> = { "Content-Type": "application/json" };
const apiKey = optionalEnv("OLLAMA_API_KEY");
if (apiKey !== undefined) headers.Authorization = `Bearer ${apiKey}`;

const res = await fetch(`${env("OLLAMA_BASE_URL")}/api/chat`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: env("OLLAMA_MODEL"),
    messages: [{ role: "user", content: QUESTION }],
    stream: false,
  }),
});
if (!res.ok) {
  throw new Error(`Ollama ตอบ ${res.status}: ${await res.text()}`);
}
const data = (await res.json()) as OllamaChatResponse;
console.log(JSON.stringify(data, null, 2)); // ดูรูปร่าง response ดิบ ลบบรรทัดนี้เมื่อเสร็จ

// 👉 อ่านจาก data แทนค่าชั่วคราว 0 ทั้งสองตัว
const inputTokens = 0;
const outputTokens = 0;
console.log(`token ขาเข้า: ${inputTokens}`);
console.log(`token ขาออก: ${outputTokens}`);
