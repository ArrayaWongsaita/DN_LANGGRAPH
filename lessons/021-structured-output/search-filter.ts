// ตัวกรองค้นสินค้าที่ใช้ร่วมกันทั้งบท: schema ของ zod, คำถามตัวอย่าง และบรรทัดข้อมูลสินค้าให้โมเดลเห็น
import * as z from "zod";
import { CATEGORIES, CATEGORY_LABELS } from "../../src/shop/types";
import { listProducts } from "../../src/shop/products";

// withStructuredOutput แปลง schema นี้เป็น JSON Schema ให้โมเดลกรอก (ขั้นที่ 1 พิมพ์ออกมาดู)
// ยังใช้ .optional() ตามผลทดลอง: โมเดลไม่ส่ง null ใน field ที่ไม่บังคับ (ถ้าเจอ null บ่อยให้เปลี่ยนเป็น .nullish())
export const SearchFilter = z
  .object({
    keyword: z.string().optional().describe("คำที่ใช้ค้นในชื่อสินค้า แท็ก หรือหมวดหมู่"),
    category: z.enum(CATEGORIES).optional().describe("หมวดหมู่สินค้า เลือกจากค่าที่กำหนดเท่านั้น"),
    maxPrice: z.number().optional().describe("ราคาสูงสุดที่ลูกค้ายอมจ่าย หน่วยเป็นบาท"),
  })
  .describe("ตัวกรองสำหรับค้นสินค้าในร้าน DN Shop");

export type SearchFilter = z.infer<typeof SearchFilter>;

export const QUESTIONS: readonly string[] = [
  "อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท",
  "มีแก้วกาแฟอะไรบ้าง",
  "ของขวัญให้แฟนที่ชอบกาแฟ ราคาไม่เกิน 800",
];

export const CATEGORY_GUIDE = CATEGORIES.map((c) => `${c} = ${CATEGORY_LABELS[c]}`).join(", ");

// ข้อมูลสินค้าทุกชิ้น บรรทัดละชิ้น ใส่ใน system ของแบบฝึกหัดให้โมเดลเลือกรหัสที่มีจริง
export function catalogLines(): string[] {
  return listProducts().map((p) => `${p.id} ${p.name} ราคา ${p.price} บาท สต็อก ${p.stock}`);
}

// ผลที่พิมพ์ต้องบรรทัดเดียว: ยุบช่องว่างทุกชนิดเป็นช่องว่างเดียว แล้วตัดให้ไม่เกิน max ตัวอักษร (ตัดแล้วลงท้ายด้วย …)
export function oneLine(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const chars = [...flat];
  return chars.length <= max ? flat : `${chars.slice(0, max - 1).join("")}…`;
}
