// แบบฝึกหัด 2: เขียนตัวอย่างเป็นข้อความต่อท้าย system แทนการส่งเป็นคู่ข้อความ
//
// โจทย์: เติม examplesAsText(examples) ให้คืนข้อความที่เขียนตัวอย่างทุกข้อ บรรทัดละข้อ ในรูปแบบ
//   ข้อความ: <text> → ประเภท: <label>
// ไฟล์จะต่อข้อความนี้ท้าย system แล้วส่งแค่ system กับคำถาม (ไม่มีคู่ user/assistant) ถามชุด TESTS 5 ข้อ
//
// แนวทาง:
// 1. ใช้ map กับตัวอย่างแต่ละข้อให้เป็น 1 บรรทัด แล้วต่อด้วยขึ้นบรรทัดใหม่ (join) เหมือน catalogText ในบท 018
// 2. ลูกศรในรูปแบบคือตัวอักษร → (ก๊อปจากโจทย์ได้)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ examplesAsText คืนข้อความว่างเสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 019 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const LABELS = ["product", "order", "policy", "other"] as const;
type Label = (typeof LABELS)[number];

interface Example {
  text: string;
  label: Label;
}

const SYSTEM = "แยกประเภทข้อความของลูกค้าร้าน DN Shop เป็น product, order, policy หรือ other";

const EXAMPLES: Example[] = [
  { text: "มีแก้วเก็บความเย็นไหม", label: "product" },
  { text: "ขอเลขพัสดุของคำสั่งซื้อ O1005", label: "order" },
  { text: "ค่าส่งต่างจังหวัดเท่าไร", label: "policy" },
  { text: "แนะนำหนังสนุกๆ หน่อย", label: "other" },
];

const TESTS: Example[] = [
  { text: "เมล็ดกาแฟคั่วอ่อนมีรสเปรี้ยวไหม", label: "product" },
  { text: "คำสั่งซื้อ O1002 ส่งถึงไหนแล้ว", label: "order" },
  { text: "ถ้าแก้วแตกระหว่างส่ง เคลมได้ไหม", label: "policy" },
  { text: "วันนี้ฝนตกไหม", label: "other" },
  { text: "ขอยกเลิกออร์เดอร์ที่สั่งเมื่อวาน", label: "order" },
];

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function examplesAsText(examples: Example[]): string {
  void examples; // บรรทัดนี้กัน lint เตือนว่าตัวแปร examples ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ examples
  // 👉 คืนตัวอย่างทุกข้อ บรรทัดละข้อ รูปแบบ "ข้อความ: ... → ประเภท: ..." (แทนบรรทัด return "")
  return "";
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ examplesAsText ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (examplesAsText([{ text: "ก", label: "other" }]) === "") {
    console.log("👉 ยังไม่ได้เติม examplesAsText (ดูบรรทัดที่มี 👉)");
    return;
  }

  // บรรทัดที่พิมพ์นี้ใช้ตรวจ examplesAsText กับตัวอย่าง 2 ข้อแรก (ต่อเป็นบรรทัดเดียวเพื่อให้ตรวจง่าย)
  console.log(`ตรวจตัวอย่าง: ${examplesAsText(EXAMPLES.slice(0, 2)).replace(/\s*\n\s*/g, " | ")}`);
  const system = `${SYSTEM}\n\nตัวอย่าง:\n${examplesAsText(EXAMPLES)}`;
  let formatOk = 0;
  let matched = 0;
  for (const [i, t] of TESTS.entries()) {
    const res = await model.invoke([
      { role: "system", content: system },
      { role: "user", content: t.text },
    ]);
    const label = res.text.trim().toLowerCase();
    console.log(`ข้อ ${i + 1}: ${[...label.replace(/\s+/g, " ")].slice(0, 40).join("")}`);
    if ((LABELS as readonly string[]).includes(label)) formatOk += 1;
    if (label === t.label) matched += 1;
  }
  console.log(`รูปแบบถูก: ${formatOk}/${TESTS.length}`);
  console.log(`ตรงกับที่คาด: ${matched}/${TESTS.length}`);
}
