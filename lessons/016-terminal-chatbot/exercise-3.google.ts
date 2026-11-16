// แบบฝึกหัด 3 ⭐: รวมชิ้นของ stream แล้วอ่านจำนวน token ของแต่ละตา
//
// โจทย์: เติม mergeChunks(chunks) ให้รวม AIMessageChunk หลายชิ้นเป็นชิ้นเดียวด้วย concat (จาก @langchain/core/utils/stream)
// คืน undefined ถ้าไม่มีชิ้นเลย ไฟล์จะเก็บทุกชิ้นของแต่ละตาแล้วใช้ mergeChunks รวม เพื่ออ่าน usage_metadata ของชิ้นที่รวมแล้ว
// และพิมพ์หลังคำตอบของทุกตา
//   (token ขาเข้า N ขาออก M)
//
// แนวทาง:
// 1. เพิ่ม import { concat } from "@langchain/core/utils/stream" ที่หัวไฟล์ concat(a, b) รวมสองชิ้นเป็นหนึ่งชิ้น ข้อความต่อกัน และ usage_metadata ถูกรวมให้ด้วย ใช้วนรวมทีละชิ้นได้ (reduce หรือ for)
// 2. ชิ้นที่ไม่มีข้อความก็ต้องรวมด้วย เพราะ usage_metadata มักอยู่ที่ชิ้นท้ายสุดซึ่งไม่มีข้อความ
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ mergeChunks คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 016 exercise-3.google
import { AIMessage, AIMessageChunk, type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { ask } from "../../src/lib/ask";
import { env } from "../../src/lib/env";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ร้านขายกาแฟและอุปกรณ์ชงกาแฟออนไลน์ ตอบภาษาไทย สั้น สุภาพ";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function mergeChunks(chunks: AIMessageChunk[]): AIMessageChunk | undefined {
  void chunks; // บรรทัดนี้กัน lint เตือนว่าตัวแปร chunks ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ chunks
  // 👉 รวมทุกชิ้นด้วย concat แล้วคืนชิ้นที่รวมแล้ว (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ mergeChunks ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (mergeChunks([new AIMessageChunk("ก"), new AIMessageChunk("ข")])?.text !== "กข") {
    console.log("👉 ยังไม่ได้เติม mergeChunks (ดูบรรทัดที่มี 👉) ต้องคืนชิ้นที่มีข้อความ กข");
    return;
  }

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
