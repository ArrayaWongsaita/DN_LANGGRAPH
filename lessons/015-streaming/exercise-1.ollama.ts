// แบบฝึกหัด 1: เขียนตัวรับ stream ที่ต่อข้อความและบอกทุกครั้งที่ได้ข้อความใหม่
//
// โจทย์: เติม streamToText(stream, onText) ให้วนอ่าน stream ทีละชิ้น เรียก onText(ข้อความของชิ้นนั้น) ทุกครั้งที่ชิ้นมีข้อความ
// แล้วคืนข้อความทั้งหมดที่ต่อกัน ไฟล์จะใช้มันกับโมเดลจริง (พิมพ์คำตอบทีละชิ้น) แล้วพิมพ์
//   ได้ทั้งหมด: N ตัวอักษร
//   ใช้เวลาถึงชิ้นแรก: X ms
//
// แนวทาง:
// 1. ชิ้นของ stream คือ AIMessageChunk อ่านข้อความด้วย chunk.text (เหมือนตัวอย่าง)
// 2. ชิ้นที่ .text ว่างไม่ต้องเรียก onText
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ streamToText คืน "" เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 015 exercise-1.ollama
import { AIMessageChunk } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำวิธีเก็บเมล็ดกาแฟให้หอมนาน 3 ข้อ";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function streamToText(stream: AsyncIterable<AIMessageChunk>, onText: (t: string) => void): Promise<string> {
  void stream; // บรรทัดนี้กัน lint เตือนว่าตัวแปร stream ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ stream
  void onText; // เช่นเดียวกัน: ลบทิ้งเมื่อเริ่มเรียก onText
  // 👉 วน for await อ่าน stream เรียก onText กับชิ้นที่มีข้อความ แล้วคืนข้อความที่ต่อกัน (แทนบรรทัด return Promise.resolve(""))
  return Promise.resolve("");
}

// stream ปลอม 2 ชิ้น ใช้ทดสอบ streamToText ก่อนเรียกโมเดล
async function* fakeChunks(): AsyncGenerator<AIMessageChunk> {
  await Promise.resolve(); // ให้เป็น stream แบบ async จริง (ชิ้นแรกมาหลังจากเริ่มอ่าน)
  yield new AIMessageChunk("ก");
  yield new AIMessageChunk("ข");
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ streamToText ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if ((await streamToText(fakeChunks(), () => undefined)) !== "กข") {
    console.log("👉 ยังไม่ได้เติม streamToText (ดูบรรทัดที่มี 👉) ต้องคืน กข เมื่อได้ชิ้น ก และ ข");
    return;
  }

  const start = performance.now();
  let firstMs: number | undefined;
  const text = (
    await streamToText(await model.stream(QUESTION), (t) => {
      // จดเวลาตอนที่ข้อความชิ้นแรกมาถึง
      firstMs ??= Math.round(performance.now() - start);
      process.stdout.write(t);
    })
  ).trim();
  process.stdout.write("\n");
  console.log(`ได้ทั้งหมด: ${[...text].length} ตัวอักษร`);
  console.log(`ใช้เวลาถึงชิ้นแรก: ${firstMs === undefined ? "ไม่มี" : `${firstMs} ms`}`);
}
