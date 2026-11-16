// บท 015: stream: รับคำตอบทีละชิ้นด้วย for await และหยุดกลางทางด้วย AbortController
// ขั้นที่ 1 ฝึก for await กับ stream ปลอม (ไม่ยิงเน็ต) ขั้นที่ 2 ใช้ model.stream กับโมเดลจริง แล้วลองหยุดกลางทาง
// รัน: pnpm lesson 015 example.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำวิธีเก็บเมล็ดกาแฟให้หอมนาน 3 ข้อ";
const LONG_QUESTION = "เล่าประวัติกาแฟแบบละเอียดอย่างน้อย 10 ประโยค";
const STOP_AFTER = 3; // หยุดเมื่อได้ชิ้นที่มีข้อความครบกี่ชิ้น

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// async generator ปลอม: ส่งข้อความออกมาทีละชิ้น ห่างกันชิ้นละ 50 ms เหมือนโมเดลที่ตอบทีละส่วน
async function* fakeStream(): AsyncGenerator<string> {
  for (const piece of ["ร้าน", "เปิด", "ทุก", "วัน"]) {
    await sleep(50);
    yield piece;
  }
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: for await กับ stream ปลอม ---");
  let whole = "";
  let pieces = 0;
  for await (const piece of fakeStream()) {
    // process.stdout.write พิมพ์โดยไม่ขึ้นบรรทัดใหม่ จึงต่อชิ้นไว้บรรทัดเดียวกันได้
    process.stdout.write(pieces === 0 ? piece : `|${piece}`);
    whole += piece;
    pieces += 1;
  }
  process.stdout.write("\n");
  console.log(`ได้ ${pieces} ชิ้น รวมเป็น: ${whole}`);

  // ขั้นที่ 2: ยิงโมเดลจริง
  console.log("--- ขั้นที่ 2: stream จากโมเดลจริง ---");
  let textPieces = 0;
  let totalChars = 0;
  for await (const chunk of await model.stream(QUESTION)) {
    // ชิ้นท้ายๆ เป็น metadata ที่ไม่มีข้อความ (.text ว่าง) จึงนับเฉพาะชิ้นที่มีข้อความ
    if (chunk.text === "") continue;
    process.stdout.write(chunk.text);
    textPieces += 1;
    totalChars += [...chunk.text].length;
  }
  process.stdout.write("\n");
  console.log(`ชิ้นที่มีข้อความ: ${textPieces}`);
  console.log(`ความยาวรวม: ${totalChars} ตัวอักษร`);

  console.log("--- หยุดกลางทางด้วย AbortController ---");
  const controller = new AbortController();
  let received = 0;
  try {
    for await (const chunk of await model.stream(LONG_QUESTION, { signal: controller.signal })) {
      if (chunk.text === "") continue;
      received += 1;
      process.stdout.write(chunk.text);
      // สั่ง abort() แล้วปล่อยให้ loop ทำงานต่อ: รอบถัดไปจะ throw AbortError (หรือ loop จบเอง)
      if (received === STOP_AFTER) controller.abort();
    }
  } catch (e) {
    // AbortError คือผลของการหยุดที่เราสั่งเอง ไม่ใช่ความผิดพลาด error อื่นต้อง throw ต่อ
    if (!(e instanceof Error && e.name === "AbortError")) throw e;
  }
  process.stdout.write("\n");
  console.log(`หยุดกลางทาง หลังได้ ${received} ชิ้น`);
}
