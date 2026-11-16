// เฉลยแบบฝึกหัด 1: บรรทัดสินค้าที่มีสต็อกด้วย
//
// โจทย์: เติม detailLine(p) ให้คืนข้อความ 1 บรรทัดที่มีรหัส ชื่อ ราคา และสต็อกของสินค้า ถ้าสต็อกเป็น 0 ให้เขียนว่า หมด
// ถ้ามีของให้เขียนว่า เหลือ N ชิ้น (N คือสต็อก) ไฟล์จะส่งสินค้าทุกชิ้นด้วย detailLine แล้วถามโมเดล 2 คำถามเรื่องของที่เหลือ
// รัน: pnpm lesson 018 exercise-1.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";
import { getProduct, listProducts } from "../../src/shop/products";
import type { Product } from "../../src/shop/types";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ตอบจากข้อมูลสินค้าที่ให้เท่านั้น ถ้าไม่มีในข้อมูลให้ตอบว่า ไม่มีข้อมูล ตอบภาษาไทยสั้นๆ";
const QUESTIONS = ["เครื่องบดกาแฟไฟฟ้ายังมีของไหม", "แก้วมัคสแตนเลสเก็บความเย็นเหลือกี่ใบ"];

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function detailLine(p: Product): string {
  // เฉลยจุดที่ 1: เริ่มจากรูปแบบของ productLine (รหัส ชื่อ ราคา) แล้วต่อด้วยส่วนสต็อกท้ายบรรทัด
  // ใช้ p.stock <= 0 เพื่อให้สต็อกติดลบ (ซึ่งไม่ควรเกิด แต่คืนสต็อกผิดพลาดได้) ยังขึ้นว่า หมด ไม่ใช่ เหลือ -1 ชิ้น
  const stock = p.stock <= 0 ? "หมด" : `เหลือ ${p.stock} ชิ้น`;
  return `${p.id} ${p.name} ราคา ${p.price} บาท ${stock}`;
}

export async function main(): Promise<void> {
  const outOfStock = getProduct("P012");
  const inStock = getProduct("P018");
  if (outOfStock === undefined || inStock === undefined) throw new Error("ไม่พบสินค้าตัวอย่าง P012 หรือ P018 ใน src/shop");

  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่า detailLine แยกกรณีสต็อกหมดกับมีของได้จริง
  console.log(`ตรวจตัวอย่าง: ${detailLine(outOfStock)}`);
  console.log(`ตรวจตัวอย่าง: ${detailLine(inStock)}`);
  const system = `${SYSTEM}\n\nข้อมูลสินค้า:\n${listProducts().map(detailLine).join("\n")}`;
  for (const [i, question] of QUESTIONS.entries()) {
    const res = await model.invoke([
      { role: "system", content: system },
      { role: "user", content: question },
    ]);
    console.log(`--- คำถามที่ ${i + 1} ---`);
    console.log(res.text);
  }
}
