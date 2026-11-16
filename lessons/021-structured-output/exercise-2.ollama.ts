// แบบฝึกหัด 2: ตะกร้าสินค้าที่ตรวจจำนวนด้วย zod
//
// โจทย์: เติม cartSchema() ให้ items/productId/quantity มี .describe และ quantity เป็นจำนวนเต็มอย่างน้อย 1 (.int().min(1))
// ไฟล์ขอให้โมเดลแปลงข้อความสั่งซื้อเป็นตะกร้าผ่านเครื่องมือ build_cart แล้วพิมพ์ราคารวมจากข้อมูลสินค้าจริง
//
// แนวทาง:
// 1. เริ่มจาก schema เดิมใน return แล้วต่อ .describe("…") ให้ items, productId และ quantity
// 2. quantity ต่อ .int().min(1) — จำนวน 0 หรือ 1.5 ต้องไม่ผ่าน (ดูบรรทัด ตรวจตัวอย่าง)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ cartSchema คืน schema ที่ quantity เป็น z.number() ธรรมดา (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 021 exercise-2.ollama
import { OutputParserException } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import * as z from "zod";
import { env, optionalEnv } from "../../src/lib/env";
import { getProduct } from "../../src/shop/products";
import { catalogLines, oneLine } from "./search-filter";

const TOOL = "build_cart";
const QUESTION = "ขอกาแฟดริปซองคั่วกลาง 2 กล่อง กับกระดาษกรองกาแฟ 1 แพ็ค";
const SYSTEM = [
  "คุณคือผู้ช่วยร้าน DN Shop แปลงข้อความสั่งซื้อของลูกค้าเป็นรายการสินค้าในตะกร้า",
  "ใส่รหัสสินค้าที่มีจริงจากข้อมูลด้านล่าง และจำนวนเป็นจำนวนเต็มตั้งแต่ 1",
  "ตอบภาษาไทย",
  `ตอบโดยเรียกเครื่องมือ ${TOOL} เท่านั้น`,
  "ข้อมูลสินค้า:",
  ...catalogLines(),
].join("\n");

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function cartSchema() {
  // 👉 เติม .describe ให้ items, productId, quantity และให้ quantity เป็น .int().min(1) (แทนบรรทัด return ด้านล่าง)
  return z.object({ items: z.array(z.object({ productId: z.string(), quantity: z.number() })) });
}

type Cart = z.infer<ReturnType<typeof cartSchema>>;

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ cartSchema ยังไม่ตรวจจำนวน (ไม่เสีย token)
  if (cartSchema().safeParse({ items: [{ productId: "P001", quantity: 0 }] }).success) {
    console.log("👉 ยังไม่ได้เติม cartSchema (ดูบรรทัดที่มี 👉)");
    return;
  }

  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่า schema ตรวจจำนวนกับคำอธิบายครบ
  console.log(`ตรวจตัวอย่าง: quantity 0 → ${cartSchema().safeParse({ items: [{ productId: "P001", quantity: 0 }] }).success ? "ผ่าน" : "ไม่ผ่าน"}`);
  console.log(`ตรวจตัวอย่าง: quantity 1.5 → ${cartSchema().safeParse({ items: [{ productId: "P001", quantity: 1.5 }] }).success ? "ผ่าน" : "ไม่ผ่าน"}`);
  const descriptionCount = (JSON.stringify(z.toJSONSchema(cartSchema())).match(/"description"/g) ?? []).length;
  console.log(`ตรวจตัวอย่าง: คำอธิบายใน schema ${descriptionCount} จุด`);

  const chain = model.withStructuredOutput(cartSchema(), { name: TOOL, method: "functionCalling" });
  let cart: Cart | undefined;
  try {
    cart = await chain.invoke([
      { role: "system", content: SYSTEM },
      { role: "user", content: QUESTION },
    ]);
  } catch (e) {
    if (e instanceof OutputParserException) {
      console.log(`แปลงไม่สำเร็จ: args ไม่ตรง schema → ${oneLine(e.llmOutput ?? e.message, 120)}`);
      return;
    }
    throw e;
  }
  if (cart === undefined) {
    console.log("แปลงไม่สำเร็จ: โมเดลไม่ได้เรียกเครื่องมือ");
    return;
  }

  let total = 0;
  for (const item of cart.items) {
    const product = getProduct(item.productId);
    if (product === undefined) {
      console.log(`- ${item.productId} ไม่พบสินค้า`);
      continue;
    }
    const sum = product.price * item.quantity;
    total += sum;
    console.log(`- ${product.id} ${product.name} × ${item.quantity} = ${sum} บาท`);
  }
  console.log(`ตะกร้า: ${cart.items.length} รายการ รวม ${total} บาท`);
}
