// แบบฝึกหัด 2: รวมยอด token ที่ใช้ไปหลายคำถาม
//
// โจทย์: เติม addUsage(total, msg) ให้คืนยอดรวมใหม่ = total บวกกับ token ของ msg (ขาเข้า ขาออก และรวม)
// แล้วไฟล์จะถามโมเดล 3 คำถามต่อกัน พิมพ์ token ของแต่ละข้อ และยอดรวมทั้งหมด
//   ข้อ i: ขาเข้า N ขาออก M
//   รวมทั้งหมด: ขาเข้า N ขาออก M รวม T
//
// แนวทาง:
// 1. token ของคำตอบหนึ่งอยู่ที่ msg.usage_metadata มี 3 ฟิลด์ input_tokens, output_tokens, total_tokens (ดูบท 008)
// 2. usage_metadata อาจเป็น undefined (บางครั้งไม่มี) ถ้าไม่มีให้ถือว่าไม่เพิ่ม
// 3. ฟังก์ชันนี้ไม่ควรแก้ค่าใน total ที่รับเข้ามา ให้คืนก้อนใหม่
// 4. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ addUsage คืน total เดิมเสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 5. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 013 exercise-2.ollama
import { AIMessage, type UsageMetadata } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTIONS = [
  "กาแฟดริปต่างจากเอสเปรสโซอย่างไร ตอบ 1 ประโยค",
  "ชาเขียวมีคาเฟอีนไหม ตอบ 1 ประโยค",
  "ควรเก็บเมล็ดกาแฟอย่างไร ตอบ 1 ประโยค",
];

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

const ZERO: UsageMetadata = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

function addUsage(total: UsageMetadata, msg: AIMessage): UsageMetadata {
  void msg; // บรรทัดนี้กัน lint เตือนว่าตัวแปร msg ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ msg
  // 👉 คืนยอดรวมใหม่ที่บวก token ของ msg เข้าไปแล้ว (แทนบรรทัด return total)
  return total;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ addUsage ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const sample = new AIMessage({
    content: "ตัวอย่าง",
    usage_metadata: { input_tokens: 3, output_tokens: 2, total_tokens: 5 },
  });
  if (addUsage(ZERO, sample).total_tokens === 0) {
    console.log("👉 ยังไม่ได้เติม addUsage (ดูบรรทัดที่มี 👉)");
    return;
  }

  let total = ZERO;
  for (const [i, q] of QUESTIONS.entries()) {
    const res = await model.invoke(q);
    console.log(`ข้อ ${i + 1}: ขาเข้า ${res.usage_metadata?.input_tokens ?? 0} ขาออก ${res.usage_metadata?.output_tokens ?? 0}`);
    total = addUsage(total, res);
  }
  console.log(`รวมทั้งหมด: ขาเข้า ${total.input_tokens} ขาออก ${total.output_tokens} รวม ${total.total_tokens}`);
}
