// แบบฝึกหัด 2: เปิด JSON mode ให้โมเดลตอบ JSON เปล่า
//
// โจทย์: เติม jsonModeOptions() ให้คืนตัวเลือกที่เปิด JSON mode ของ ChatGoogle คือ `responseMimeType: "application/json"`
// ไฟล์สร้างโมเดลด้วยตัวเลือกเดิม + jsonModeOptions() แล้วถามคำถามชุดเดียวกับตัวอย่าง โดยไม่ใช้ extractJson (ต้อง JSON.parse ตรงๆ ได้)
//
// แนวทาง:
// 1. ดูชนิด ChatGoogleParams ใน @langchain/google: field `responseMimeType` รับ string ("application/json" คือ JSON mode ของ Gemini)
// 2. คืน object ที่มี field นั้นเพียงตัวเดียว ฟังก์ชันคืน Partial<ChatGoogleParams> จึงใส่เฉพาะที่เพิ่มได้
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ jsonModeOptions คืน {} (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 020 exercise-2.google
import { ChatGoogle, type ChatGoogleParams } from "@langchain/google";
import * as z from "zod";
import { env } from "../../src/lib/env";
import { searchProducts } from "../../src/shop/products";
import { CATEGORY_GUIDE, QUESTIONS, SearchFilter, oneLine } from "./search-filter";

z.config(z.locales.th());

const SYSTEM = [
  "แปลงคำถามของลูกค้าร้าน DN Shop เป็น JSON อย่างเดียว ห้ามมีข้อความอื่น",
  'รูปแบบ: {"keyword": …, "category": …, "maxPrice": …}',
  `category เลือกจาก ${CATEGORY_GUIDE}`,
  "ไม่ใส่ field ที่ลูกค้าไม่ได้พูดถึง",
].join("\n");

function jsonModeOptions(): Partial<ChatGoogleParams> {
  // 👉 คืนตัวเลือกที่เปิด JSON mode ของ Gemini (แทนบรรทัด return {})
  return {};
}

const model = new ChatGoogle({
  model: env("GOOGLE_MODEL"),
  apiKey: env("GOOGLE_API_KEY"),
  ...jsonModeOptions(),
});

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ยังไม่ได้เปิด JSON mode (ไม่เสีย token)
  if (Object.keys(jsonModeOptions()).length === 0) {
    console.log("👉 ยังไม่ได้เติม jsonModeOptions (ดูบรรทัดที่มี 👉)");
    return;
  }

  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่าเปิด JSON mode จริง
  console.log(`ตรวจตัวอย่าง: ตัวเลือกที่เพิ่ม ${JSON.stringify(jsonModeOptions())}`);

  let parseOk = 0;
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
      parseOk += 1;
      console.log("JSON.parse ตรงๆ: ผ่าน");
    } catch (e) {
      console.log(`JSON.parse ตรงๆ: ไม่ผ่าน (${e instanceof Error ? e.name : "Error"})`);
      continue;
    }
    const result = SearchFilter.safeParse(value);
    if (!result.success) {
      console.log(`zod: ไม่ผ่าน ${z.prettifyError(result.error).split("\n")[0]}`);
      continue;
    }
    zodOk += 1;
    console.log(`zod: ผ่าน ${JSON.stringify(result.data)}`);
    console.log(`เจอสินค้า: ${searchProducts(result.data).length} ชิ้น`);
  }
  console.log(`JSON.parse ตรงๆ ผ่าน: ${parseOk}/${QUESTIONS.length}`);
  console.log(`zod ผ่าน: ${zodOk}/${QUESTIONS.length}`);
}
