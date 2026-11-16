// เฉลยแบบฝึกหัด 1: บังคับให้รหัสสินค้ามีจริงด้วย .refine
//
// โจทย์: เติม productIdField() ให้คืน z.string() ที่ .refine ว่า getProduct(id) มีสินค้าอยู่จริง (ข้อความ "ไม่มีสินค้ารหัสนี้ในร้าน")
// ไฟล์ขอให้โมเดลแนะนำสินค้า 1 ชิ้นผ่านเครื่องมือ recommend_product โดยเห็นข้อมูลสินค้าทุกชิ้นใน system
// รัน: pnpm lesson 021 exercise-1.ollama
import { OutputParserException } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import * as z from "zod";
import { env, optionalEnv } from "../../src/lib/env";
import { getProduct } from "../../src/shop/products";
import { catalogLines, oneLine } from "./search-filter";

const TOOL = "recommend_product";
const QUESTION = "แนะนำสินค้า 1 ชิ้นสำหรับคนเพิ่งเริ่มชงกาแฟดริปที่บ้าน งบไม่เกิน 500 บาท";
const SYSTEM = [
  "คุณคือผู้ช่วยร้าน DN Shop แนะนำสินค้าให้ลูกค้าจากข้อมูลสินค้าด้านล่างเท่านั้น",
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

function productIdField(): z.ZodString {
  // เฉลยจุดที่ 1: ตรวจรหัสกับข้อมูลสินค้าจริงของร้านด้วย getProduct ไม่ใช่ดูแค่รูปแบบ
  // ทำไมไม่ใช้ regex: "P999" รูปแบบถูกทุกตัวอักษรแต่ไม่มีสินค้านี้ในร้าน .refine ที่เรียก getProduct จึงจับได้
  // .refine ทำงานตอน LangChain ตรวจผลบนเครื่องเรา โมเดลไม่เห็นเงื่อนไขนี้ (ต่างจาก .describe ที่ไปอยู่ใน JSON Schema ของเครื่องมือ)
  // ถ้าโมเดลเดารหัสที่ไม่มีจริง zod จะไม่ผ่านแล้ว LangChain โยน OutputParserException ซึ่งไฟล์นี้จับและพิมพ์ "แปลงไม่สำเร็จ" ไว้แล้ว
  return z.string().refine((id) => getProduct(id) !== undefined, { message: "ไม่มีสินค้ารหัสนี้ในร้าน" });
}

const Recommend = z.object({
  productId: productIdField().describe("รหัสสินค้าที่มีจริงในร้าน รูปแบบ P000"),
  reason: z.string().describe("เหตุผลที่แนะนำสินค้าชิ้นนี้ สั้นๆ ภาษาไทย"),
});

type Recommendation = z.infer<typeof Recommend>;

export async function main(): Promise<void> {
  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่า .refine ทำงานจริง
  console.log(`ตรวจตัวอย่าง: P001 → ${productIdField().safeParse("P001").success ? "ผ่าน" : "ไม่ผ่าน"}`);
  console.log(`ตรวจตัวอย่าง: P999 → ${productIdField().safeParse("P999").success ? "ผ่าน" : "ไม่ผ่าน"}`);

  const chain = model.withStructuredOutput(Recommend, { name: TOOL, method: "functionCalling" });
  let recommendation: Recommendation | undefined;
  try {
    recommendation = await chain.invoke([
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
  if (recommendation === undefined) {
    console.log("แปลงไม่สำเร็จ: โมเดลไม่ได้เรียกเครื่องมือ");
    return;
  }

  const product = getProduct(recommendation.productId);
  if (product === undefined) {
    console.log(`แนะนำ: ${recommendation.productId} ไม่พบสินค้า`);
    return;
  }
  console.log(`แนะนำ: ${product.id} ${product.name} ราคา ${product.price} บาท`);
  console.log(`เหตุผล: ${recommendation.reason}`);
}
