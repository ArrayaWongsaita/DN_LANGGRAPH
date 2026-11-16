// เฉลยแบบฝึกหัด 1: อธิบายว่าทำไม args ที่โมเดลส่งมาจึงใช้ไม่ได้
//
// โจทย์: เติม describeFailure(raw) ให้บอกเหตุผลเป็นภาษาไทยบรรทัดเดียว — ไม่มี tool call บอกว่าโมเดลตอบเป็นข้อความ
// ถ้ามี tool call แต่ args ไม่ตรง StrictQuestion (schema ที่ไฟล์นี้ใช้จริง) ให้ย่อ z.prettifyError เป็นบรรทัดเดียว
// ไฟล์ใช้ schema ที่เข้มขึ้น (summary ยาวไม่เกิน 15 ตัวอักษร) เพื่อให้มีโอกาสเห็น args ที่ไม่ผ่านจริง แล้วพิมพ์เหตุผลของทุกข้อ
// รัน: pnpm lesson 022 exercise-1.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import * as z from "zod";
import { env } from "../../src/lib/env";
import { CLASSIFY_SYSTEM, CustomerQuestion, MESSAGES, oneLine } from "./customer-question";

z.config(z.locales.th());

const TOOL = "classify_question";

// ตัวอย่างปลอม 2 ก้อนสำหรับตรวจ describeFailure: โมเดลตอบเป็นข้อความ และโมเดลเรียกเครื่องมือแต่ enum ผิด
const NO_TOOL_CALL = new AIMessage("ขอโทษครับ ผมไม่แน่ใจว่าหมายถึงอะไร");
const BAD_ARGS = new AIMessage({
  content: "",
  tool_calls: [{ name: TOOL, args: { category: "shipping", keywords: [], urgent: false, summary: "ถามค่าส่ง" }, id: "call_fake" }],
});

// schema ที่เข้มขึ้น: summary ยาวไม่เกิน 15 ตัวอักษร (ใช้กับ withStructuredOutput และ describeFailure ของไฟล์นี้)
const StrictQuestion = CustomerQuestion.extend({
  summary: z.string().max(15).describe("สรุปคำถามสั้นๆ ภาษาไทย ไม่เกิน 15 ตัวอักษร"),
});

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function describeFailure(raw: AIMessage): string {
  // เฉลยจุดที่ 1: อ่าน tool_calls[0] ของคำตอบดิบ ไม่เดาจากถ้อยคำ เพราะสองกรณีทิ้งร่องรอยไว้ต่างกัน
  // ไม่มี tool call = withStructuredOutput ไม่ได้ args มาเลย (parsed เป็น undefined) จึงบอกพร้อมข้อความที่โมเดลตอบ
  const call = raw.tool_calls?.[0];
  if (call === undefined) {
    return `ไม่ได้เรียกเครื่องมือ ตอบเป็นข้อความ: ${oneLine(raw.text, 60)}`;
  }
  // มี tool call = parsed เป็น null เพราะ args ไม่ผ่าน schema ที่ไฟล์นี้ใช้จริง (StrictQuestion ที่ summary ยาวไม่เกิน 15)
  // ตรวจด้วย StrictQuestion ไม่ใช่ CustomerQuestion: args ที่ผ่าน CustomerQuestion แต่ summary ยาวเกิน 15 ก็ทำให้ parsed เป็น null
  // ถ้าตรวจด้วย CustomerQuestion จะผ่านแล้วพิมพ์เหตุผลว่าง ซึ่งไม่บอกอะไรคนอ่านเลย
  // ใช้ z.prettifyError ไม่เขียนข้อความเอง: มันบอกบรรทัด → at <field> ว่าผิดที่ field ไหน (ยุบเป็นบรรทัดเดียวด้วย oneLine)
  const result = StrictQuestion.safeParse(call.args);
  if (result.success) {
    return "args ผ่าน schema ของไฟล์นี้ แต่ LangChain แปลงไม่สำเร็จ";
  }
  return `args ไม่ตรง schema: ${oneLine(z.prettifyError(result.error), 200)}`;
}

export async function main(): Promise<void> {
  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่า describeFailure แยกสองกรณีออกจากกันจริง
  console.log(`ตรวจตัวอย่าง 1: ${describeFailure(NO_TOOL_CALL)}`);
  console.log(`ตรวจตัวอย่าง 2: ${describeFailure(BAD_ARGS)}`);

  // ChatGoogle ใช้ method ค่าเริ่มต้น (functionCalling ที่บังคับเรียกเครื่องมือ) จึงส่งแค่ชื่อ
  const chain = model.withStructuredOutput(StrictQuestion, { name: TOOL, includeRaw: true });
  let ok = 0;
  for (const [i, message] of MESSAGES.entries()) {
    // เรียกทีละข้อ ไม่ใช้ .batch: withFallbacks ของ includeRaw ทำงานทั้ง batch ถ้ามีข้อเดียวแปลงไม่ผ่าน ทุกข้อจะได้ parsed = null
    const { raw, parsed } = await chain.invoke([
      { role: "system", content: CLASSIFY_SYSTEM },
      { role: "user", content: message },
    ]);
    if (parsed == null) {
      console.log(`ข้อ ${i + 1}: แปลงไม่สำเร็จ`);
      console.log(`  เหตุที่ไม่ผ่าน: ${describeFailure(raw as AIMessage)}`);
      continue;
    }
    ok += 1;
    console.log(`ข้อ ${i + 1}: ${parsed.category}`);
  }
  console.log(`แปลงสำเร็จ: ${ok}/${MESSAGES.length}`);
}
