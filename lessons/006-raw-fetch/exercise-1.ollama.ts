// แบบฝึกหัด 1: เติม body แล้วดึงคำตอบออกจาก response เอง
//
// โจทย์: ส่งคำถาม "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง" ไปที่ Ollama
// แล้วพิมพ์ `คำตอบ: ...` (ข้อความคำตอบอย่างเดียว ไม่ใช่ JSON ทั้งก้อน)
//
// แนวทาง:
// 1. เปิดดู example.ollama.ts ข้างๆ ดูว่า body หน้าตาอย่างไร
// 2. จุด 👉 ที่ 1: เติม body ให้มี model, messages (1 ข้อความ role "user") และ stream: false
// 3. จุด 👉 ที่ 2: ดึงข้อความคำตอบจาก data (ดู interface OllamaChatResponse ด้านล่างว่าอยู่ตรงไหน)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 006 exercise-1.ollama
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

// 👉 เติม messages และ stream ให้ body สมบูรณ์ (ตอนนี้มีแค่ model จึงยังไม่มีคำถามส่งไป)
const body: Record<string, unknown> = {
  model: env("OLLAMA_MODEL"),
};
void QUESTION;

const res = await fetch(`${env("OLLAMA_BASE_URL")}/api/chat`, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});
if (!res.ok) {
  throw new Error(`Ollama ตอบ ${res.status}: ${await res.text()}`);
}
const data = (await res.json()) as OllamaChatResponse;
void data;

// 👉 เปลี่ยนค่าชั่วคราวนี้เป็นข้อความคำตอบจาก data
const answer = "";
console.log(`คำตอบ: ${answer}`);
