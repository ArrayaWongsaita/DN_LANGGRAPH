// แบบฝึกหัด 1: ดึงความคิดของโมเดลออกมาจาก AIMessage
//
// โจทย์: เติม reasoningOf ให้คืนข้อความความคิดของโมเดล (ต่อทุก block ชนิด reasoning เข้าด้วยกัน)
// แล้วไฟล์จะถามโมเดลด้วย thinkingLevel: "high" และพิมพ์ 2 ส่วน
//   ความคิด (80 ตัวอักษรแรก): <ความคิด 80 ตัวอักษรแรก>
//   คำตอบ: <คำตอบ>
//
// แนวทาง:
// 1. ขั้นที่ 1 ของ example.google.ts วน contentBlocks และแยกชนิดของ block ด้วย block.type อยู่แล้ว ใช้วิธีเดียวกัน
// 2. ถ้า message ไม่มี block reasoning เลย ให้คืนสตริงว่าง "" (ไม่ใช่ undefined)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ reasoningOf คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 011 exercise-1.google
import { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "ซื้อกาแฟ 3 แก้ว แก้วละ 65 บาท มีคูปองลด 10% แต่ลดได้ไม่เกิน 15 บาท ต้องจ่ายเท่าไร";

// thinkingLevel "high" ให้ Gemini คิดมากและส่ง block reasoning กลับมา
const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), thinkingLevel: "high" });

function reasoningOf(msg: AIMessage): string | undefined {
  void msg; // บรรทัดนี้กัน lint เตือนว่าตัวแปร msg ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ msg
  // 👉 คืนความคิดของ msg โดยต่อ reasoning ของทุก block ชนิด reasoning (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้ลองเรียก reasoningOf กับ AIMessage ปลอมก่อน กันไม่ให้เรียกโมเดลทั้งที่ยังไม่ได้เติม (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const fake = new AIMessage({
    content: [
      { type: "reasoning", reasoning: "ลูกค้าถามเรื่องคืนสินค้า" },
      { type: "text", text: "คืนได้ภายใน 7 วันครับ" },
    ],
  });
  if (reasoningOf(fake) === undefined) {
    console.log("👉 ยังไม่ได้เติม reasoningOf (ดูบรรทัดที่มี 👉)");
    return;
  }

  const res = await model.invoke(QUESTION);
  const thought = [...(reasoningOf(res) ?? "")].slice(0, 80).join("").replace(/\s+/g, " ");
  console.log(`ความคิด (80 ตัวอักษรแรก): ${thought}`);
  console.log(`คำตอบ: ${res.text}`);
}
