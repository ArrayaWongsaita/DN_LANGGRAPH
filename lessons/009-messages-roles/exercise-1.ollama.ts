// เฉลยแบบฝึกหัด 1: สอนรูปแบบคำตอบด้วยตัวอย่าง (few-shot)
//
// โจทย์: เติม examples ให้เป็นตัวอย่างถาม-ตอบ (human แล้ว ai) อย่างน้อย 2 คู่ ที่ตอบเป็นรูปแบบเดียวกันทุกคู่
//   สินค้า: <ชื่อสินค้า> | ราคา: <ตัวเลข> บาท
// แล้วถามคำถามจริงว่า "กาแฟดริปซองราคาเท่าไร" ผลที่ต้องเห็น: `คำตอบ: ...` ในรูปแบบเดียวกับตัวอย่าง
// รัน: pnpm lesson 009 exercise-1.ollama
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
  // เฉลยจุดที่ 1: few-shot คือใส่ตัวอย่าง user/assistant เรียงสลับกัน โมเดลจะเลียนรูปแบบคำตอบจากตัวอย่าง
  // คำตอบของ assistant ทุกคู่ใช้รูปแบบเดียวกัน และราคาเป็นตัวเลขล้วน (ไม่มีเครื่องหมายอื่นปนเข้าไป)
  // user คู่แรกบอกรูปแบบไว้ในประโยคเดียว และใช้สินค้าใกล้เคียงคำถามจริง เพื่อให้โมเดลไม่ปฏิเสธว่าไม่มีข้อมูลราคา
  return [
    {
      role: "user",
      content: "ตอบเป็นบรรทัดเดียวตามรูปแบบ สินค้า: <ชื่อ> | ราคา: <ตัวเลข> บาท ถ้าไม่รู้ราคาให้ประมาณเอง: กาแฟดริปถุงราคาเท่าไร",
    },
    { role: "assistant", content: "สินค้า: กาแฟดริปถุง | ราคา: 129 บาท" },
    { role: "user", content: "ชาไทยเย็นราคาเท่าไร" },
    { role: "assistant", content: "สินค้า: ชาไทยเย็น | ราคา: 45 บาท" },
  ];
}

export async function main(): Promise<void> {
  const shots = examples();

  const res = await model.invoke([...shots, { role: "user", content: QUESTION }]);
  console.log(`คำตอบ: ${res.text}`);
}
