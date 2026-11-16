// บท 018: ใส่ข้อมูลสินค้าลงใน prompt ด้วย template string แล้วดูว่าข้อมูลยิ่งมากยิ่งเปลือง token
// ขั้นที่ 1 สร้างข้อความจากข้อมูลและจำลองการตัดข้อความต้นๆ เมื่อ context เต็ม (ไม่ยิงเน็ต) ขั้นที่ 2 ถามราคาโดยใส่ข้อมูล 3 แบบ
// รัน: pnpm lesson 018 example.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";
import { listProducts, searchProducts } from "../../src/shop/products";
import type { Product } from "../../src/shop/types";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ตอบจากข้อมูลสินค้าที่ให้เท่านั้น ถ้าไม่มีในข้อมูลให้ตอบว่า ไม่มีข้อมูล ตอบภาษาไทยสั้นๆ";
const QUESTION = "เมล็ดกาแฟดอยช้างราคาเท่าไร";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

// สินค้า 1 ชิ้น เป็นข้อความ 1 บรรทัด: ค่าจริงมาจากข้อมูลร้าน ไม่พิมพ์ตัวเลขเอง
function productLine(p: Product): string {
  return `${p.id} ${p.name} ราคา ${p.price} บาท`;
}

function catalogText(ps: Product[]): string {
  return ps.map(productLine).join("\n");
}

// จำลอง context ที่เต็มแล้ว: เก็บไว้แค่ n บรรทัดท้าย ข้อความต้นๆ ถูกตัดทิ้งเงียบๆ (ภาพประกอบ ไม่ใช่วิธีตัดของโปรแกรมจริง)
function keepLast(lines: string[], n: number): string[] {
  return lines.slice(-n);
}

// ถามด้วย system ที่ส่งเข้ามา แล้วพิมพ์จำนวน token ขาเข้าและคำตอบ
async function askWith(system: string): Promise<void> {
  const res = await model.invoke([
    { role: "system", content: system },
    { role: "user", content: QUESTION },
  ]);
  console.log(`ขาเข้า: ${res.usage_metadata?.input_tokens ?? 0} token`);
  console.log(`คำตอบ: ${res.text}`);
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: ใส่ข้อมูลสินค้าด้วย template string ---");
  const all = listProducts();
  const found = searchProducts({ keyword: "ดอยช้าง" });
  for (const p of all.slice(0, 3)) console.log(productLine(p));
  console.log(`... (อีก ${all.length - 3} บรรทัด)`);
  console.log(`ทุกชิ้น: ${all.length} บรรทัด ยาว ${[...catalogText(all)].length} ตัวอักษร`);
  console.log(`เฉพาะที่ค้นด้วย "ดอยช้าง": ${found.length} บรรทัด ยาว ${[...catalogText(found)].length} ตัวอักษร`);

  console.log("--- จำลอง context เต็ม: เก็บได้แค่ 10 บรรทัดท้าย ---");
  // ข้อความที่ส่งทั้งหมด: system 1 บรรทัด + สินค้าทุกชิ้น + คำถาม 1 บรรทัด
  const context = [SYSTEM, ...all.map(productLine), QUESTION];
  const kept = keepLast(context, 10);
  console.log(`ข้อความทั้งหมด ${context.length} บรรทัด เหลือ ${kept.length} บรรทัด`);
  console.log(`บรรทัดแรกที่เหลือ: ${kept[0]}`);
  console.log(`system prompt ยังอยู่ไหม: ${kept.includes(SYSTEM) ? "อยู่" : "ไม่อยู่"}`);
  console.log(`ข้อมูล P001 ยังอยู่ไหม: ${kept.some((line) => line.startsWith("P001 ")) ? "อยู่" : "ไม่อยู่"}`);

  // ขั้นที่ 2: ถามโมเดลจริง คำถามเดิม ใส่ข้อมูลต่างกัน 3 แบบ
  console.log("--- ขั้นที่ 2: ถามราคาโดยใส่ข้อมูล 3 แบบ ---");
  console.log("--- แบบที่ 1: ไม่ใส่ข้อมูล ---");
  await askWith(SYSTEM);
  console.log("--- แบบที่ 2: ใส่สินค้าทุกชิ้น ---");
  await askWith(`${SYSTEM}\n\nข้อมูลสินค้า:\n${catalogText(all)}`);
  console.log("--- แบบที่ 3: ใส่เฉพาะสินค้าที่ค้นเจอ ---");
  await askWith(`${SYSTEM}\n\nข้อมูลสินค้า:\n${catalogText(found)}`);
}
