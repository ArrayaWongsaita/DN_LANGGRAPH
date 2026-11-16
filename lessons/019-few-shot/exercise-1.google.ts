// แบบฝึกหัด 1: เพิ่มตัวอย่างสำหรับข้อความที่กำกวม
//
// โจทย์: เติม moreExamples() ให้คืนตัวอย่างเพิ่มอย่างน้อย 2 ข้อ สำหรับข้อความที่กำกวม เช่น พูดถึงสินค้าแต่จริงๆ ถามเรื่องคำสั่งซื้อ
// หรือถามกฎของร้าน ตัวอย่างต้องไม่ซ้ำกับข้อสอบ HARD_TESTS ในไฟล์ ไฟล์จะส่ง EXAMPLES ต่อด้วยตัวอย่างของคุณ แล้วถามข้อสอบ 5 ข้อ
//
// แนวทาง:
// 1. ดู HARD_TESTS แล้วคิดว่าข้อไหนกำกวมเพราะอะไร แล้วเขียนตัวอย่างที่ใช้คำคล้ายกันแต่เป็นประโยคของคุณเอง ป้ายต้องเป็นหนึ่งใน LABELS
// 2. ตัวอย่างหนึ่งข้อมี text กับ label เหมือน EXAMPLES ด้านบน
// 3. จุด 👉: คืนอาร์เรย์ของตัวอย่าง ตอนนี้ moreExamples คืนอาร์เรย์ว่างเสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 019 exercise-1.google
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

// ข้อสอบที่กำกวม พร้อมคำตอบที่คาดไว้
const HARD_TESTS: Example[] = [
  { text: "เครื่องบดที่สั่งไปยังไม่ได้ของเลย", label: "order" },
  { text: "เมล็ดกาแฟเก็บได้นานแค่ไหนหลังเปิดถุง", label: "product" },
  { text: "ร้านรับคืนสินค้าภายในกี่วัน", label: "policy" },
  { text: "ขอคืนเงินคำสั่งซื้อ O1001", label: "order" },
  { text: "แก้วมัคสีดำกับสีขาวอันไหนสวยกว่า", label: "product" },
];

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function fewShotMessages(examples: Example[], question: string): Msg[] {
  const shots = examples.flatMap((e): Msg[] => [
    { role: "user", content: e.text },
    { role: "assistant", content: e.label },
  ]);
  return [{ role: "system", content: SYSTEM }, ...shots, { role: "user", content: question }];
}

function moreExamples(): Example[] {
  // 👉 คืนตัวอย่างเพิ่มอย่างน้อย 2 ข้อสำหรับข้อความที่กำกวม (แทนบรรทัด return [])
  return [];
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ moreExamples ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (moreExamples().length === 0) {
    console.log("👉 ยังไม่ได้เติม moreExamples (ดูบรรทัดที่มี 👉)");
    return;
  }

  const examples = [...EXAMPLES, ...moreExamples()];
  // กันป้ายที่พิมพ์ผิด (TypeScript ตรวจให้แล้ว แต่ถ้าใช้ as ข้ามชนิด บรรทัดนี้ยังจับได้)
  const unknown = examples.find((e) => !(LABELS as readonly string[]).includes(e.label));
  if (unknown !== undefined) throw new Error(`ป้ายของตัวอย่าง "${unknown.text}" ต้องเป็นหนึ่งใน ${LABELS.join(", ")}`);
  // นับตัวอย่างที่ซ้ำกับข้อสอบ (ต้องเป็น 0 ไม่เช่นนั้นผลดูเก่งเกินจริง)
  const hardTexts = new Set(HARD_TESTS.map((t) => t.text.trim()));
  const copied = examples.filter((e) => hardTexts.has(e.text.trim())).length;
  console.log(`ตัวอย่างทั้งหมด: ${examples.length} ข้อ`);
  console.log(`ตัวอย่างที่ซ้ำกับข้อสอบ: ${copied} ข้อ`);

  let matched = 0;
  for (const [i, t] of HARD_TESTS.entries()) {
    const res = await model.invoke(fewShotMessages(examples, t.text));
    const label = res.text.trim().toLowerCase();
    console.log(`ข้อ ${i + 1}: ${[...label.replace(/\s+/g, " ")].slice(0, 40).join("")}`);
    if (label === t.label) matched += 1;
  }
  console.log(`ตรงกับที่คาด: ${matched}/${HARD_TESTS.length}`);
}
