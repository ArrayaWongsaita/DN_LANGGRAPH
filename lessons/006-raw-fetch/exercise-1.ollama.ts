// เฉลยแบบฝึกหัด 1: เติม body แล้วดึงคำตอบออกจาก response เอง
//
// โจทย์: ส่งคำถาม "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง" ไปที่ Ollama
// แล้วพิมพ์ `คำตอบ: ...` (ข้อความคำตอบอย่างเดียว ไม่ใช่ JSON ทั้งก้อน)
// รัน: pnpm lesson 006 exercise-1.ollama
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

// เฉลยจุดที่ 1: body ต้องมี 3 อย่าง
// - model: บอกว่าจะให้โมเดลตัวไหนตอบ
// - messages: ประวัติสนทนา โมเดลจำครั้งก่อนไม่ได้ จึงส่งคำถามของเราเป็นข้อความ role "user"
// - stream: false: ขอให้ตอบกลับทีเดียว ถ้าไม่ใส่ Ollama จะส่งเป็นชิ้นๆ ต่อเนื่องซึ่ง res.json() อ่านไม่ได้
const body: Record<string, unknown> = {
  model: env("OLLAMA_MODEL"),
  messages: [{ role: "user", content: QUESTION }],
  stream: false,
};

export async function main(): Promise<void> {
  const res = await fetch(`${env("OLLAMA_BASE_URL")}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Ollama ตอบ ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as OllamaChatResponse;

  // เฉลยจุดที่ 2: ข้อความคำตอบอยู่ที่ message.content ของ Ollama (ไม่ใช่ JSON ทั้งก้อน)
  const answer = data.message.content;
  console.log(`คำตอบ: ${answer}`);
}
