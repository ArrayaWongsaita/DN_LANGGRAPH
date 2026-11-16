// บท 019: few-shot สอนโมเดลด้วยตัวอย่างคำถามกับคำตอบ ใช้แยกประเภทข้อความของลูกค้า
// ขั้นที่ 1 ประกอบข้อความที่ส่งเมื่อมีตัวอย่าง (ไม่ยิงเน็ต) ขั้นที่ 2 ถามชุดทดสอบเดิม 2 รอบ: ไม่มีตัวอย่าง (zero-shot) กับมีตัวอย่าง (few-shot)
// รัน: pnpm lesson 019 example.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const LABELS = ["product", "order", "policy", "other"] as const;
type Label = (typeof LABELS)[number];

interface Example {
  text: string;
  label: Label;
}

type Role = "system" | "user" | "assistant";
type Msg = { role: Role; content: string };

const SYSTEM = "แยกประเภทข้อความของลูกค้าร้าน DN Shop เป็น product, order, policy หรือ other";

const EXAMPLES: Example[] = [
  { text: "มีแก้วเก็บความเย็นไหม", label: "product" },
  { text: "ขอเลขพัสดุของคำสั่งซื้อ O1005", label: "order" },
  { text: "ค่าส่งต่างจังหวัดเท่าไร", label: "policy" },
  { text: "แนะนำหนังสนุกๆ หน่อย", label: "other" },
];

// ชุดทดสอบ: ข้อความที่ไม่ซ้ำกับตัวอย่าง พร้อมคำตอบที่คาดไว้
const TESTS: Example[] = [
  { text: "เมล็ดกาแฟคั่วอ่อนมีรสเปรี้ยวไหม", label: "product" },
  { text: "คำสั่งซื้อ O1002 ส่งถึงไหนแล้ว", label: "order" },
  { text: "ถ้าแก้วแตกระหว่างส่ง เคลมได้ไหม", label: "policy" },
  { text: "วันนี้ฝนตกไหม", label: "other" },
  { text: "ขอยกเลิกออร์เดอร์ที่สั่งเมื่อวาน", label: "order" },
];

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

// system แล้วตามด้วยตัวอย่างทีละคู่ (user ถาม assistant ตอบ) สุดท้ายคือคำถามจริง
function fewShotMessages(examples: Example[], question: string): Msg[] {
  const shots = examples.flatMap((e): Msg[] => [
    { role: "user", content: e.text },
    { role: "assistant", content: e.label },
  ]);
  return [{ role: "system", content: SYSTEM }, ...shots, { role: "user", content: question }];
}

// ป้ายที่โมเดลตอบ: ตัดช่องว่างหัวท้ายและทำเป็นตัวพิมพ์เล็ก
async function classify(messages: Msg[]): Promise<string> {
  const res = await model.invoke(messages);
  return res.text.trim().toLowerCase();
}

// พิมพ์ผล 5 ข้อ (ป้ายบรรทัดเดียว ไม่เกิน 40 ตัวอักษร) แล้วสรุปว่ารูปแบบถูกกี่ข้อ ตรงกับที่คาดกี่ข้อ
async function runRound(makeMessages: (question: string) => Msg[]): Promise<void> {
  let formatOk = 0;
  let matched = 0;
  for (const [i, t] of TESTS.entries()) {
    const label = await classify(makeMessages(t.text));
    const oneLine = [...label.replace(/\s+/g, " ")].slice(0, 40).join("");
    console.log(`ข้อ ${i + 1}: ${oneLine}`);
    if ((LABELS as readonly string[]).includes(label)) formatOk += 1;
    if (label === t.label) matched += 1;
  }
  console.log(`รูปแบบถูก: ${formatOk}/${TESTS.length}`);
  console.log(`ตรงกับที่คาด: ${matched}/${TESTS.length}`);
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: ข้อความที่ส่งเมื่อมีตัวอย่าง ---");
  const sample = fewShotMessages(EXAMPLES, TESTS[0].text);
  for (const m of sample) console.log(`${m.role}: ${m.content}`);
  console.log(`รวม ${sample.length} ข้อความ`);

  // ขั้นที่ 2: ถามโมเดลจริง ชุดทดสอบเดิม 2 รอบ
  console.log("--- ขั้นที่ 2: ไม่มีตัวอย่าง (zero-shot) ---");
  await runRound((question) => [
    { role: "system", content: SYSTEM },
    { role: "user", content: question },
  ]);
  console.log("--- ขั้นที่ 2: มีตัวอย่าง (few-shot) ---");
  await runRound((question) => fewShotMessages(EXAMPLES, question));
}
