// บท 011: โมเดลที่คิดก่อนตอบ: ดู block reasoning และเทียบเปิด/ปิดการคิดกับ ChatOllama
// ขั้นที่ 1 สร้าง AIMessage ที่มี block reasoning เอง ไม่ยิงเน็ต ขั้นที่ 2 ถามคำถามคำนวณเดิมด้วย think: true และ think: false
// รัน: pnpm lesson 011 example.ollama
import { AIMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "ซื้อกาแฟ 3 แก้ว แก้วละ 65 บาท มีคูปองลด 10% แต่ลดได้ไม่เกิน 15 บาท ต้องจ่ายเท่าไร";

const apiKey = optionalEnv("OLLAMA_API_KEY");

// think คือสวิตช์เปิด/ปิดการคิดของ Ollama (true = คิดก่อนตอบ, false = ตอบเลย)
function makeModel(think: boolean): ChatOllama {
  return new ChatOllama({
    model: env("OLLAMA_MODEL"),
    baseUrl: env("OLLAMA_BASE_URL"),
    headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
    think,
  });
}

// นับความยาวความคิดจาก block ชนิด reasoning (นับเป็นตัวอักษรจริง ไม่ใช่ UTF-16 code unit)
function reasoningLength(msg: AIMessage): number {
  let total = 0;
  for (const block of msg.contentBlocks) {
    if (block.type === "reasoning") total += [...block.reasoning].length;
  }
  return total;
}

async function askWith(label: string, think: boolean): Promise<void> {
  const started = performance.now();
  const res = await makeModel(think).invoke(QUESTION);
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
  await askWith("ชุดที่ 1 (think: true)", true);
  await askWith("ชุดที่ 2 (think: false)", false);
}
