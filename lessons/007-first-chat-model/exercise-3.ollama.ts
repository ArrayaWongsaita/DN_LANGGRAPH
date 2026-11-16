// แบบฝึกหัด 3 ⭐: อ่านชื่อโมเดลจากตัวโมเดล
//
// โจทย์: เติม modelName ให้คืนชื่อโมเดลที่ ChatOllama ใช้ แล้วพิมพ์ 2 ส่วน
//   โมเดล: <ชื่อโมเดลตรงกับ OLLAMA_MODEL ใน .env>
//   คำตอบ: <คำตอบของโมเดล>
//
// แนวทาง:
// 1. ChatOllama เก็บชื่อโมเดลไว้ในฟิลด์ model (m.model)
// 2. จุด 👉: คืน m.model
// 3. ตอนนี้ modelName คืน undefined เสมอ
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 007 exercise-3.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function modelName(m: ChatOllama): string | undefined {
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
