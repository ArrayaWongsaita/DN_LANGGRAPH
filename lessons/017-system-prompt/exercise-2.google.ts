// แบบฝึกหัด 2: กฎ "น้ำเสียง" ที่ทำให้ทุกคำตอบลงท้ายด้วยประโยคเดิม
//
// โจทย์: เติม toneRules() ให้คืนอาร์เรย์ของกฎสำหรับหัวข้อ "น้ำเสียง" ที่ทำให้ทุกคำตอบลงท้ายด้วยประโยค
// ขอบคุณที่อุดหนุน DN Shop ครับ ไฟล์ใช้กฎของคุณแทนกฎน้ำเสียงเดิมทั้งชุด แล้วถามโมเดล 2 คำถาม
//
// แนวทาง:
// 1. กฎน้ำเสียงเดิมมีข้อ "ลงท้ายด้วย ครับ" ซึ่งจะขัดกับกฎใหม่ จึงถูกแทนที่ทั้งชุด (กฎที่ขัดกันทำให้โมเดลทำตามไม่แน่นอน)
// 2. ชุดใหม่ควรยังสั่งให้ตอบภาษาไทย สุภาพ ไม่เกิน 3 ประโยค (ประโยคลงท้ายนับรวมด้วย) แล้วเพิ่มกฎลงท้าย
// 3. จุด 👉: คืนอาร์เรย์ของกฎ ตอนนี้ toneRules คืนอาร์เรย์ว่างเสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 017 exercise-2.google
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
  // 👉 คืนอาร์เรย์ของกฎน้ำเสียงที่ทำให้ทุกคำตอบลงท้ายด้วย ขอบคุณที่อุดหนุน DN Shop ครับ (แทนบรรทัด return [])
  return [];
}

async function askWith(system: string, question: string): Promise<string> {
  const res = await model.invoke([
    { role: "system", content: system },
    { role: "user", content: question },
  ]);
  return res.text;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ toneRules ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (toneRules().length === 0) {
    console.log("👉 ยังไม่ได้เติม toneRules (ดูบรรทัดที่มี 👉)");
    return;
  }

  const prompt = buildSystemPrompt({ ...PARTS, tone: toneRules() });
  for (const [i, question] of QUESTIONS.entries()) {
    console.log(`--- คำถามที่ ${i + 1} ---`);
    console.log(await askWith(prompt, question));
  }
}
