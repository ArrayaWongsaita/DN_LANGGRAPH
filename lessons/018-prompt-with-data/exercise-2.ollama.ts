// แบบฝึกหัด 2: เก็บข้อมูลให้พอดีงบตัวอักษร
//
// โจทย์: เติม fitBudget(lines, maxChars) ให้เก็บบรรทัดจากต้นอาร์เรย์ไปเรื่อยๆ ตราบที่ข้อความรวม (ต่อบรรทัดด้วย \n)
// ยาวไม่เกิน maxChars ตัวอักษร พอบรรทัดถัดไปทำให้เกินงบก็หยุด แล้วคืนบรรทัดที่เก็บไว้
// ไฟล์ใช้งบ 300 ตัวอักษรกับบรรทัดสินค้าทุกชิ้น แล้วถามโมเดล 2 คำถาม (ข้อ 2 ถามสินค้าที่ถูกตัดทิ้ง)
//
// แนวทาง:
// 1. วัดความยาวด้วย [...ข้อความ].length เหมือนตัวอย่างที่ผ่านมา (นับทีละตัวอักษร)
// 2. ลองคิดกับตัวอย่างในไฟล์: บรรทัด "กขค" กับ "งจฉ" งบ 4 ได้กี่บรรทัด (ต่อกันด้วย \n แล้วยาวเท่าไร)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ fitBudget คืนบรรทัดทั้งหมดที่รับมาเสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 018 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";
import { listProducts } from "../../src/shop/products";
import type { Product } from "../../src/shop/types";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ตอบจากข้อมูลสินค้าที่ให้เท่านั้น ถ้าไม่มีในข้อมูลให้ตอบว่า ไม่มีข้อมูล ตอบภาษาไทยสั้นๆ";
const QUESTIONS = ["เมล็ดกาแฟดอยช้างราคาเท่าไร", "ผ้ากันเปื้อนบาริสต้าราคาเท่าไร"];
const BUDGET = 300;

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function productLine(p: Product): string {
  return `${p.id} ${p.name} ราคา ${p.price} บาท`;
}

function fitBudget(lines: string[], maxChars: number): string[] {
  void maxChars; // บรรทัดนี้กัน lint เตือนว่าตัวแปร maxChars ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ maxChars
  // 👉 เก็บบรรทัดจากต้นไปเรื่อยๆ ตราบที่ข้อความรวมยาวไม่เกิน maxChars (แทนบรรทัด return lines)
  return lines;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ fitBudget ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (fitBudget(["กขค", "งจฉ"], 4).length !== 1) {
    console.log("👉 ยังไม่ได้เติม fitBudget (ดูบรรทัดที่มี 👉)");
    return;
  }

  // บรรทัดที่พิมพ์นี้ใช้ตรวจ fitBudget กับตัวอย่างเล็กๆ ที่รู้คำตอบอยู่แล้ว
  console.log(`ตรวจตัวอย่าง: งบ 4 ตัวอักษร ได้ ${fitBudget(["กขค", "งจฉ"], 4).length} บรรทัด`);
  const lines = listProducts().map(productLine);
  const kept = fitBudget(lines, BUDGET);
  console.log(`ส่งข้อมูล ${kept.length} จาก ${lines.length} บรรทัด (${[...kept.join("\n")].length} ตัวอักษร)`);
  const system = `${SYSTEM}\n\nข้อมูลสินค้า:\n${kept.join("\n")}`;
  for (const [i, question] of QUESTIONS.entries()) {
    const res = await model.invoke([
      { role: "system", content: system },
      { role: "user", content: question },
    ]);
    console.log(`--- คำถามที่ ${i + 1} ---`);
    console.log(res.text);
  }
}
