// ตัวกรองค้นสินค้าที่ใช้ร่วมกันทั้งบท: schema ของ zod, คำถามตัวอย่าง และตัวช่วยอ่าน JSON จากคำตอบโมเดล
import * as z from "zod";
import { CATEGORIES, CATEGORY_LABELS } from "../../src/shop/types";

export const SearchFilter = z
  .object({
    keyword: z.string().optional().describe("คำที่ใช้ค้นในชื่อสินค้า แท็ก หรือหมวดหมู่"),
    category: z.enum(CATEGORIES).optional().describe("หมวดหมู่สินค้า เลือกจากค่าที่กำหนดเท่านั้น"),
    maxPrice: z.number().optional().describe("ราคาสูงสุดที่ลูกค้ายอมจ่าย หน่วยเป็นบาท"),
  })
  .describe("ตัวกรองสำหรับค้นสินค้าในร้าน DN Shop");

// ผลของ schema ส่งให้ searchProducts ได้ตรงๆ (field ที่ไม่มีถือว่าไม่กรอง)
export type SearchFilter = z.infer<typeof SearchFilter>;

export const QUESTIONS: readonly string[] = [
  "อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท",
  "มีแก้วกาแฟอะไรบ้าง",
  "ของขวัญให้แฟนที่ชอบกาแฟ ราคาไม่เกิน 800",
];

// ค่าที่ category รับ พร้อมคำอธิบายไทย ใช้ต่อท้าย prompt ให้โมเดลเลือกค่าถูก
export const CATEGORY_GUIDE = CATEGORIES.map((c) => `${c} = ${CATEGORY_LABELS[c]}`).join(", ");

// โมเดลบางตัวห่อ JSON ด้วย ```json หรือมีข้อความนำ: เอาเฉพาะตั้งแต่ { ตัวแรกถึง } ตัวสุดท้าย
// ไม่เจอวงเล็บเลยคืนข้อความเดิม (JSON.parse จะไม่ผ่านอีกครั้ง)
export function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

// ผลที่พิมพ์ต้องบรรทัดเดียว: ยุบช่องว่างทุกชนิดเป็นช่องว่างเดียว แล้วตัดให้ไม่เกิน max ตัวอักษร (ตัดแล้วลงท้ายด้วย …)
export function oneLine(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const chars = [...flat];
  return chars.length <= max ? flat : `${chars.slice(0, max - 1).join("")}…`;
}
