// บท 007: เรียก Ollama ผ่าน LangChain ด้วย ChatOllama (ไม่ต้องเขียน URL, body และดึงคำตอบเอง)
// ขั้นที่ 1 สร้าง AIMessage เองเพื่อดูว่า content มี 2 แบบ ขั้นที่ 2 ถามโมเดลจริง
// รัน: pnpm lesson 007 example.ollama
import { AIMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

// ชื่อโมเดลและที่อยู่ Ollama อ่านจาก .env ไม่เขียนลงในโค้ด
// ถ้ายิง Ollama Cloud ตรงจะมี OLLAMA_API_KEY และต้องส่งใน header Authorization
const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

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
  // .text ต่อข้อความทุกชิ้นให้เป็น string เดียวเสมอ ไม่ว่า content จะเป็นแบบไหน
  console.log(`.text ของทั้งสองแบบ: ${plain.text} | ${blocks.text}`);

  // ขั้นที่ 2: ถามโมเดลจริง ผลเปลี่ยนได้ทุกครั้ง
  console.log("--- ขั้นที่ 2: ถามด้วย ChatOllama ---");
  const res = await model.invoke(QUESTION);
  console.log(`คำตอบ: ${res.text}`);
}
