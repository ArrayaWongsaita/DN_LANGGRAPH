// เฉลยแบบฝึกหัด 2: เปิด JSON mode ให้โมเดลตอบ JSON เปล่า
//
// โจทย์: เติม jsonModeOptions() ให้คืนตัวเลือกที่เปิด JSON mode ของ ChatGoogle คือ `responseMimeType: "application/json"`
// ไฟล์สร้างโมเดลด้วยตัวเลือกเดิม + jsonModeOptions() แล้วถามคำถามชุดเดียวกับตัวอย่าง โดยไม่ใช้ extractJson (ต้อง JSON.parse ตรงๆ ได้)
// รัน: pnpm lesson 020 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
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
  // เฉลยจุดที่ 1: Gemini เปิด JSON mode ด้วย field `responseMimeType` ค่า "application/json"
  // prompt ที่บอกให้ตอบ JSON อย่างเดียวไม่พอ: โมเดลยังห่อด้วย ```json หรือเติมข้อความนำได้ JSON mode บังคับที่ตัวโมเดล
  // คืนเป็น Partial จึงใส่เฉพาะตัวเลือกที่เพิ่ม แล้ว spread ต่อท้ายตัวเลือกเดิมของโมเดลข้างล่าง
  // JSON mode รับประกันแค่ว่า "เป็น JSON ที่ JSON.parse ผ่าน" ไม่ได้รับประกันว่าตรง schema (ยังต้องตรวจด้วย zod)
  return { responseMimeType: "application/json" };
}

const model = new ChatGoogle({
  model: env("GOOGLE_MODEL"),
  apiKey: env("GOOGLE_API_KEY"),
  ...jsonModeOptions(),
});

export async function main(): Promise<void> {
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
