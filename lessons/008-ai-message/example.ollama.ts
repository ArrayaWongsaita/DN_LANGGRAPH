// บท 008: อ่านส่วนต่างๆ ของ AIMessage ที่ ChatOllama คืนมา
// ขั้นที่ 1 สร้าง AIMessage เองแล้วอ่านฟิลด์ ขั้นที่ 2 อ่านฟิลด์เดียวกันจากโมเดลจริง
// รัน: pnpm lesson 008 example.ollama
import { AIMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "ร้านกาแฟควรมีเมนูอะไรบ้าง ตอบ 3 ข้อ";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

// พิมพ์ฟิลด์สำคัญของ AIMessage ชุดเดียวกันทั้งขั้นที่ 1 และ 2
function describe(msg: AIMessage): void {
  // usage_metadata คือจำนวน token มีรูปแบบเดียวกันทุก provider (อาจไม่มี จึงใช้ ?. และ ?? 0)
  console.log(`ขาเข้า: ${msg.usage_metadata?.input_tokens ?? 0}`);
  console.log(`ขาออก: ${msg.usage_metadata?.output_tokens ?? 0}`);
  console.log(`รวม: ${msg.usage_metadata?.total_tokens ?? 0}`);
  // response_metadata คือข้อมูลดิบจาก provider ฟิลด์ model_provider บอกว่ามาจากเจ้าไหน
  console.log(`provider: ${String(msg.response_metadata.model_provider)}`);
  // contentBlocks คือเนื้อหาแบ่งเป็นชิ้น แต่ละชิ้นมี type (เช่น text) เหมือนกันทุก provider
  for (const block of msg.contentBlocks) console.log(`block: ${block.type}`);
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: สร้าง AIMessage เอง ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: อ่าน AIMessage ที่สร้างเอง ---");
  const fake = new AIMessage({
    content: "สวัสดีครับ",
    usage_metadata: { input_tokens: 12, output_tokens: 3, total_tokens: 15 },
    response_metadata: { model_provider: "ollama" },
  });
  describe(fake);

  // ขั้นที่ 2: ถามโมเดลจริง ตัวเลขและคำตอบเปลี่ยนได้ทุกครั้ง
  console.log("--- ขั้นที่ 2: อ่าน AIMessage จากโมเดลจริง ---");
  const res = await model.invoke(QUESTION);
  describe(res);
  // Ollama บอกเหตุที่โมเดลหยุดไว้ที่ done_reason (stop = จบเอง, length = หมดโควต้า token)
  console.log(`จบเพราะ: ${String(res.response_metadata.done_reason)}`);
  console.log(`คำตอบ: ${res.text}`);
}
