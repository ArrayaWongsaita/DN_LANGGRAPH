// บท 017: system prompt ที่แบ่งเป็น 4 ส่วน (บทบาท ขอบเขต น้ำเสียง สิ่งที่ห้ามตอบ) ใช้คุมคำตอบของโมเดล
// ขั้นที่ 1 ประกอบ prompt จากข้อมูล (ไม่ยิงเน็ต) ขั้นที่ 2 ถามคำถามเดิมโดยมีและไม่มี system prompt เทียบกัน
// รัน: pnpm lesson 017 example.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

interface PromptParts {
  role: string;
  scope: string[];
  tone: string[];
  forbidden: string[];
}

const PARTS: PromptParts = {
  role: "คุณคือผู้ช่วยตอบคำถามของร้าน DN Shop ร้านขายกาแฟและอุปกรณ์ชงกาแฟออนไลน์",
  scope: [
    "ตอบเฉพาะเรื่องสินค้า วิธีชงกาแฟ การสั่งซื้อ และการจัดส่งของร้าน",
    "ถ้าคำถามอยู่นอกขอบเขตนี้ ให้ขึ้นต้นคำตอบด้วย [นอกขอบเขต] แล้วบอกสั้นๆ ว่าช่วยเรื่องอะไรได้บ้าง",
  ],
  tone: ["ตอบภาษาไทย สุภาพ ไม่เกิน 3 ประโยค", "ลงท้ายด้วย ครับ"],
  forbidden: ["ห้ามแต่งราคา โปรโมชัน หรือส่วนลดที่ไม่มีในข้อมูลของร้าน"],
};

const QUESTION_IN_SCOPE = "เครื่องบดกาแฟมือหมุนต่างจากเครื่องบดไฟฟ้ายังไง";
const QUESTION_OUT_OF_SCOPE = "ช่วยแต่งกลอนวันแม่ให้หน่อย";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

// ต่อ 4 ส่วนเป็น prompt ก้อนเดียว คั่นแต่ละส่วนด้วยบรรทัดว่าง ส่วนที่เป็นรายการขึ้นต้นบรรทัดด้วย "- "
function buildSystemPrompt(p: PromptParts): string {
  const list = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");
  return [
    `## บทบาท\n${p.role}`,
    `## ขอบเขต\n${list(p.scope)}`,
    `## น้ำเสียง\n${list(p.tone)}`,
    `## สิ่งที่ห้ามตอบ\n${list(p.forbidden)}`,
  ].join("\n\n");
}

// ถามด้วยรูปย่อ { role, content } ถ้าไม่ส่ง system มา ก็ส่งแค่คำถาม
async function askWith(question: string, system?: string): Promise<string> {
  const user = { role: "user", content: question };
  const res = await model.invoke(system === undefined ? [user] : [{ role: "system", content: system }, user]);
  return res.text;
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: ประกอบ system prompt จาก 4 ส่วน ---");
  const prompt = buildSystemPrompt(PARTS);
  console.log(prompt);
  // [...prompt] นับทีละตัวอักษร (ไม่ใช่ทีละหน่วยของ UTF-16) จึงนับภาษาไทยตรงกับที่ตาเห็น
  console.log(`ความยาว: ${[...prompt].length} ตัวอักษร`);

  // ขั้นที่ 2: ถามโมเดลจริง คำถามเดิม 2 ข้อ ข้อละ 2 แบบ
  console.log("--- ขั้นที่ 2: คำถามเดิม มีและไม่มี system prompt ---");
  console.log("--- คำถามที่ 1 ไม่มี system prompt ---");
  console.log(await askWith(QUESTION_IN_SCOPE));
  console.log("--- คำถามที่ 1 มี system prompt ---");
  console.log(await askWith(QUESTION_IN_SCOPE, prompt));
  console.log("--- คำถามที่ 2 ไม่มี system prompt ---");
  console.log(await askWith(QUESTION_OUT_OF_SCOPE));
  console.log("--- คำถามที่ 2 มี system prompt ---");
  console.log(await askWith(QUESTION_OUT_OF_SCOPE, prompt));
}
