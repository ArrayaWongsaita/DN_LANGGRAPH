// บท 020: ให้โมเดลตอบเป็น JSON แล้วตรวจด้วย zod ก่อนเอาไปใช้
// ขั้นที่ 1 ตรวจข้อความ JSON ตายตัว 4 ก้อน (ไม่ยิงเน็ต) ขั้นที่ 2 ขอ JSON จากโมเดลจริง 3 คำถาม
// รัน: pnpm lesson 020 example.ollama
import { ChatOllama } from "@langchain/ollama";
import * as z from "zod";
import { env, optionalEnv } from "../../src/lib/env";
import { searchProducts } from "../../src/shop/products";
import { CATEGORY_GUIDE, QUESTIONS, SearchFilter, extractJson, oneLine } from "./search-filter";

z.config(z.locales.th());

// ข้อความตายตัว 4 ก้อน: JSON เปล่า, JSON ที่ถูกห่อด้วย code fence, type ผิด และ null
const SAMPLES: readonly string[] = [
  '{"keyword":"ดริป","maxPrice":200}',
  '```json\n{"category":"drinkware"}\n```',
  '{"keyword":"แก้ว","maxPrice":"300"}',
  '{"keyword":null,"category":"gifts"}',
];

const SYSTEM = [
  "แปลงคำถามของลูกค้าร้าน DN Shop เป็น JSON อย่างเดียว ห้ามมีข้อความอื่น",
  'รูปแบบ: {"keyword": …, "category": …, "maxPrice": …}',
  `category เลือกจาก ${CATEGORY_GUIDE}`,
  "ไม่ใส่ field ที่ลูกค้าไม่ได้พูดถึง",
].join("\n");

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

// ลอง JSON.parse ตรงๆ ถ้าไม่ผ่านลองแกะเฉพาะ {...} แล้วตรวจด้วย zod
// คืน true เมื่อ zod ผ่าน (พิมพ์จำนวนสินค้าที่ค้นเจอด้วย)
function parseAndCheck(text: string): boolean {
  let value: unknown;
  let parsed = false;
  try {
    value = JSON.parse(text);
    parsed = true;
    console.log("JSON.parse ตรงๆ: ผ่าน");
  } catch (e) {
    console.log(`JSON.parse ตรงๆ: ไม่ผ่าน (${e instanceof Error ? e.name : "Error"})`);
  }
  if (!parsed) {
    try {
      value = JSON.parse(extractJson(text));
      parsed = true;
      console.log("แกะเอาเฉพาะ {...} แล้ว: ผ่าน");
    } catch {
      console.log("แกะเอาเฉพาะ {...} แล้ว: ไม่ผ่าน");
    }
  }
  if (!parsed) return false;

  const result = SearchFilter.safeParse(value);
  if (!result.success) {
    console.log("zod: ไม่ผ่าน");
    for (const line of z.prettifyError(result.error).split("\n")) console.log(`  ${line}`);
    return false;
  }
  console.log(`zod: ผ่าน ${JSON.stringify(result.data)}`);
  console.log(`เจอสินค้า: ${searchProducts(result.data).length} ชิ้น`);
  return true;
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: ตรวจ JSON ด้วย zod (ข้อความตายตัว) ---");
  for (const [i, text] of SAMPLES.entries()) {
    console.log(`ข้อความที่ ${i + 1}: ${oneLine(text, 80)}`);
    parseAndCheck(text);
  }

  // ขั้นที่ 2: ขอ JSON จากโมเดลจริง
  console.log("--- ขั้นที่ 2: ขอ JSON จากโมเดลจริง ---");
  let zodOk = 0;
  for (const [i, question] of QUESTIONS.entries()) {
    const res = await model.invoke([
      { role: "system", content: SYSTEM },
      { role: "user", content: question },
    ]);
    console.log(`--- คำถามที่ ${i + 1}: ${question} ---`);
    console.log(`คำตอบดิบ: ${oneLine(res.text, 200)}`);
    if (parseAndCheck(res.text)) zodOk += 1;
  }
  console.log(`สรุป: zod ผ่าน ${zodOk}/${QUESTIONS.length}`);
}
