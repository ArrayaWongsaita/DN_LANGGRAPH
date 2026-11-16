// เฉลยแบบฝึกหัด 1: batch ที่บางข้อล้ม: ใช้ returnExceptions แล้วนับข้อที่สำเร็จและล้มเหลว
//
// โจทย์: เติม countResults(rs) ให้นับผลของ batch ว่ามีกี่ข้อที่เป็นคำตอบ (string) และกี่ข้อที่เป็น Error
// คืน { ok, failed } ไฟล์ถาม 5 ข้อผ่าน RunnableLambda ที่ตั้งใจให้ล้ม 1 ข้อ (คำถามที่มี "(ทดสอบล้ม)") แล้วพิมพ์
//   ข้อ i: สำเร็จ   หรือ   ข้อ i: ล้มเหลว (<ข้อความ error>)
//   สำเร็จ X ล้มเหลว Y
// รัน: pnpm lesson 014 exercise-1.ollama

import { RunnableLambda } from "@langchain/core/runnables";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTIONS = [
  "DN Shop ขายแก้วเซรามิกใบละ 250 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายเมล็ดกาแฟคั่วกลางถุงละ 380 บาท (ทดสอบล้ม) เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายที่กรองกาแฟดริปราคา 150 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายเครื่องบดกาแฟมือหมุนราคา 890 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายกระเป๋าผ้าลายกาแฟใบละ 120 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
];

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function countResults(rs: (string | Error)[]): { ok: number; failed: number } {
  // เฉลยจุดที่ 1: ใช้ instanceof Error แยกข้อที่ล้ม เพราะ returnExceptions: true ทำให้ข้อที่ล้มกลายเป็นค่า Error อยู่ในอาร์เรย์ผล
  // (ข้อที่สำเร็จเป็น string) นับ failed ก่อนแล้วให้ ok เป็นส่วนที่เหลือ จึงรวมกันได้ครบทุกข้อพอดี
  const failed = rs.filter((r) => r instanceof Error).length;
  return { ok: rs.length - failed, failed };
}

// ข้อที่มี "(ทดสอบล้ม)" จะ throw โดยไม่เรียกโมเดล ข้ออื่นถามโมเดลตามปกติ
const askOrFail = RunnableLambda.from(async (q: string): Promise<string> => {
  if (q.includes("(ทดสอบล้ม)")) throw new Error("ข้อนี้ตั้งใจให้ล้ม");
  return (await model.invoke(q)).text;
});

export async function main(): Promise<void> {
  // อาร์กิวเมนต์ที่ 2 คือ config (maxConcurrency) อาร์กิวเมนต์ที่ 3 คือ batchOptions (returnExceptions)
  const results = await askOrFail.batch(QUESTIONS, { maxConcurrency: 2 }, { returnExceptions: true });
  results.forEach((r, i) => {
    console.log(r instanceof Error ? `ข้อ ${i + 1}: ล้มเหลว (${r.message})` : `ข้อ ${i + 1}: สำเร็จ`);
  });
  const counts = countResults(results);
  console.log(`สำเร็จ ${counts.ok} ล้มเหลว ${counts.failed}`);
  // ทดสอบ countResults อีกครั้งกับข้อมูลตัวอย่างอีกชุด (ไม่เรียกโมเดล) เพื่อให้เห็นว่านับจากข้อมูลจริง ไม่ใช่ตัวเลขคงที่
  const sample = countResults(["ก", "ข", new Error("x")]);
  console.log(`ตรวจนับตัวอย่าง: สำเร็จ ${sample.ok} ล้มเหลว ${sample.failed}`);
}
