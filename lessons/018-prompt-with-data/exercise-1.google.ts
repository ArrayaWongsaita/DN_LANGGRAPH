// แบบฝึกหัด 1: บรรทัดสินค้าที่มีสต็อกด้วย
//
// โจทย์: เติม detailLine(p) ให้คืนข้อความ 1 บรรทัดที่มีรหัส ชื่อ ราคา และสต็อกของสินค้า ถ้าสต็อกเป็น 0 ให้เขียนว่า หมด
// ถ้ามีของให้เขียนว่า เหลือ N ชิ้น (N คือสต็อก) ไฟล์จะส่งสินค้าทุกชิ้นด้วย detailLine แล้วถามโมเดล 2 คำถามเรื่องของที่เหลือ
//
// แนวทาง:
// 1. เริ่มจากตัวอย่าง productLine ใน example.google.ts (รหัส ชื่อ ราคา) แล้วต่อส่วนสต็อกท้ายบรรทัด
// 2. ฟิลด์สต็อกของสินค้าชื่อ stock (ดู src/shop/types.ts) สต็อก 0 กับสต็อกที่มากกว่า 0 ใช้ข้อความต่างกัน
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ detailLine คืนข้อความว่างเสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 018 exercise-1.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";
import { getProduct, listProducts } from "../../src/shop/products";
import type { Product } from "../../src/shop/types";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ตอบจากข้อมูลสินค้าที่ให้เท่านั้น ถ้าไม่มีในข้อมูลให้ตอบว่า ไม่มีข้อมูล ตอบภาษาไทยสั้นๆ";
const QUESTIONS = ["เครื่องบดกาแฟไฟฟ้ายังมีของไหม", "แก้วมัคสแตนเลสเก็บความเย็นเหลือกี่ใบ"];

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function detailLine(p: Product): string {
  void p; // บรรทัดนี้กัน lint เตือนว่าตัวแปร p ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ p
  // 👉 คืนบรรทัดที่มี รหัส ชื่อ ราคา และสต็อก (หมด หรือ เหลือ N ชิ้น) (แทนบรรทัด return "")
  return "";
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ detailLine ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const outOfStock = getProduct("P012");
  const inStock = getProduct("P018");
  if (outOfStock === undefined || inStock === undefined) throw new Error("ไม่พบสินค้าตัวอย่าง P012 หรือ P018 ใน src/shop");
  if (detailLine(outOfStock) === "") {
    console.log("👉 ยังไม่ได้เติม detailLine (ดูบรรทัดที่มี 👉)");
    return;
  }

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
