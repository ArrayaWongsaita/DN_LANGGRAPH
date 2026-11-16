// แบบฝึกหัด 1: กฎ "สิ่งที่ห้ามตอบ" ที่ทำให้โมเดลปฏิเสธเรื่องข้อมูลส่วนตัวของลูกค้าคนอื่น
//
// โจทย์: เติม forbiddenRules() ให้คืนอาร์เรย์ของกฎ (ข้อความไทย) สำหรับหัวข้อ "สิ่งที่ห้ามตอบ" ของ system prompt
// กฎต้องห้ามให้ข้อมูลส่วนตัวของลูกค้าคนอื่น (เช่น เบอร์โทร อีเมล ที่อยู่) และสั่งให้ขึ้นต้นคำตอบแบบนั้นด้วย [ไม่ตอบ]
// ไฟล์จะต่อกฎของคุณท้ายกฎเดิม (ห้ามแต่งราคา) แล้วถามโมเดล 2 คำถาม: คำถามที่ห้ามตอบ 1 ข้อ และคำถามปกติ 1 ข้อ
//
// แนวทาง:
// 1. อ่านกฎใน PARTS.scope ของตัวอย่างที่สั่งให้ขึ้นต้นด้วย [นอกขอบเขต] ใช้วิธีเขียนแบบเดียวกัน แต่เปลี่ยนเหตุและเครื่องหมาย
// 2. กฎ 1 ข้อบอกได้ทั้งสิ่งที่ห้ามและเครื่องหมายที่ต้องขึ้นต้น หรือจะแยกเป็น 2 ข้อก็ได้
// 3. จุด 👉: คืนอาร์เรย์ของกฎ ตอนนี้ forbiddenRules คืนอาร์เรย์ว่างเสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 017 exercise-1.ollama
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

const QUESTION_FORBIDDEN = "ขอเบอร์โทรของคุณสมหญิง ลูกค้าของร้านหน่อย";
const QUESTION_NORMAL = "กาแฟดริปซองชงยังไง";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

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
  // 👉 คืนอาร์เรย์ของกฎที่ห้ามให้ข้อมูลส่วนตัวของลูกค้าคนอื่นและให้ขึ้นต้นด้วย [ไม่ตอบ] (แทนบรรทัด return [])
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
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ forbiddenRules ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (forbiddenRules().length === 0) {
    console.log("👉 ยังไม่ได้เติม forbiddenRules (ดูบรรทัดที่มี 👉)");
    return;
  }

  const rules = forbiddenRules();
  const prompt = buildSystemPrompt({ ...PARTS, forbidden: [...PARTS.forbidden, ...rules] });
  console.log(`กฎที่ห้าม: ${rules.length} ข้อ`);
  console.log("--- คำถามที่ห้ามตอบ ---");
  console.log(await askWith(prompt, QUESTION_FORBIDDEN));
  console.log("--- คำถามปกติ ---");
  console.log(await askWith(prompt, QUESTION_NORMAL));
}
