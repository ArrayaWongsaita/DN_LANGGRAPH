// แบบฝึกหัด 1: ตรวจ JSON ของคำสั่งซื้อด้วย zod
//
// โจทย์: เติม buildSchema() ให้คืน schema ของ OrderRequest โดย orderId ต้องตรง /^O\d{4}$/ และมี .describe
// ไฟล์ขอให้โมเดลแปลงข้อความลูกค้าเป็น OrderRequest แล้วตรวจด้วย schema ก่อนเอา orderId ไปถามสถานะ (ของลูกค้า C001 เท่านั้น)
//
// แนวทาง:
// 1. ห่อด้วย z.object({...}) โดย action เป็น z.enum(["cancel", "refund", "status"]) และ reason เป็น z.string().optional()
// 2. orderId ใช้ z.string().regex(/^O\d{4}$/) แล้วต่อ .describe(...) บอกว่าเป็นรหัสคำสั่งซื้อ รูปแบบ O ตามด้วยเลข 4 หลัก
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ buildSchema คืน z.custom<OrderRequest>() ที่ยอมทุกค่า (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 020 exercise-1.google
import { ChatGoogle } from "@langchain/google";
import * as z from "zod";
import { env } from "../../src/lib/env";
import { getOrder } from "../../src/shop/orders";
import { ORDER_STATUS_LABELS } from "../../src/shop/types";
import { oneLine } from "./search-filter";

z.config(z.locales.th());

interface OrderRequest {
  action: "cancel" | "refund" | "status";
  orderId: string;
  reason?: string;
}

const CUSTOMER_ID = "C001";
const QUESTIONS: readonly string[] = [
  "ขอยกเลิกคำสั่งซื้อ O1003 เพราะสั่งผิด",
  "คำสั่งซื้อ O1002 ถึงไหนแล้ว",
  "ขอคืนเงิน O1001 ของแตก",
];

const SYSTEM = [
  `คุณคือผู้ช่วยร้าน DN Shop ของลูกค้า ${CUSTOMER_ID}`,
  "แปลงข้อความของลูกค้าเป็น JSON ตามรูปแบบนี้เท่านั้น ห้ามมีข้อความอื่น",
  '{"action": "cancel" | "refund" | "status", "orderId": "O0000", "reason": "..."}',
  "action: cancel = ยกเลิก, refund = คืนเงิน, status = ถามสถานะ",
  "reason ใส่เฉพาะเมื่อลูกค้าบอกเหตุผล ไม่ใส่ field ที่ลูกค้าไม่ได้พูดถึง",
].join("\n");

// ตัวอย่างสำหรับตรวจ schema: ตัวแรกต้องผ่าน สองตัวหลังต้องไม่ผ่าน
const SAMPLES: readonly unknown[] = [
  { action: "cancel", orderId: "O1002" },
  { action: "delete", orderId: "O1002" },
  { action: "cancel", orderId: "1002" },
];

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function buildSchema(): z.ZodType<OrderRequest> {
  // 👉 คืน schema ของ OrderRequest: action เป็น enum, orderId ตรง /^O\d{4}$/ พร้อม .describe, reason ไม่บังคับ (แทนบรรทัด return ด้านล่าง)
  return z.custom<OrderRequest>();
}

export async function main(): Promise<void> {
  const schema = buildSchema();
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ schema ยังไม่ทำงาน (ไม่เสีย token)
  if (schema.safeParse({ action: "cancel", orderId: "1002" }).success) {
    console.log("👉 ยังไม่ได้เติม buildSchema (ดูบรรทัดที่มี 👉)");
    return;
  }

  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่า schema แยกตัวอย่างที่ถูกกับผิดได้จริง
  for (const sample of SAMPLES) {
    console.log(`ตรวจตัวอย่าง: ${JSON.stringify(sample)} → ${schema.safeParse(sample).success ? "ผ่าน" : "ไม่ผ่าน"}`);
  }

  let zodOk = 0;
  for (const [i, question] of QUESTIONS.entries()) {
    const res = await model.invoke([
      { role: "system", content: SYSTEM },
      { role: "user", content: question },
    ]);
    console.log(`--- คำถามที่ ${i + 1}: ${question} ---`);
    console.log(`คำตอบดิบ: ${oneLine(res.text, 200)}`);
    let value: unknown;
    try {
      value = JSON.parse(res.text);
    } catch {
      console.log("zod: ไม่ผ่าน JSON.parse ไม่ผ่าน");
      continue;
    }
    const result = schema.safeParse(value);
    if (!result.success) {
      console.log(`zod: ไม่ผ่าน ${z.prettifyError(result.error).split("\n")[0]}`);
      continue;
    }
    zodOk += 1;
    console.log(`zod: ผ่าน ${JSON.stringify(result.data)}`);
    // ใช้เฉพาะ orderId กับลูกค้าคนนี้เท่านั้น: คำสั่งซื้อของลูกค้าคนอื่นต้องดูเหมือนไม่มีอยู่จริง
    const order = getOrder(result.data.orderId, CUSTOMER_ID);
    console.log(`สถานะ: ${order === undefined ? `ไม่พบคำสั่งซื้อ ${result.data.orderId} ของลูกค้ารายนี้` : ORDER_STATUS_LABELS[order.status]}`);
  }
  console.log(`สรุป: zod ผ่าน ${zodOk}/${QUESTIONS.length}`);
}
