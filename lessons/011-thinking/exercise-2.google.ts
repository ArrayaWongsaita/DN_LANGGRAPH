// แบบฝึกหัด 2: เลือกระดับการคิดตามชนิดของคำถาม
//
// โจทย์: เติม chooseLevel ให้คืน "high" เมื่อคำถามมีตัวเลข (ต้องคำนวณ จึงควรให้โมเดลคิดมาก) และ "low" เมื่อไม่มี
// แล้วไฟล์จะถาม 2 คำถาม (ทักทาย แล้วคำนวณ) โดยตั้ง thinkingLevel ตามที่ chooseLevel เลือก และพิมพ์ข้อละ 2 บรรทัด
//   คำถาม: <คำถาม> → thinkingLevel: <low หรือ high>
//   คำตอบ: <คำตอบ>
//
// แนวทาง:
// 1. ตัวเลขในคำถามตรวจได้ด้วย regular expression หรือวนดูทีละตัวอักษร ถนัดแบบไหนก็ได้
// 2. คำถามทักทายไม่ต้องใช้การคิดมาก การคิดมากเสียเวลาและ token เปล่าๆ (ดูหัวข้อ "เมื่อไรควรให้คิด" ใน README)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ chooseLevel คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 011 exercise-2.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTIONS = [
  "สวัสดีครับ",
  "ซื้อกาแฟ 3 แก้ว แก้วละ 65 บาท มีคูปองลด 10% แต่ลดได้ไม่เกิน 15 บาท ต้องจ่ายเท่าไร",
];

function chooseLevel(question: string): "low" | "high" | undefined {
  void question; // บรรทัดนี้กัน lint เตือนว่าตัวแปร question ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ question
  // 👉 คืน "high" เมื่อ question มีตัวเลข ไม่เช่นนั้น "low" (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ chooseLevel ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (chooseLevel("สวัสดี") === undefined) {
    console.log("👉 ยังไม่ได้เติม chooseLevel (ดูบรรทัดที่มี 👉)");
    return;
  }

  for (const question of QUESTIONS) {
    const level = chooseLevel(question);
    console.log(`คำถาม: ${question} → thinkingLevel: ${String(level)}`);
    const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), thinkingLevel: level });
    const res = await model.invoke(question);
    console.log(`คำตอบ: ${res.text}`);
  }
}
