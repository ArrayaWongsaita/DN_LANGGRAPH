// เฉลยแบบฝึกหัด 2: เขียนตัวอย่างเป็นข้อความต่อท้าย system แทนการส่งเป็นคู่ข้อความ
//
// โจทย์: เติม examplesAsText(examples) ให้คืนข้อความที่เขียนตัวอย่างทุกข้อ บรรทัดละข้อ ในรูปแบบ
//   ข้อความ: <text> → ประเภท: <label>
// ไฟล์จะต่อข้อความนี้ท้าย system แล้วส่งแค่ system กับคำถาม (ไม่มีคู่ user/assistant) ถามชุด TESTS 5 ข้อ
// รัน: pnpm lesson 019 exercise-2.ollama
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
  // เฉลยจุดที่ 1: ตัวอย่าง 1 ข้อเป็น 1 บรรทัด แล้วต่อด้วย \n เหมือน catalogText ในบท 018
  // ลูกศร → คั่นข้อความกับป้ายให้เห็นขอบเขตของแต่ละส่วนชัดกว่าการใช้ช่องว่าง
  return examples.map((e) => `ข้อความ: ${e.text} → ประเภท: ${e.label}`).join("\n");
}

export async function main(): Promise<void> {
  // บรรทัดที่พิมพ์นี้ใช้ตรวจ examplesAsText กับตัวอย่าง 2 ข้อแรก (ต่อเป็นบรรทัดเดียวเพื่อให้ตรวจง่าย)
  console.log(`ตรวจตัวอย่าง: ${examplesAsText(EXAMPLES.slice(0, 2)).replace(/\s*\n\s*/g, " | ")}`);
  // ตัวอย่างที่เขียนเป็นข้อความไม่ได้สอนรูปแบบคำตอบเข้มเท่าคู่ user/assistant โมเดลอาจตอบตามรูป "ประเภท: ..."
  // จึงต้องสั่งรูปแบบคำตอบด้วยประโยคเพิ่มใน system (ค่าที่ตอบคือป้ายคำเดียว)
  const system = `${SYSTEM} ตอบเป็นป้ายคำเดียวเท่านั้น\n\nตัวอย่าง:\n${examplesAsText(EXAMPLES)}`;
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
