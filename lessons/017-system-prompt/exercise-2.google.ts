// เฉลยแบบฝึกหัด 2: กฎ "น้ำเสียง" ที่ทำให้ทุกคำตอบลงท้ายด้วยประโยคเดิม
//
// โจทย์: เติม toneRules() ให้คืนอาร์เรย์ของกฎสำหรับหัวข้อ "น้ำเสียง" ที่ทำให้ทุกคำตอบลงท้ายด้วยประโยค
// ขอบคุณที่อุดหนุน DN Shop ครับ ไฟล์ใช้กฎที่เติมแทนกฎน้ำเสียงเดิมทั้งชุด แล้วถามโมเดล 2 คำถาม
// รัน: pnpm lesson 017 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

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

const QUESTIONS = ["ร้านส่งของกี่วันถึง", "แก้วเซรามิกเข้าไมโครเวฟได้ไหม"];

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function buildSystemPrompt(p: PromptParts): string {
  const list = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");
  return [
    `## บทบาท\n${p.role}`,
    `## ขอบเขต\n${list(p.scope)}`,
    `## น้ำเสียง\n${list(p.tone)}`,
    `## สิ่งที่ห้ามตอบ\n${list(p.forbidden)}`,
  ].join("\n\n");
}

function toneRules(): string[] {
  // เฉลยจุดที่ 1: ชุดกฎใหม่แทนของเดิมทั้งชุด จึงต้องไม่หลงเหลือ "ลงท้ายด้วย ครับ" ที่ขัดกับประโยคปิดท้ายใหม่
  // (กฎที่ขัดกันทำให้โมเดลเลือกทำข้อใดข้อหนึ่งแบบไม่แน่นอน) เก็บเรื่องภาษาและความยาวไว้ แล้วเพิ่มกฎปิดท้าย
  // บอกด้วยว่าประโยคปิดท้ายนับรวมใน 3 ประโยค ไม่งั้นโมเดลจะตอบยาวแล้วยังต้องต่อประโยคปิดท้ายจนเกินกำหนด
  return [
    "ตอบภาษาไทย สุภาพ ไม่เกิน 3 ประโยค (นับประโยคปิดท้ายด้วย)",
    "ทุกคำตอบต้องลงท้ายด้วยประโยค ขอบคุณที่อุดหนุน DN Shop ครับ",
  ];
}

async function askWith(system: string, question: string): Promise<string> {
  const res = await model.invoke([
    { role: "system", content: system },
    { role: "user", content: question },
  ]);
  return res.text;
}

export async function main(): Promise<void> {
  const prompt = buildSystemPrompt({ ...PARTS, tone: toneRules() });
  for (const [i, question] of QUESTIONS.entries()) {
    console.log(`--- คำถามที่ ${i + 1} ---`);
    console.log(await askWith(prompt, question));
  }
}
