// บท 006: เรียก Ollama ด้วย fetch ตรงๆ (ไม่ใช้ไลบรารี)
// (ไฟล์นี้ใช้ await ที่บนสุดของไฟล์ได้ เพราะโปรเจกต์เป็น ES module)
// ใช้ได้ทั้ง Ollama ในเครื่อง และ Ollama Cloud แบบยิงตรง (ต่างกันแค่ค่าใน .env)
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

// หน้าตาของ response ที่เราสนใจ (Ollama ส่งฟิลด์อื่นมาอีกมาก เราประกาศเฉพาะที่ใช้)
interface OllamaChatResponse {
  message: { role: string; content: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

interface RequestParts {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

// ขั้นที่ 1: ประกอบคำขอ เป็นฟังก์ชันธรรมดา ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
function buildRequest(question: string): RequestParts {
  // Content-Type บอกเซิร์ฟเวอร์ว่า body ที่ส่งเป็น JSON
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = optionalEnv("OLLAMA_API_KEY");
  // Bearer คือรูปแบบมาตรฐานของการส่ง token ใน header Authorization
  if (apiKey !== undefined) headers.Authorization = `Bearer ${apiKey}`;

  return {
    url: `${env("OLLAMA_BASE_URL")}/api/chat`,
    headers,
    body: {
      model: env("OLLAMA_MODEL"),
      messages: [{ role: "user", content: question }],
      stream: false,
    },
  };
}

// ซ่อนค่า key ก่อนพิมพ์ขึ้นหน้าจอ
function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    masked[name] = name === "Authorization" ? "Bearer ***" : value;
  }
  return masked;
}

const request = buildRequest(QUESTION);

console.log("--- ขั้นที่ 1: คำขอที่จะส่ง ---");
console.log(`URL: ${request.url}`);
console.log(`headers: ${JSON.stringify(maskHeaders(request.headers), null, 2)}`);
console.log(`body: ${JSON.stringify(request.body, null, 2)}`);

// ขั้นที่ 2: ส่งจริง
console.log("--- ขั้นที่ 2: ส่งด้วย fetch ---");
const res = await fetch(request.url, {
  method: "POST",
  headers: request.headers,
  body: JSON.stringify(request.body),
});
if (!res.ok) {
  throw new Error(`Ollama ตอบ ${res.status}: ${await res.text()}`);
}
const data = (await res.json()) as OllamaChatResponse;
console.log(`คำตอบ: ${data.message.content}`);
