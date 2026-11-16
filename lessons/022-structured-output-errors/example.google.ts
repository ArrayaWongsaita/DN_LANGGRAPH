// บท 022 ⭐: เมื่อโมเดลตอบไม่ตรง schema — ตรวจ args ด้วย safeParse และอ่านคำตอบดิบด้วย includeRaw
// ขั้นที่ 1 ตรวจ args ปลอม 3 ก้อน (ไม่ยิงเน็ต) ขั้นที่ 2 แยกประเภทคำถามจริง 6 ข้อ แล้วเปิดสถานะคำสั่งซื้อของลูกค้าคนนี้
// รัน: pnpm lesson 022 example.google
import { ChatGoogle } from "@langchain/google";
import * as z from "zod";
import { env } from "../../src/lib/env";
import { getOrder } from "../../src/shop/orders";
import { ORDER_STATUS_LABELS } from "../../src/shop/types";
import { CLASSIFY_SYSTEM, CUSTOMER_ID, CustomerQuestion, MESSAGES, QUESTION_CATEGORIES, oneLine, rawSummary } from "./customer-question";

z.config(z.locales.th());

const TOOL = "classify_question";
const STEP1 = "--- ขั้นที่ 1: args ที่โมเดลอาจส่งมา (ข้อมูลปลอม) ---";
const STEP2 = "--- ขั้นที่ 2: แยกประเภทคำถามจริง 6 ข้อ (includeRaw) ---";

// args ปลอม 3 ก้อน: ถูกต้อง, enum ผิด และขาด field ที่บังคับ
const FAKE_ARGS: readonly unknown[] = [
  { category: "order", keywords: [], orderId: "O1002", urgent: true, summary: "ถามสถานะคำสั่งซื้อ" },
  { category: "shipping", keywords: [], urgent: false, summary: "ถามค่าส่ง" },
  { category: "product", keywords: ["แก้ว"], summary: "ถามเรื่องแก้ว" },
];

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log(STEP1);
  for (const [i, args] of FAKE_ARGS.entries()) {
    console.log(`args ที่ ${i + 1}: ${JSON.stringify(args)}`);
    const result = CustomerQuestion.safeParse(args);
    if (result.success) {
      console.log(`  ผ่าน → ประเภท ${result.data.category}`);
      continue;
    }
    console.log("  ไม่ผ่าน");
    for (const line of z.prettifyError(result.error).split("\n")) console.log(`  ${line}`);
  }

  // ขั้นที่ 2: includeRaw คืน { raw, parsed } และไม่ throw — parsed เป็น null/undefined เมื่อแปลงไม่ผ่าน
  console.log(STEP2);
  // ChatGoogle ใช้ method ค่าเริ่มต้น (functionCalling ที่บังคับเรียกเครื่องมือ) จึงส่งแค่ชื่อ
  const chain = model.withStructuredOutput(CustomerQuestion, { name: TOOL, includeRaw: true });
  const counts: Record<string, number> = { product: 0, order: 0, policy: 0, other: 0 };
  let ok = 0;
  for (const [i, message] of MESSAGES.entries()) {
    // เรียกทีละข้อ ไม่ใช้ .batch: withFallbacks ของ includeRaw ทำงานทั้ง batch ถ้ามีข้อเดียวแปลงไม่ผ่าน ทุกข้อจะได้ parsed = null
    const { raw, parsed } = await chain.invoke([
      { role: "system", content: CLASSIFY_SYSTEM },
      { role: "user", content: message },
    ]);
    // parsed เป็น null ได้แม้ type บอกว่าไม่เป็น จึงต้องตรวจ == null ทุกครั้ง
    if (parsed == null) {
      console.log(`ข้อ ${i + 1}: แปลงไม่สำเร็จ`);
      console.log(`  คำตอบดิบ: ${rawSummary(raw)}`);
      continue;
    }
    ok += 1;
    counts[parsed.category] += 1;
    console.log(`ข้อ ${i + 1}: ${parsed.category} | orderId: ${parsed.orderId ?? "-"} | ด่วน: ${parsed.urgent ? "ใช่" : "ไม่"} | ${oneLine(parsed.summary, 60)}`);
    if (parsed.category === "order" && parsed.orderId !== undefined) {
      // รหัสลูกค้ามาจากระบบ (C001) ไม่ได้มาจากโมเดล: getOrder ตอบเหมือนกันทั้ง "ไม่มีคำสั่งซื้อ" และ "ของคนอื่น"
      const order = getOrder(parsed.orderId, CUSTOMER_ID);
      console.log(
        order === undefined
          ? `  ไม่พบคำสั่งซื้อ ${parsed.orderId} ของลูกค้ารายนี้`
          : `  สถานะคำสั่งซื้อ ${order.id}: ${ORDER_STATUS_LABELS[order.status]}`,
      );
    }
  }
  console.log(`แปลงสำเร็จ: ${ok}/${MESSAGES.length}`);
  console.log(`นับตามประเภท: ${QUESTION_CATEGORIES.map((category) => `${category} ${counts[category]}`).join(" · ")}`);
}
