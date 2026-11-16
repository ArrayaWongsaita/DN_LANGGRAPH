// เฉลยแบบฝึกหัด 1: ตรวจ JSON ของคำสั่งซื้อด้วย zod
//
// โจทย์: เติม buildSchema() ให้คืน schema ของ OrderRequest โดย orderId ต้องตรง /^O\d{4}$/ และมี .describe
// ไฟล์ขอให้โมเดลแปลงข้อความลูกค้าเป็น OrderRequest แล้วตรวจด้วย schema ก่อนเอา orderId ไปถามสถานะ (ของลูกค้า C001 เท่านั้น)
// รัน: pnpm lesson 020 exercise-1.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
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
  // เฉลยจุดที่ 1: เขียน schema ให้ตรงกับ interface OrderRequest ทั้ง 3 field แล้วผูก type ไว้ด้วย z.ZodType<OrderRequest>
  // เพื่อให้ compiler เตือนทันทีถ้า schema กับ interface ไม่ตรงกัน (ลืม field หรือเปลี่ยนชื่อ)
  // action ใช้ z.enum ไม่ใช่ z.string(): ค่าที่ผ่าน zod จะถูกเอาไปใช้ต่อ คำตอบอย่าง "delete" จึงต้องไม่ผ่านตั้งแต่ต้นทาง
  // orderId ต้องมี .regex(/^O\d{4}$/): โมเดลชอบตอบเลขล้วน ("1002") แล้ว getOrder หาไม่เจอโดยไม่มีใครรู้สาเหตุ
  // reason เป็น .optional() ตาม interface: ข้อความที่ลูกค้าไม่ได้บอกเหตุผลต้องผ่านได้
  // .describe ยังไม่ถูกส่งให้โมเดลในบทนี้ (prompt เขียนรูปแบบ JSON เอง) แต่ทำให้อ่าน schema แล้วรู้ว่าช่องไหนคืออะไร
  return z.object({
    action: z.enum(["cancel", "refund", "status"]).describe("สิ่งที่ลูกค้าอยากให้ทำกับคำสั่งซื้อ"),
    orderId: z.string().regex(/^O\d{4}$/).describe("รหัสคำสั่งซื้อ รูปแบบ O ตามด้วยเลข 4 หลัก"),
    reason: z.string().optional().describe("เหตุผลที่ลูกค้าบอก ใส่เฉพาะเมื่อลูกค้าพูดถึง"),
  });
}

export async function main(): Promise<void> {
  const schema = buildSchema();
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
