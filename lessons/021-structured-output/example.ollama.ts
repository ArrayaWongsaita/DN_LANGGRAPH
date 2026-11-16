// บท 021: withStructuredOutput ให้ LangChain แปลง schema เป็นเครื่องมือแล้วตรวจผลให้
// ขั้นที่ 1 ดู JSON Schema ที่ LangChain ส่งให้โมเดล (ไม่ยิงเน็ต) ขั้นที่ 2 ให้โมเดลแปลงคำถามเป็นตัวกรองค้นสินค้า
// รัน: pnpm lesson 021 example.ollama
import { OutputParserException } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import * as z from "zod";
import { env, optionalEnv } from "../../src/lib/env";
import { searchProducts } from "../../src/shop/products";
import { CATEGORY_GUIDE, QUESTIONS, SearchFilter, oneLine } from "./search-filter";

const TOOL = "search_filter";
const SYSTEM = `แปลงคำถามของลูกค้าเป็นตัวกรองค้นสินค้า ใส่เฉพาะ field ที่ลูกค้าพูดถึง ตอบโดยเรียกเครื่องมือ ${TOOL} เท่านั้น\n${CATEGORY_GUIDE}`;

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ดู schema ที่ LangChain ส่งไปกับเครื่องมือ
  console.log("--- ขั้นที่ 1: schema ที่ LangChain ส่งให้โมเดล ---");
  console.log(`ชื่อเครื่องมือ: ${TOOL}`);
  console.log(JSON.stringify(z.toJSONSchema(SearchFilter), null, 2));

  // ขั้นที่ 2: ให้โมเดลกรอก schema ผ่านเครื่องมือ
  console.log("--- ขั้นที่ 2: withStructuredOutput ---");
  const chain = model.withStructuredOutput(SearchFilter, { name: TOOL, method: "functionCalling" });
  let ok = 0;
  for (const [i, question] of QUESTIONS.entries()) {
    console.log(`--- คำถามที่ ${i + 1}: ${question} ---`);
    // Ollama บังคับให้เรียกเครื่องมือไม่ได้: ถ้าโมเดลตอบเป็นข้อความ LangChain คืน undefined
    let filter: SearchFilter | undefined;
    try {
      filter = await chain.invoke([
        { role: "system", content: SYSTEM },
        { role: "user", content: question },
      ]);
    } catch (e) {
      if (e instanceof OutputParserException) {
        console.log(`แปลงไม่สำเร็จ: args ไม่ตรง schema → ${oneLine(e.llmOutput ?? e.message, 120)}`);
        continue;
      }
      throw e;
    }
    if (filter === undefined) {
      console.log("แปลงไม่สำเร็จ: โมเดลไม่ได้เรียกเครื่องมือ");
      continue;
    }
    ok += 1;
    const found = searchProducts(filter);
    console.log(`ตัวกรอง: ${JSON.stringify(filter)}`);
    console.log(`เจอสินค้า: ${found.length} ชิ้น${found.length > 0 ? `: ${found.slice(0, 3).map((p) => p.name).join(", ")}` : ""}`);
  }
  console.log(`สรุป: แปลงสำเร็จ ${ok}/${QUESTIONS.length}`);
}
