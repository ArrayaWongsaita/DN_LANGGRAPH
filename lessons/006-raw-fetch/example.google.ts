// บท 006: เรียก Gemini ด้วย fetch ตรงๆ (ไม่ใช้ไลบรารี)
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

// หน้าตาของ response ที่เราสนใจ
interface GeminiPart {
  text?: string;
  thought?: boolean; // true = ส่วนที่โมเดลคิดในใจ ไม่ใช่คำตอบ
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

interface RequestParts {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

// ขั้นที่ 1: ประกอบคำขอ เป็นฟังก์ชันธรรมดา ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
// key ส่งใน header ไม่ใส่ใน URL (URL อาจถูกบันทึกลง log)
function buildRequest(question: string): RequestParts {
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${env("GOOGLE_MODEL")}:generateContent`,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env("GOOGLE_API_KEY"),
    },
    body: {
      contents: [{ role: "user", parts: [{ text: question }] }],
    },
  };
}

// ซ่อนค่า key ก่อนพิมพ์ขึ้นหน้าจอ
function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    masked[name] = name === "x-goog-api-key" ? "***" : value;
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
  throw new Error(`Gemini ตอบ ${res.status}: ${await res.text()}`);
}
const data = (await res.json()) as GeminiResponse;
// คำตอบอาจแบ่งเป็นหลาย part และบาง part เป็นส่วนที่โมเดลคิด (thought: true) ต้องข้าม
const parts = data.candidates?.[0]?.content?.parts ?? [];
const answer = parts
  .filter((part) => part.thought !== true)
  .map((part) => part.text ?? "")
  .join("");
console.log(`คำตอบ: ${answer}`);
