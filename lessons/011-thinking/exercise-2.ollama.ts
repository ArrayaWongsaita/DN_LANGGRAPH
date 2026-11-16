// แบบฝึกหัด 2: เลือกเปิด/ปิดการคิดตามชนิดของคำถาม
//
// โจทย์: เติม chooseThink ให้คืน true เมื่อคำถามมีตัวเลข (ต้องคำนวณ จึงควรให้โมเดลคิด) และ false เมื่อไม่มี
// แล้วไฟล์จะถาม 2 คำถาม (ทักทาย แล้วคำนวณ) โดยตั้ง think ตามที่ chooseThink เลือก และพิมพ์ข้อละ 2 บรรทัด
//   คำถาม: <คำถาม> → think: <true หรือ false>
//   คำตอบ: <คำตอบ>
//
// แนวทาง:
// 1. ตัวเลขในคำถามตรวจได้ด้วย regular expression หรือวนดูทีละตัวอักษร ถนัดแบบไหนก็ได้
// 2. คำถามทักทายไม่ต้องใช้การคิด การเปิดคิดเสียเวลาและ token เปล่าๆ (ดูหัวข้อ "เมื่อไรควรให้คิด" ใน README)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ chooseThink คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 011 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTIONS = [
  "สวัสดีครับ",
  "ซื้อกาแฟ 3 แก้ว แก้วละ 65 บาท มีคูปองลด 10% แต่ลดได้ไม่เกิน 15 บาท ต้องจ่ายเท่าไร",
];

const apiKey = optionalEnv("OLLAMA_API_KEY");

function chooseThink(question: string): boolean | undefined {
  void question; // บรรทัดนี้กัน lint เตือนว่าตัวแปร question ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ question
  // 👉 คืน true เมื่อ question มีตัวเลข ไม่เช่นนั้น false (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ chooseThink ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (chooseThink("สวัสดี") === undefined) {
    console.log("👉 ยังไม่ได้เติม chooseThink (ดูบรรทัดที่มี 👉)");
    return;
  }

  for (const question of QUESTIONS) {
    const think = chooseThink(question);
    console.log(`คำถาม: ${question} → think: ${String(think)}`);
    const model = new ChatOllama({
      model: env("OLLAMA_MODEL"),
      baseUrl: env("OLLAMA_BASE_URL"),
      headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
      think,
    });
    const res = await model.invoke(question);
    console.log(`คำตอบ: ${res.text}`);
  }
}
