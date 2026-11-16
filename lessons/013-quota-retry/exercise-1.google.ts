// เฉลยแบบฝึกหัด 1: คำนวณเวลารอก่อนลองใหม่ (exponential backoff แบบมีเพดาน)
//
// โจทย์: เติม backoffMs(attempt) ให้คืนจำนวนมิลลิวินาทีที่ต้องรอ "ก่อนลองครั้งที่ attempt"
//   ครั้งที่ 2 รอ 500 ms, ครั้งที่ 3 รอ 1000 ms, ครั้งที่ 4 รอ 2000 ms ... เท่าตัวไปเรื่อยๆ แต่ไม่เกิน 4000 ms
//   ครั้งที่ 1 ไม่มีการรอ (เป็นครั้งแรก) ให้คืน undefined
// แล้วไฟล์จะพิมพ์ตาราง `รอก่อนลองครั้งที่ n: X ms` ของ n = 2 ถึง 6 จากนั้นถามโมเดลจริงด้วย loop ลองใหม่ที่เขียนไว้ให้แล้ว
// (ครั้งแรกตั้ง timeout 1 ms ให้ล้มแน่ๆ) แล้วพิมพ์
//   ครั้งที่ 1: ล้มเหลว (TimeoutError) รอ 500 ms
//   ครั้งที่ 2: สำเร็จ
//   คำตอบ: ...
// รัน: pnpm lesson 013 exercise-1.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)

import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "ร้านกาแฟควรเปิดกี่โมง ตอบ 1 ประโยค";
const MAX_ATTEMPTS = 3;

// ChatGoogle ลองใหม่เองโดยปริยาย (ลองซ้ำหลายรอบ) และไม่หยุดเมื่อเจอ TimeoutError จึงซ้อนกับ .withRetry() ของบทนี้
// และทำให้โปรแกรมค้างอยู่หลังได้คำตอบแล้ว ตั้ง maxRetries: 0 เพื่อให้ .withRetry() เป็นชั้นลองใหม่ชั้นเดียว
const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), maxRetries: 0 });

function nameOf(e: unknown): string {
  return e instanceof Error ? e.name : typeof e;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number | undefined {
  // เฉลยจุดที่ 1: ครั้งแรก (attempt 1) ไม่ต้องรอ จึงคืน undefined เพื่อให้ผู้เรียกแยกได้ว่า "ไม่มีการรอ" ต่างจากรอ 0 ms
  if (attempt < 2) return undefined;
  // ครั้งที่ 2 ได้ 500 ms (ฐาน) แล้วเท่าตัวทุกครั้ง: 500 * 2 ** (attempt - 2) จึงเป็น 500, 1000, 2000, 4000, 8000 ...
  // Math.min ตัดเพดานที่ 4000 ms กันรอนานเกินไปเมื่อลองหลายรอบ (เพดานยังกันตัวเลขโตไม่หยุดด้วย)
  return Math.min(500 * 2 ** (attempt - 2), 4000);
}

// loop ลองใหม่ (เขียนไว้ให้แล้ว): ล้มแล้วถาม backoffMs ว่าต้องรอเท่าไรก่อนครั้งถัดไป
async function askWithBackoff(q: string): Promise<string> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // ครั้งแรกตั้ง timeout 1 ms เพื่อให้ล้มแน่ๆ ใช้ .stream() ตามที่ README อธิบาย
    const timeout = attempt === 1 ? 1 : 60_000;
    try {
      let text = "";
      for await (const chunk of await model.stream(q, { timeout })) text += chunk.text;
      console.log(`ครั้งที่ ${attempt}: สำเร็จ`);
      return text;
    } catch (e) {
      const waitMs = backoffMs(attempt + 1);
      if (waitMs === undefined || attempt === MAX_ATTEMPTS) throw e;
      console.log(`ครั้งที่ ${attempt}: ล้มเหลว (${nameOf(e)}) รอ ${waitMs} ms`);
      await sleep(waitMs);
    }
  }
  throw new Error("ลองครบแล้วแต่ไม่สำเร็จ");
}

export async function main(): Promise<void> {
  for (let n = 2; n <= 6; n++) {
    console.log(`รอก่อนลองครั้งที่ ${n}: ${backoffMs(n)} ms`);
  }
  const answer = await askWithBackoff(QUESTION);
  console.log(`คำตอบ: ${answer.replace(/\s+/g, " ").trim()}`);
}
