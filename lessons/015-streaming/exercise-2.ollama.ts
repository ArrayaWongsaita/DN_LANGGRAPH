// แบบฝึกหัด 2: หยุด stream เองเมื่อได้ข้อความยาวพอ
//
// โจทย์: เติม shouldStop(soFar) ให้คืน true เมื่อข้อความที่ได้มาแล้ว (soFar) ยาว 50 ตัวอักษรขึ้นไป ไม่เช่นนั้นคืน false
// ไฟล์จะ stream คำตอบของคำถามยาว และเรียก abort() เมื่อ shouldStop คืน true แล้วพิมพ์
//   หยุดเมื่อได้ N ตัวอักษร (ตั้งไว้ 50)
//
// แนวทาง:
// 1. นับตัวอักษรด้วย [...soFar].length (กระจาย string เป็นอาร์เรย์ของตัวอักษร) ไม่ใช่ soFar.length ที่นับหน่วยภายในของ JavaScript
// 2. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ shouldStop คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 3. N ที่พิมพ์อาจมากกว่า 50 เล็กน้อย เพราะข้อความมาทีละชิ้น ไม่ใช่ทีละตัวอักษร
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 015 exercise-2.ollama
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

function shouldStop(soFar: string): boolean | undefined {
  void soFar; // บรรทัดนี้กัน lint เตือนว่าตัวแปร soFar ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ soFar
  // 👉 คืน true เมื่อ soFar ยาว 50 ตัวอักษรขึ้นไป ไม่เช่นนั้น false (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ shouldStop ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (shouldStop("") === undefined) {
    console.log("👉 ยังไม่ได้เติม shouldStop (ดูบรรทัดที่มี 👉)");
    return;
  }

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
