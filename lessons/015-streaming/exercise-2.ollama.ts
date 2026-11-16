// เฉลยแบบฝึกหัด 2: หยุด stream เองเมื่อได้ข้อความยาวพอ
//
// โจทย์: เติม shouldStop(soFar) ให้คืน true เมื่อข้อความที่ได้มาแล้ว (soFar) ยาว 50 ตัวอักษรขึ้นไป ไม่เช่นนั้นคืน false
// ไฟล์จะ stream คำตอบของคำถามยาว และเรียก abort() เมื่อ shouldStop คืน true แล้วพิมพ์
//   หยุดเมื่อได้ N ตัวอักษร (ตั้งไว้ 50)
// รัน: pnpm lesson 015 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const LONG_QUESTION = "เล่าประวัติกาแฟแบบละเอียดอย่างน้อย 10 ประโยค";
const LIMIT = 50;

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function shouldStop(soFar: string): boolean {
  // เฉลยจุดที่ 1: นับด้วย [...soFar].length เพราะ soFar.length นับหน่วยภายในของ JavaScript ซึ่งอักขระบางตัว (เช่นอีโมจิ) นับเป็น 2
  // ใช้ >= (50 ตัวขึ้นไป) ตามโจทย์ ไม่ใช่ === เพราะข้อความมาทีละชิ้น ความยาวอาจข้าม 50 ไปเลยโดยไม่เคยเท่าพอดี
  return [...soFar].length >= LIMIT;
}

export async function main(): Promise<void> {
  // ทดสอบกับข้อมูลตัวอย่าง (ไม่เรียกโมเดล) เพื่อให้เห็นว่า shouldStop ตัดสินจากความยาวจริง
  console.log(`ตรวจตัวอย่าง: 49 ตัว=${shouldStop("ก".repeat(49))} 50 ตัว=${shouldStop("ก".repeat(50))}`);

  const controller = new AbortController();
  let soFar = "";
  try {
    for await (const chunk of await model.stream(LONG_QUESTION, { signal: controller.signal })) {
      soFar += chunk.text;
      process.stdout.write(chunk.text);
      if (shouldStop(soFar)) controller.abort();
    }
  } catch (e) {
    // AbortError คือผลของการหยุดที่เราสั่งเอง error อื่นต้อง throw ต่อ
    if (!(e instanceof Error && e.name === "AbortError")) throw e;
  }
  process.stdout.write("\n");
  console.log(`หยุดเมื่อได้ ${[...soFar].length} ตัวอักษร (ตั้งไว้ ${LIMIT})`);
}
