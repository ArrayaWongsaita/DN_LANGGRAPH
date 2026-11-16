// แบบฝึกหัด 1: สอนรูปแบบคำตอบด้วยตัวอย่าง (few-shot)
//
// โจทย์: เติม examples ให้เป็นตัวอย่างถาม-ตอบ (human แล้ว ai) อย่างน้อย 2 คู่ ที่ตอบเป็นรูปแบบเดียวกันทุกคู่
//   สินค้า: <ชื่อสินค้า> | ราคา: <ตัวเลข> บาท
// แล้วถามคำถามจริงว่า "กาแฟดริปซองราคาเท่าไร" ผลที่ต้องเห็น: `คำตอบ: ...` ในรูปแบบเดียวกับตัวอย่าง
//
// แนวทาง:
// 1. ใช้รูปย่อ { role: "user", content: "..." } แทน human และ { role: "assistant", content: "..." } แทน ai
//    (ในรูปย่อ ai เรียกว่า "assistant")
// 2. จุด 👉: คืน array ที่เรียงเป็น user, assistant, user, assistant ... อย่างน้อย 2 คู่
//    - คำตอบของ assistant ทุกคู่เป็นบรรทัดเดียว รูปแบบตรงตัวนี้ (ราคาเป็นตัวเลขล้วน): สินค้า: ชาไทยเย็น | ราคา: 45 บาท
//    - ให้ข้อความ user ของคู่แรกบอกรูปแบบไว้ด้วยในประโยคเดียว เช่น "ตอบเป็นบรรทัดเดียวตามรูปแบบ สินค้า: <ชื่อ> | ราคา: <ตัวเลข> บาท ถ้าไม่รู้ราคาให้ประมาณเอง: กาแฟดริปถุงราคาเท่าไร"
//      และให้สินค้าของคู่แรกคล้ายคำถามจริง (กาแฟดริป) โมเดลจะไม่ปฏิเสธว่า "ไม่มีข้อมูลราคา" และเลียนแบบได้ง่ายขึ้น
// 3. ตอนนี้ examples คืน [] เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 009 exercise-1.ollama
import type { BaseMessageLike } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "กาแฟดริปซองราคาเท่าไร";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function examples(): BaseMessageLike[] {
  // 👉 คืนตัวอย่างถาม-ตอบอย่างน้อย 2 คู่ (แทนบรรทัด return [])
  return [];
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ยังไม่มีตัวอย่าง (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const shots = examples();
  if (shots.length === 0) {
    console.log("👉 ยังไม่ได้เติม examples (ดูบรรทัดที่มี 👉)");
    return;
  }

  const res = await model.invoke([...shots, { role: "user", content: QUESTION }]);
  console.log(`คำตอบ: ${res.text}`);
}
