// เฉลยแบบฝึกหัด 2: ลองแปลงซ้ำเมื่อโมเดลไม่ได้ให้ args ที่ใช้ได้
//
// โจทย์: เติม classifyWithRetry(classify, message, maxAttempts) ให้เรียก classify(message) ซ้ำเมื่อได้ null
// จนกว่าจะได้ผลหรือครบ maxAttempts แล้วคืน { result, attempts } (attempts = จำนวนครั้งที่เรียกจริง)
// ไฟล์ใช้ includeRaw ในขั้นจริง (parsed ?? null) และแสดงผลด้วยตัวอย่างปลอม 2 ตัวที่รู้คำตอบล่วงหน้า
// รัน: pnpm lesson 022 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";
import { CLASSIFY_SYSTEM, CustomerQuestion, MESSAGES } from "./customer-question";

const TOOL = "classify_question";
const MAX_ATTEMPTS = 3;

// คำตอบที่ตัวปลอมใช้ ไม่ได้มาจากโมเดล
const FAKE_QUESTION: CustomerQuestion = { category: "product", keywords: ["แก้ว"], urgent: false, summary: "ถามเรื่องแก้ว" };

// ตัวปลอมแบบที่ 1: คืน null ครั้งแรก แล้วได้ผลครั้งที่ 2
function flaky(): (message: string) => Promise<CustomerQuestion | null> {
  let calls = 0;
  return () => {
    calls += 1;
    return Promise.resolve(calls === 1 ? null : FAKE_QUESTION);
  };
}

// ตัวปลอมแบบที่ 2: คืน null ทุกครั้ง
function never(): (message: string) => Promise<CustomerQuestion | null> {
  return () => Promise.resolve(null);
}

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

async function classifyWithRetry(
  classify: (message: string) => Promise<CustomerQuestion | null>,
  message: string,
  maxAttempts: number,
): Promise<{ result: CustomerQuestion | null; attempts: number }> {
  // เฉลยจุดที่ 1: วนครั้งที่ 1 ถึง maxAttempts แล้วเรียก classify(message) จริงทุกรอบ
  // หยุดทันทีที่ได้ผลแรกที่ไม่เป็น null: attempts จึงเป็นจำนวนครั้งที่เรียกจริง ไม่ใช่ maxAttempts ตายตัว
  // ไม่เขียน while (true) เพราะต้องมีเพดาน: ถ้าโมเดลให้ args เสียทุกครั้ง การลองไม่จำกัดจะกิน token และเวลาจนไม่มีที่สิ้นสุด
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await classify(message);
    if (result !== null) return { result, attempts: attempt };
  }
  // ครบ maxAttempts แล้วยังเป็น null: คืนจำนวนครั้งที่ลองจริงให้ผู้เรียกตัดสินใจต่อ (พิมพ์บอกผู้ใช้หรือยกเลิก)
  return { result: null, attempts: maxAttempts };
}

// ตัวข้อความของบรรทัด ตรวจตัวอย่าง: สร้างจากผลจริงเสมอ ไม่พิมพ์ข้อความตายตัว
function sampleText(result: CustomerQuestion | null, attempts: number): string {
  return result === null ? `ลองครบ ${attempts} ครั้งแล้วยังไม่ได้` : `ได้ผลในครั้งที่ ${attempts}`;
}

export async function main(): Promise<void> {
  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่า retry ทำงานจริง: ตัวปลอมตัวแรกได้ผลครั้งที่ 2 ตัวที่สองไม่ได้ผลเลย
  const first = await classifyWithRetry(flaky(), MESSAGES[0], MAX_ATTEMPTS);
  console.log(`ตรวจตัวอย่าง: ${sampleText(first.result, first.attempts)}`);
  const second = await classifyWithRetry(never(), MESSAGES[0], MAX_ATTEMPTS);
  console.log(`ตรวจตัวอย่าง: ${sampleText(second.result, second.attempts)}`);

  const chain = model.withStructuredOutput(CustomerQuestion, { name: TOOL, method: "functionCalling", includeRaw: true });
  // ขั้นจริงใช้ parsed ?? null จาก includeRaw: null หรือ undefined ของ LangChain กลายเป็น null ของเรา
  const classify = async (message: string): Promise<CustomerQuestion | null> => {
    const { parsed } = await chain.invoke([
      { role: "system", content: CLASSIFY_SYSTEM },
      { role: "user", content: message },
    ]);
    return parsed ?? null;
  };

  let ok = 0;
  for (const [i, message] of MESSAGES.entries()) {
    const { result, attempts } = await classifyWithRetry(classify, message, MAX_ATTEMPTS);
    if (result === null) {
      console.log(`ข้อ ${i + 1}: แปลงไม่สำเร็จ (ลอง ${attempts} ครั้ง)`);
      continue;
    }
    ok += 1;
    console.log(`ข้อ ${i + 1}: ${result.category} (ครั้งที่ ${attempts})`);
  }
  console.log(`แปลงสำเร็จ: ${ok}/${MESSAGES.length}`);
}
