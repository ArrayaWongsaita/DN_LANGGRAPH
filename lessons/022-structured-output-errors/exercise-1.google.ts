// แบบฝึกหัด 1: อธิบายว่าทำไม args ที่โมเดลส่งมาจึงใช้ไม่ได้
//
// โจทย์: เติม describeFailure(raw) ให้บอกเหตุผลเป็นภาษาไทยบรรทัดเดียว — ไม่มี tool call บอกว่าโมเดลตอบเป็นข้อความ
// ถ้ามี tool call แต่ args ไม่ตรง StrictQuestion (schema ที่ไฟล์นี้ใช้จริง) ให้ย่อ z.prettifyError เป็นบรรทัดเดียว
// ไฟล์ใช้ schema ที่เข้มขึ้น (summary ยาวไม่เกิน 15 ตัวอักษร) เพื่อให้มีโอกาสเห็น args ที่ไม่ผ่านจริง แล้วพิมพ์เหตุผลของทุกข้อ
//
// แนวทาง:
// 1. หา tool call ตัวแรกด้วย raw.tool_calls?.[0] ถ้าไม่มีเลย ให้คืน `ไม่ได้เรียกเครื่องมือ ตอบเป็นข้อความ: ${oneLine(raw.text, 60)}`
// 2. ถ้ามี ให้ StrictQuestion.safeParse(call.args) ถ้าไม่ผ่าน คืน `args ไม่ตรง schema: ${oneLine(z.prettifyError(result.error), 200)}` (ยุบหลายบรรทัดเป็นบรรทัดเดียว จะได้เห็น → at <field>)
// 3. เพิ่ม oneLine ใน import จาก ./customer-question · จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ describeFailure คืน "" (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 022 exercise-1.google
import { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import * as z from "zod";
import { env } from "../../src/lib/env";
import { CLASSIFY_SYSTEM, CustomerQuestion, MESSAGES } from "./customer-question";

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
  void raw; // บรรทัดนี้กัน lint เตือนว่าตัวแปร raw ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ raw
  // 👉 อธิบายเหตุผลที่ raw ใช้ไม่ได้ (แทนบรรทัด return "")
  return "";
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ describeFailure ยังไม่ทำงาน (ไม่เสีย token)
  if (describeFailure(NO_TOOL_CALL) === "" || describeFailure(BAD_ARGS) === "") {
    console.log("👉 ยังไม่ได้เติม describeFailure (ดูบรรทัดที่มี 👉)");
    return;
  }

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
