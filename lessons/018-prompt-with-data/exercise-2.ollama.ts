// เฉลยแบบฝึกหัด 2: เก็บข้อมูลให้พอดีงบตัวอักษร
//
// โจทย์: เติม fitBudget(lines, maxChars) ให้เก็บบรรทัดจากต้นอาร์เรย์ไปเรื่อยๆ ตราบที่ข้อความรวม (ต่อบรรทัดด้วย \n)
// ยาวไม่เกิน maxChars ตัวอักษร พอบรรทัดถัดไปทำให้เกินงบก็หยุด แล้วคืนบรรทัดที่เก็บไว้
// ไฟล์ใช้งบ 300 ตัวอักษรกับบรรทัดสินค้าทุกชิ้น แล้วถามโมเดล 2 คำถาม (ข้อ 2 ถามสินค้าที่ถูกตัดทิ้ง)
// รัน: pnpm lesson 018 exercise-2.ollama
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
  // เฉลยจุดที่ 1: วัดความยาวของข้อความที่จะส่งจริง คือบรรทัดที่เก็บไว้ต่อกันด้วย \n (ตัวคั่นนับด้วย)
  // จึงลองต่อบรรทัดถัดไปก่อน แล้วค่อยตัดสินใจ ถ้าเกินงบก็หยุดทันที ไม่ข้ามไปเก็บบรรทัดที่สั้นกว่าข้างหลัง
  // เพราะข้อมูลสินค้าที่ขาดกลางรายการอ่านแล้วสับสนกว่าการมีรายการสั้นลง
  const kept: string[] = [];
  for (const line of lines) {
    if ([...[...kept, line].join("\n")].length > maxChars) break;
    kept.push(line);
  }
  return kept;
}

export async function main(): Promise<void> {
  // บรรทัดที่พิมพ์นี้ใช้ตรวจ fitBudget กับตัวอย่างเล็กๆ ที่รู้คำตอบอยู่แล้ว ("กขค" ยาว 3 ผ่าน "งจฉ" ต่อท้ายเป็น 7 เกิน 4)
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
