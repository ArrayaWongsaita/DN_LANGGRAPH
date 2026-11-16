// บท 011: โมเดลที่คิดก่อนตอบ: ดู block reasoning และเทียบระดับการคิดกับ ChatGoogle
// ขั้นที่ 1 สร้าง AIMessage ที่มี block reasoning เอง ไม่ยิงเน็ต ขั้นที่ 2 ถามคำถามคำนวณเดิมด้วย thinkingLevel high และ low
// รัน: pnpm lesson 011 example.google
import { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "ซื้อกาแฟ 3 แก้ว แก้วละ 65 บาท มีคูปองลด 10% แต่ลดได้ไม่เกิน 15 บาท ต้องจ่ายเท่าไร";

// thinkingLevel คือระดับการคิดของ Gemini (ระดับที่ใช้ได้ต่างกันไปตามรุ่น) ตั้งค่านี้แล้วจึงจะได้ block reasoning กลับมา
function makeModel(level: "low" | "high"): ChatGoogle {
  return new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), thinkingLevel: level });
}

// นับความยาวความคิดจาก block ชนิด reasoning (นับเป็นตัวอักษรจริง ไม่ใช่ UTF-16 code unit)
function reasoningLength(msg: AIMessage): number {
  let total = 0;
  for (const block of msg.contentBlocks) {
    if (block.type === "reasoning") total += [...block.reasoning].length;
  }
  return total;
}

async function askWith(label: string, level: "low" | "high"): Promise<void> {
  const started = performance.now();
  const res = await makeModel(level).invoke(QUESTION);
  const seconds = (performance.now() - started) / 1000;
  const outputTokens = res.usage_metadata?.output_tokens ?? 0;
  console.log(`${label}: reasoning ${reasoningLength(res)} ตัวอักษร · ใช้เวลา ${seconds.toFixed(1)} วินาที · token ขาออก ${outputTokens}`);
  console.log(`คำตอบ: ${res.text}`);
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: สร้าง AIMessage เอง ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: block ใน AIMessage ---");
  const fake = new AIMessage({
    content: [
      { type: "reasoning", reasoning: "ลูกค้าถามเรื่องคืนสินค้า" },
      { type: "text", text: "คืนได้ภายใน 7 วันครับ" },
    ],
  });
  for (const block of fake.contentBlocks) {
    if (block.type === "reasoning") console.log(`block: reasoning (${[...block.reasoning].length} ตัวอักษร)`);
    if (block.type === "text") console.log(`block: text (${[...block.text].length} ตัวอักษร)`);
  }
  // .text รวมเฉพาะ block ชนิด text ความคิดไม่ถูกรวม
  console.log(`.text: ${fake.text}`);

  // ขั้นที่ 2: ถามโมเดลจริง ตัวเลข เวลา และคำตอบเปลี่ยนได้ทุกครั้ง
  console.log("--- ขั้นที่ 2: เปิด/ปิดการคิด ---");
  await askWith("ชุดที่ 1 (thinkingLevel: high)", "high");
  await askWith("ชุดที่ 2 (thinkingLevel: low)", "low");
}
