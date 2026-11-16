// เฉลยแบบฝึกหัด 2: ตะกร้าสินค้าที่ตรวจจำนวนด้วย zod
//
// โจทย์: เติม cartSchema() ให้ items/productId/quantity มี .describe และ quantity เป็นจำนวนเต็มอย่างน้อย 1 (.int().min(1))
// ไฟล์ขอให้โมเดลแปลงข้อความสั่งซื้อเป็นตะกร้าผ่านเครื่องมือ build_cart แล้วพิมพ์ราคารวมจากข้อมูลสินค้าจริง
// รัน: pnpm lesson 021 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { OutputParserException } from "@langchain/core/output_parsers";
import { ChatGoogle } from "@langchain/google";
import * as z from "zod";
import { env } from "../../src/lib/env";
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

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function cartSchema() {
  // เฉลยจุดที่ 1: ใส่ .describe ทุก field ที่โมเดลต้องกรอก เพราะ withStructuredOutput ส่งคำอธิบายนี้ไปกับ JSON Schema ของเครื่องมือ
  // items: บอกขอบเขตของรายการ (อย่างน้อย 1 รายการ) ให้โมเดลไม่ตอบตะกร้าว่าง
  // productId: บอกว่ารหัสต้องมีจริงในร้านและมีรูปแบบ P000 คู่กับรายการสินค้าใน system
  // quantity: .int().min(1) กัน 0 กับ 1.5 ที่โมเดลชอบตอบเมื่ออ่านคำว่า "1 แพ็ค" หรือครึ่งหน่วย
  // .refine ไม่ถูกส่งไปกับ JSON Schema จึงต้องใช้ .describe บอกสิ่งที่อยากให้โมเดลรู้
  return z.object({
    items: z
      .array(
        z.object({
          productId: z.string().describe("รหัสสินค้าที่มีจริงในร้าน รูปแบบ P000"),
          quantity: z.number().int().min(1).describe("จำนวนที่สั่ง เป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป"),
        }),
      )
      .describe("รายการสินค้าในตะกร้า อย่างน้อย 1 รายการ"),
  });
}

type Cart = z.infer<ReturnType<typeof cartSchema>>;

export async function main(): Promise<void> {
  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่า schema ตรวจจำนวนกับคำอธิบายครบ
  console.log(`ตรวจตัวอย่าง: quantity 0 → ${cartSchema().safeParse({ items: [{ productId: "P001", quantity: 0 }] }).success ? "ผ่าน" : "ไม่ผ่าน"}`);
  console.log(`ตรวจตัวอย่าง: quantity 1.5 → ${cartSchema().safeParse({ items: [{ productId: "P001", quantity: 1.5 }] }).success ? "ผ่าน" : "ไม่ผ่าน"}`);
  const descriptionCount = (JSON.stringify(z.toJSONSchema(cartSchema())).match(/"description"/g) ?? []).length;
  console.log(`ตรวจตัวอย่าง: คำอธิบายใน schema ${descriptionCount} จุด`);

  // ChatGoogle ใช้ method ค่าเริ่มต้น (functionCalling ที่บังคับเรียกเครื่องมือ) จึงส่งแค่ชื่อ
  const chain = model.withStructuredOutput(cartSchema(), { name: TOOL });
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
