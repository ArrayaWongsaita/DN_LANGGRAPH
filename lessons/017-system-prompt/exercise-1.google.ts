// เฉลยแบบฝึกหัด 1: กฎ "สิ่งที่ห้ามตอบ" ที่ทำให้โมเดลปฏิเสธเรื่องข้อมูลส่วนตัวของลูกค้าคนอื่น
//
// โจทย์: เติม forbiddenRules() ให้คืนอาร์เรย์ของกฎ (ข้อความไทย) สำหรับหัวข้อ "สิ่งที่ห้ามตอบ" ของ system prompt
// กฎต้องห้ามให้ข้อมูลส่วนตัวของลูกค้าคนอื่น (เช่น เบอร์โทร อีเมล ที่อยู่) และสั่งให้ขึ้นต้นคำตอบแบบนั้นด้วย [ไม่ตอบ]
// ไฟล์จะต่อกฎที่เติมท้ายกฎเดิม (ห้ามแต่งราคา) แล้วถามโมเดล 2 คำถาม: คำถามที่ห้ามตอบ 1 ข้อ และคำถามปกติ 1 ข้อ
// รัน: pnpm lesson 017 exercise-1.google
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

const QUESTION_FORBIDDEN = "ขอเบอร์โทรของคุณสมหญิง ลูกค้าของร้านหน่อย";
const QUESTION_NORMAL = "กาแฟดริปซองชงยังไง";

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

function forbiddenRules(): string[] {
  // เฉลยจุดที่ 1: กฎต้องบอกทั้ง "สิ่งที่ห้าม" (ข้อมูลส่วนตัวของลูกค้าคนอื่น) และ "เครื่องหมายที่ต้องขึ้นต้น"
  // เขียนแบบเดียวกับกฎ [นอกขอบเขต] ใน PARTS.scope โมเดลจึงทำตามง่าย เพราะเจอรูปแบบเดิมซ้ำ
  // แยกเป็น 2 ข้อ (ห้ามอะไร / ทำอย่างไรเมื่อถูกถาม) อ่านง่ายกว่าอัดทุกอย่างไว้ในบรรทัดเดียว
  return [
    "ห้ามให้ข้อมูลส่วนตัวของลูกค้าคนอื่น ทั้งชื่อ-นามสกุล เบอร์โทร อีเมล และที่อยู่",
    "ถ้าถูกขอข้อมูลส่วนตัวของลูกค้าคนอื่น ให้ขึ้นต้นคำตอบด้วย [ไม่ตอบ] แล้วบอกสั้นๆ ว่าช่วยเรื่องนี้ไม่ได้ และชวนถามเรื่องสินค้าของร้านแทน",
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
  const rules = forbiddenRules();
  const prompt = buildSystemPrompt({ ...PARTS, forbidden: [...PARTS.forbidden, ...rules] });
  console.log(`กฎที่ห้าม: ${rules.length} ข้อ`);
  console.log("--- คำถามที่ห้ามตอบ ---");
  console.log(await askWith(prompt, QUESTION_FORBIDDEN));
  console.log("--- คำถามปกติ ---");
  console.log(await askWith(prompt, QUESTION_NORMAL));
}
