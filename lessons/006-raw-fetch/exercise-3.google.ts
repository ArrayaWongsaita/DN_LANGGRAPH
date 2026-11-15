// เฉลยแบบฝึกหัด 3 ⭐: ห่อการเรียกเป็นฟังก์ชัน ask แล้วถามคำถามเดิม 3 รอบ
//
// โจทย์: เขียน ask(question) ที่ส่งคำถามไป Gemini แล้วคืน { text, inputTokens, outputTokens }
// จากนั้น main ถามคำถามเดิม 3 รอบ ทีละรอบต่อกัน (ไม่ยิงพร้อมกัน) พิมพ์รอบละ 2 บรรทัด
// รัน: pnpm lesson 006 exercise-3.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

export interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: unknown;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
}

interface Answer {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

// เฉลยจุดที่ 1: ห่อโค้ดจากข้อ 1 และ 2 เป็นฟังก์ชันเดียว จะได้เรียกซ้ำได้โดยไม่ต้องคัดลอกโค้ด
async function ask(question: string): Promise<Answer> {
  const model = env("GOOGLE_MODEL").replace(/^models\//, "");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    // key ส่งทาง header ไม่ใส่ใน URL เพราะ URL มักถูกบันทึกลง log
    headers: { "Content-Type": "application/json", "x-goog-api-key": env("GOOGLE_API_KEY") },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: question }] }] }),
  });
  // fetch ไม่ throw เมื่อได้ 4xx/5xx จึงต้องตรวจ res.ok เอง
  if (!res.ok) {
    throw new Error(`Gemini ตอบ ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as GeminiResponse;

  // ข้าม part ที่ thought เป็น true (ความคิดในใจของโมเดล ไม่ใช่คำตอบ) แล้วต่อ text ที่เหลือ
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => part.thought !== true)
    .map((part) => part.text ?? "")
    .join("");
  // ทำไมต้อง throw: ถ้าถูกบล็อกหรือตอบไม่จบ จะไม่มีข้อความเลย ควรบอกเหตุผลแทนการเงียบแล้วพิมพ์คำตอบว่าง
  if (text === "") {
    const reason = `finishReason=${candidate?.finishReason ?? "ไม่มี"} promptFeedback=${JSON.stringify(data.promptFeedback ?? null)}`;
    throw new Error(`Gemini ไม่ส่งข้อความกลับมา (${reason})`);
  }

  // ขาออก = candidatesTokenCount + thoughtsTokenCount (token ที่ใช้คิดก็นับเป็นขาออก) ฟิลด์ที่ไม่มีถือเป็น 0
  const usage = data.usageMetadata;
  return {
    text,
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
  };
}

export async function main(): Promise<void> {
  // เฉลยจุดที่ 2: for + await ในลูปทำให้ถามทีละรอบต่อกัน
  // ทำไมไม่ใช้ Promise.all: ยิงพร้อมกันจะชนโควต้าต่อนาทีของ Google ง่าย (429) และลำดับผลลัพธ์ที่พิมพ์ไม่แน่นอน
  for (let i = 1; i <= 3; i++) {
    const answer = await ask(QUESTION);
    console.log(`ครั้งที่ ${i}: ${answer.text}`);
    console.log(`(token ${answer.inputTokens}→${answer.outputTokens})`);
  }
}
