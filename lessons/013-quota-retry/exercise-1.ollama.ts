// แบบฝึกหัด 1: คำนวณเวลารอก่อนลองใหม่ (exponential backoff แบบมีเพดาน)
//
// โจทย์: เติม backoffMs(attempt) ให้คืนจำนวนมิลลิวินาทีที่ต้องรอ "ก่อนลองครั้งที่ attempt"
//   ครั้งที่ 2 รอ 500 ms, ครั้งที่ 3 รอ 1000 ms, ครั้งที่ 4 รอ 2000 ms ... เท่าตัวไปเรื่อยๆ แต่ไม่เกิน 4000 ms
//   ครั้งที่ 1 ไม่มีการรอ (เป็นครั้งแรก) ให้คืน undefined
// แล้วไฟล์จะพิมพ์ตาราง `รอก่อนลองครั้งที่ n: X ms` ของ n = 2 ถึง 6 จากนั้นถามโมเดลจริงด้วย loop ลองใหม่ที่เขียนไว้ให้แล้ว
// (ครั้งแรกตั้ง timeout 1 ms ให้ล้มแน่ๆ) แล้วพิมพ์
//   ครั้งที่ 1: ล้มเหลว (TimeoutError) รอ 500 ms
//   ครั้งที่ 2: สำเร็จ
//   คำตอบ: ...
//
// แนวทาง:
// 1. คิดทีละเรื่อง: ครั้งที่ต่ำกว่า 2 คืนอะไร, ครั้งที่ 2 เป็นฐานเท่าไร (2 ยกกำลังเท่าไรจึงได้ฐานพอดี), และเพดาน 4000 ใส่ตรงไหน
// 2. ใน JavaScript ยกกำลังเขียน 2 ** k และหาค่าน้อยกว่าของสองค่าใช้ Math.min
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ backoffMs คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 013 exercise-1.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "ร้านกาแฟควรเปิดกี่โมง ตอบ 1 ประโยค";
const MAX_ATTEMPTS = 3;

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function nameOf(e: unknown): string {
  return e instanceof Error ? e.name : typeof e;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number | undefined {
  void attempt; // บรรทัดนี้กัน lint เตือนว่าตัวแปร attempt ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ attempt
  // 👉 คืนเวลารอก่อนลองครั้งที่ attempt (ครั้งที่ต่ำกว่า 2 คืน undefined) แทนบรรทัด return undefined
  return undefined;
}

// loop ลองใหม่ (เขียนไว้ให้แล้ว): ล้มแล้วถาม backoffMs ว่าต้องรอเท่าไรก่อนครั้งถัดไป
async function askWithBackoff(q: string): Promise<string> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // ครั้งแรกตั้ง timeout 1 ms เพื่อให้ล้มแน่ๆ ใช้ .stream() เพราะ invoke + timeout ไม่ throw (ดู README)
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
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ backoffMs ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (backoffMs(2) === undefined) {
    console.log("👉 ยังไม่ได้เติม backoffMs (ดูบรรทัดที่มี 👉)");
    return;
  }
  // ครั้งที่ 1 เป็นครั้งแรก ไม่มีการรอ backoffMs(1) ต้องคืน undefined
  if (backoffMs(1) !== undefined) {
    console.log("👉 backoffMs(1) ต้องคืน undefined เพราะครั้งแรกไม่ต้องรอ (ดูบรรทัดที่มี 👉)");
    return;
  }

  for (let n = 2; n <= 6; n++) {
    console.log(`รอก่อนลองครั้งที่ ${n}: ${backoffMs(n)} ms`);
  }
  const answer = await askWithBackoff(QUESTION);
  console.log(`คำตอบ: ${answer.replace(/\s+/g, " ").trim()}`);
}
