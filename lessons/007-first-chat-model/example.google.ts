// บท 007: เรียก Gemini ผ่าน LangChain ด้วย ChatGoogle (ไม่ต้องเขียน URL, body และดึงคำตอบเอง)
// ขั้นที่ 1 สร้าง AIMessage เองเพื่อดูว่า content มี 2 แบบ ขั้นที่ 2 ถามโมเดลจริง
// รัน: pnpm lesson 007 example.google
import { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

// ชื่อโมเดลและ key อ่านจาก .env ไม่เขียนลงในโค้ด (key ส่งให้ไลบรารีจัดการ เราไม่ต้องใส่ header เอง)
const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

export async function main(): Promise<void> {
  // ขั้นที่ 1: สร้าง AIMessage เอง 2 แบบ ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: content กับ .text ---");
  const plain = new AIMessage("สวัสดีครับ");
  const blocks = new AIMessage({
    content: [
      { type: "text", text: "สวัสดี" },
      { type: "text", text: "ครับ" },
    ],
  });
  console.log(`content แบบข้อความ: ${JSON.stringify(plain.content)}`);
  console.log(`content แบบ array: ${JSON.stringify(blocks.content)}`);
  // .text ต่อข้อความทุกชิ้นให้เป็น string เดียวเสมอ ไม่ว่า content จะเป็นแบบไหน (Gemini อาจคืนเป็น array)
  console.log(`.text ของทั้งสองแบบ: ${plain.text} | ${blocks.text}`);

  // ขั้นที่ 2: ถามโมเดลจริง ผลเปลี่ยนได้ทุกครั้ง
  console.log("--- ขั้นที่ 2: ถามด้วย ChatGoogle ---");
  const res = await model.invoke(QUESTION);
  console.log(`คำตอบ: ${res.text}`);
}
