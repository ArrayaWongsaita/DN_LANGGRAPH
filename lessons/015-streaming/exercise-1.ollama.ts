// เฉลยแบบฝึกหัด 1: เขียนตัวรับ stream ที่ต่อข้อความและบอกทุกครั้งที่ได้ข้อความใหม่
//
// โจทย์: เติม streamToText(stream, onText) ให้วนอ่าน stream ทีละชิ้น เรียก onText(ข้อความของชิ้นนั้น) ทุกครั้งที่ชิ้นมีข้อความ
// แล้วคืนข้อความทั้งหมดที่ต่อกัน ไฟล์จะใช้มันกับโมเดลจริง (พิมพ์คำตอบทีละชิ้น) แล้วพิมพ์
//   ได้ทั้งหมด: N ตัวอักษร
//   ใช้เวลาถึงชิ้นแรก: X ms
// รัน: pnpm lesson 015 exercise-1.ollama
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

async function streamToText(stream: AsyncIterable<AIMessageChunk>, onText: (t: string) => void): Promise<string> {
  // เฉลยจุดที่ 1: วน for await อ่านทีละชิ้น เพราะ stream ส่งข้อความมาเป็นชิ้นๆ ไม่ได้ส่งครั้งเดียว
  // ชิ้นที่ .text ว่าง (เช่นชิ้นท้ายที่มีแต่ metadata) ข้ามไป ไม่เรียก onText เพื่อไม่ให้ผู้เรียกได้ค่าว่างโดยไม่จำเป็น
  let all = "";
  for await (const chunk of stream) {
    const t = chunk.text;
    if (t === "") continue;
    onText(t);
    all += t;
  }
  return all;
}

export async function main(): Promise<void> {
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
