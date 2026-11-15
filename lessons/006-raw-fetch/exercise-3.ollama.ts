// เฉลยแบบฝึกหัด 3 ⭐: ห่อการเรียกเป็นฟังก์ชัน ask แล้วถามคำถามเดิม 3 รอบ
//
// โจทย์: เขียน ask(question) ที่ส่งคำถามไป Ollama แล้วคืน { text, inputTokens, outputTokens }
// จากนั้น main ถามคำถามเดิม 3 รอบ ทีละรอบต่อกัน (ไม่ยิงพร้อมกัน) พิมพ์รอบละ 2 บรรทัด
// รัน: pnpm lesson 006 exercise-3.ollama
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

export interface OllamaChatResponse {
  message: { role: string; content: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

interface Answer {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

// เฉลยจุดที่ 1: ห่อโค้ดจากข้อ 1 และ 2 เป็นฟังก์ชันเดียว จะได้เรียกซ้ำได้โดยไม่ต้องคัดลอกโค้ด
async function ask(question: string): Promise<Answer> {
  // สร้าง headers ในฟังก์ชัน เพราะ key อ่านจาก .env ตอนเรียก ไม่ใช่ตอน import ไฟล์
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = optionalEnv("OLLAMA_API_KEY");
  if (apiKey !== undefined) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${env("OLLAMA_BASE_URL")}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: env("OLLAMA_MODEL"),
      messages: [{ role: "user", content: question }],
      stream: false,
    }),
  });
  // fetch ไม่ throw เมื่อได้ 4xx/5xx จึงต้องตรวจ res.ok เอง ไม่งั้นจะอ่าน JSON ของ error เป็นคำตอบ
  if (!res.ok) {
    throw new Error(`Ollama ตอบ ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as OllamaChatResponse;
  return {
    text: data.message.content,
    inputTokens: data.prompt_eval_count ?? 0,
    outputTokens: data.eval_count ?? 0,
  };
}

export async function main(): Promise<void> {
  // เฉลยจุดที่ 2: for + await ในลูปทำให้ถามทีละรอบต่อกัน
  // ทำไมไม่ใช้ Promise.all: ยิงพร้อมกันจะชนโควต้า/ขีดจำกัดของ provider ง่าย และลำดับผลลัพธ์ที่พิมพ์ก็ไม่แน่นอน
  for (let i = 1; i <= 3; i++) {
    const answer = await ask(QUESTION);
    console.log(`ครั้งที่ ${i}: ${answer.text}`);
    console.log(`(token ${answer.inputTokens}→${answer.outputTokens})`);
  }
}
