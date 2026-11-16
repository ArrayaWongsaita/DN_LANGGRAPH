// แบบฝึกหัด 3 ⭐: อ่านชื่อโมเดลจากตัวโมเดล
//
// โจทย์: เติม modelName ให้คืนชื่อโมเดลที่ ChatGoogle ใช้ แล้วพิมพ์ 2 ส่วน
//   โมเดล: <ชื่อโมเดลตรงกับ GOOGLE_MODEL ใน .env>
//   คำตอบ: <คำตอบของโมเดล>
//
// แนวทาง:
// 1. ChatGoogle เก็บชื่อโมเดลไว้ในฟิลด์ model (m.model)
// 2. จุด 👉: คืน m.model
// 3. ตอนนี้ modelName คืน undefined เสมอ
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 007 exercise-3.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function modelName(m: ChatGoogle): string | undefined {
  void m; // บรรทัดนี้กัน lint เตือนว่าตัวแปร m ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ m
  // 👉 คืนชื่อโมเดลจาก m (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ modelName ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (modelName(model) === undefined) {
    console.log("👉 ยังไม่ได้เติม modelName (ดูบรรทัดที่มี 👉)");
    return;
  }

  console.log(`โมเดล: ${modelName(model)}`);
  const res = await model.invoke(QUESTION);
  console.log(`คำตอบ: ${res.text}`);
}
