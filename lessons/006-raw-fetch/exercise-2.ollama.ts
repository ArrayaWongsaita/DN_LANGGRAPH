// เฉลยแบบฝึกหัด 2: พิมพ์จำนวน token จาก response ดิบ
//
// โจทย์: ส่งคำถามแล้วพิมพ์ 2 บรรทัดนี้ (N คือตัวเลขจริง)
//   token ขาเข้า: N
//   token ขาออก: N
// รัน: pnpm lesson 006 exercise-2.ollama
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

// เฉลย: ขาเข้าคือ prompt_eval_count ขาออกคือ eval_count
// ทำไมใส่ ?? 0: สองฟิลด์นี้เป็น optional ใน interface (บางครั้ง provider ไม่ส่งมา เช่นเมื่อใช้ prompt cache)
// ถ้าไม่ใส่ จะพิมพ์ undefined แทนตัวเลข
const inputTokens = data.prompt_eval_count ?? 0;
const outputTokens = data.eval_count ?? 0;
console.log(`token ขาเข้า: ${inputTokens}`);
console.log(`token ขาออก: ${outputTokens}`);
