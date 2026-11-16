// แบบฝึกหัด 2: ทำให้คำตอบนิ่งด้วย system prompt (และ temperature 0)
//
// โจทย์: เติม systemPrompt ให้คืน system prompt ที่บอกว่าร้านเปิด 09:00-20:00 และบังคับให้ตอบรูปแบบเดียวเสมอ
//   เวลาเปิด: HH:MM-HH:MM
// แล้วไฟล์จะถาม "ร้านเปิดกี่โมงครับ" 3 ครั้ง และพิมพ์ครั้งละ 1 บรรทัด `ครั้งที่ i: <คำตอบ>` ทุกครั้งต้องอยู่ในรูปแบบเดียวกัน
//
// แนวทาง:
// 1. system prompt ที่ดีบอก 3 อย่าง: ข้อมูลที่โมเดลต้องใช้ (เวลาเปิด) รูปแบบคำตอบที่ต้องการ และห้ามมีอย่างอื่นปนมา
// 2. การยกตัวอย่างรูปแบบในตัว prompt (ตามบท 009) ช่วยให้โมเดลทำตามได้นิ่งขึ้น
// 3. จุด 👉: คืนข้อความ system prompt ตอนนี้ systemPrompt คืนสตริงว่างเสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 010 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "ร้านเปิดกี่โมงครับ";
const ROUNDS = 3;

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
  temperature: 0,
});

function systemPrompt(): string {
  // 👉 คืน system prompt ที่บอกเวลาเปิด 09:00-20:00 และบังคับรูปแบบ เวลาเปิด: HH:MM-HH:MM (แทนบรรทัด return "")
  return "";
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ยังไม่มี system prompt (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const system = systemPrompt();
  if (system === "") {
    console.log("👉 ยังไม่ได้เติม systemPrompt (ดูบรรทัดที่มี 👉)");
    return;
  }

  for (let i = 1; i <= ROUNDS; i++) {
    const res = await model.invoke([
      { role: "system", content: system },
      { role: "user", content: QUESTION },
    ]);
    console.log(`ครั้งที่ ${i}: ${res.text.replace(/\s+/g, " ").trim()}`);
  }
}
