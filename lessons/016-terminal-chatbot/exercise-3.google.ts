// เฉลยแบบฝึกหัด 3 ⭐: รวมชิ้นของ stream แล้วอ่านจำนวน token ของแต่ละตา
//
// โจทย์: เติม mergeChunks(chunks) ให้รวม AIMessageChunk หลายชิ้นเป็นชิ้นเดียวด้วย concat (จาก @langchain/core/utils/stream)
// คืน undefined ถ้าไม่มีชิ้นเลย ไฟล์จะเก็บทุกชิ้นของแต่ละตาแล้วใช้ mergeChunks รวม เพื่ออ่าน usage_metadata ของชิ้นที่รวมแล้ว
// และพิมพ์หลังคำตอบของทุกตา
//   (token ขาเข้า N ขาออก M)
// รัน: pnpm lesson 016 exercise-3.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)

import { AIMessage, AIMessageChunk, type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { concat } from "@langchain/core/utils/stream";
import { ChatGoogle } from "@langchain/google";
import { ask } from "../../src/lib/ask";
import { env } from "../../src/lib/env";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ร้านขายกาแฟและอุปกรณ์ชงกาแฟออนไลน์ ตอบภาษาไทย สั้น สุภาพ";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function mergeChunks(chunks: AIMessageChunk[]): AIMessageChunk | undefined {
  // เฉลยจุดที่ 1: รวมด้วย concat ไม่บวกสตริงหรือบวก token เอง เพราะ concat รู้วิธีรวม usage_metadata และ field อื่นของชิ้นให้ถูกต้อง
  // รวมทุกชิ้นรวมถึงชิ้นที่ไม่มีข้อความ เพราะ usage_metadata มักอยู่ที่ชิ้นท้ายสุดซึ่งไม่มีข้อความ
  let merged: AIMessageChunk | undefined;
  for (const chunk of chunks) merged = merged === undefined ? chunk : concat(merged, chunk);
  return merged;
}

export async function main(): Promise<void> {
  console.log("--- แชทบอท DN Shop (พิมพ์ จบ เพื่อออก แสดงจำนวน token ทุกตา) ---");
  const history: BaseMessage[] = [new SystemMessage(SYSTEM)];
  while (true) {
    const line = await ask("คุณ: ");
    if (line === null || line === "จบ") break;
    if (line === "") continue;

    history.push(new HumanMessage(line));
    process.stdout.write("ผู้ช่วย: ");
    let reply = "";
    const chunks: AIMessageChunk[] = [];
    for await (const chunk of await model.stream(history)) {
      process.stdout.write(chunk.text);
      reply += chunk.text;
      chunks.push(chunk);
    }
    process.stdout.write("\n");
    history.push(new AIMessage(reply));
    const usage = mergeChunks(chunks)?.usage_metadata;
    console.log(`(token ขาเข้า ${usage?.input_tokens ?? "ไม่มี"} ขาออก ${usage?.output_tokens ?? "ไม่มี"})`);
  }
  console.log("ลาก่อนครับ");
  console.log(`จำนวนข้อความในประวัติ: ${history.length}`);
}
