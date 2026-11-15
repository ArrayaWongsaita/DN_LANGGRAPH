// บท 006: เรียก Gemini ด้วย fetch ตรงๆ (ไม่ใช้ไลบรารี)
// (ไฟล์นี้ใช้ await ที่บนสุดของไฟล์ได้ เพราะโปรเจกต์เป็น ES module)
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

// หน้าตาของ response ที่เราสนใจ
interface GeminiPart {
  text?: string;
  thought?: boolean; // true = ส่วนที่โมเดลคิดในใจ ไม่ใช่คำตอบ
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: unknown;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
}

interface RequestParts {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

// ต่อ text ของทุก part ที่ไม่ใช่ thought ถ้าไม่มีข้อความเลย (เช่นถูกบล็อกหรือตอบไม่จบ) ให้ throw พร้อมเหตุผล
function extractText(data: GeminiResponse): string {
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => part.thought !== true)
    .map((part) => part.text ?? "")
    .join("");
  if (text === "") {
    const reason = `finishReason=${candidate?.finishReason ?? "ไม่มี"} promptFeedback=${JSON.stringify(data.promptFeedback ?? null)}`;
    throw new Error(`Gemini ไม่ส่งข้อความกลับมา (${reason})`);
  }
  return text;
}

// ขั้นที่ 1: ประกอบคำขอ เป็นฟังก์ชันธรรมดา ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
// key ส่งใน header ไม่ใส่ใน URL (URL อาจถูกบันทึกลง log)
function buildRequest(question: string): RequestParts {
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${env("GOOGLE_MODEL").replace(/^models\//, "")}:generateContent`,
    headers: {
      // Content-Type บอกเซิร์ฟเวอร์ว่า body ที่ส่งเป็น JSON
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
console.log(`คำตอบ: ${extractText(data)}`);
