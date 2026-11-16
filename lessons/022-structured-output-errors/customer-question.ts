// คำถามของลูกค้าที่แยกประเภทแล้ว ใช้ร่วมทั้งบท: schema ของ zod, ข้อความตัวอย่าง, system prompt
// และตัวช่วยอ่านคำตอบดิบของโมเดลให้เหลือบรรทัดเดียว
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import * as z from "zod";

export const QUESTION_CATEGORIES = ["product", "order", "policy", "other"] as const;

// withStructuredOutput แปลง schema นี้เป็นเครื่องมือ classify_question
// orderId ใช้ .optional() ตามผลทดลอง: โมเดลไม่ส่ง null ใน field ที่ไม่บังคับ (ถ้าเจอ null บ่อยให้เปลี่ยนเป็น .nullish())
export const CustomerQuestion = z
  .object({
    category: z
      .enum(QUESTION_CATEGORIES)
      .describe(
        "product = ถามเรื่องสินค้าก่อนซื้อ, order = ถามถึงคำสั่งซื้อที่สั่งแล้ว, policy = กฎของร้าน เช่น ค่าส่ง การคืนสินค้า, other = เรื่องอื่น",
      ),
    keywords: z
      .array(z.string())
      .describe(
        "คำที่ลูกค้าพูดถึงและใช้ค้นสินค้าได้ เก็บคำที่เฉพาะเจาะจง เช่น ชนิดสินค้า รส ระดับการคั่ว ให้ครบทุกคำ (คำถามที่ไม่เกี่ยวกับสินค้าใส่ [] ได้)",
      ),
    orderId: z
      .string()
      .regex(/^O\d{4}$/)
      .optional()
      .describe("รหัสคำสั่งซื้อที่ลูกค้าพิมพ์มา รูปแบบ O ตามด้วยเลข 4 หลัก ใส่เฉพาะเมื่อข้อความลูกค้ามีรหัสนี้"),
    urgent: z.boolean().describe("true เมื่อลูกค้าเร่งด่วนหรือไม่พอใจ เช่น พูดว่า รอนานมาก ด่วน อยากได้แล้ว"),
    summary: z.string().describe("สรุปคำถามสั้นๆ ภาษาไทย 1 ประโยค"),
  })
  .describe("คำถามของลูกค้าร้าน DN Shop ที่แยกประเภทแล้ว");

export type CustomerQuestion = z.infer<typeof CustomerQuestion>;

export const CLASSIFY_SYSTEM = "จัดประเภทคำถามของลูกค้าร้าน DN Shop แล้วตอบโดยเรียกเครื่องมือ classify_question เท่านั้น";

export const MESSAGES: readonly string[] = [
  "มีเมล็ดกาแฟคั่วอ่อนไหม",
  "คำสั่งซื้อ O1002 ถึงไหนแล้ว รอนานมาก",
  "ส่งของต่างจังหวัดกี่วันถึง",
  "ขอยกเลิกคำสั่งซื้อ O1003",
  "แนะนำร้านอาหารแถวสยามหน่อย",
  "แก้วมัคเก็บความเย็นราคาเท่าไร",
];

// ระบบจริงได้ CUSTOMER_ID จากการ login ห้ามให้โมเดลบอก: ถ้าโมเดลเลือกเจ้าของคำสั่งซื้อเองได้ มันจะขอดูของคนอื่นได้
export const CUSTOMER_ID = "C001";

// ผลที่พิมพ์ต้องบรรทัดเดียว: ยุบช่องว่างทุกชนิดเป็นช่องว่างเดียว แล้วตัดให้ไม่เกิน max ตัวอักษร (ตัดแล้วลงท้ายด้วย …)
export function oneLine(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const chars = [...flat];
  return chars.length <= max ? flat : `${chars.slice(0, max - 1).join("")}…`;
}

// คำตอบดิบที่โมเดลส่งมา: ถ้าเป็น AIMessage ที่มี tool call ให้ดู args ตัวแรก ถ้าไม่มีให้ดูข้อความ
// ใช้ได้ทั้งกรณีargs ไม่ผ่านและกรณีที่โมเดลตอบเป็นข้อความ ไม่ต้องเดา
export function rawSummary(raw: BaseMessage): string {
  const call = AIMessage.isInstance(raw) ? raw.tool_calls?.[0] : undefined;
  return oneLine(call === undefined ? raw.text : JSON.stringify(call.args), 120);
}
