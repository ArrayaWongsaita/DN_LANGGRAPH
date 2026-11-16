// บท 010: ตั้งค่าโมเดล (temperature และการจำกัดความยาว) กับ ChatOllama
// ขั้นที่ 1 คำนวณดูว่า temperature เปลี่ยนโอกาสของคำถัดไปอย่างไร ไม่ยิงเน็ต ขั้นที่ 2 ถามโมเดลจริงซ้ำๆ
// รัน: pnpm lesson 010 example.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const NAME_QUESTION = "ตั้งชื่อร้านกาแฟเล็กๆ ในซอย 1 ชื่อ ตอบแค่ชื่อ";
const LONG_QUESTION = "อธิบายวิธีชงกาแฟดริปให้ละเอียดทุกขั้นตอน";
const ROUNDS = 3;

const apiKey = optionalEnv("OLLAMA_API_KEY");

// สร้างโมเดลด้วยค่าพื้นฐานเดียวกัน แล้วรับค่าตั้งเพิ่มเติมเข้ามา (temperature, numPredict)
function makeModel(extra: { temperature?: number; numPredict?: number }): ChatOllama {
  return new ChatOllama({
    model: env("OLLAMA_MODEL"),
    baseUrl: env("OLLAMA_BASE_URL"),
    headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
    ...extra,
  });
}

// softmax: แปลงคะแนนของแต่ละคำเป็นโอกาส (รวมกัน 100%) โดยหารคะแนนด้วย t ก่อน
// t น้อย = คะแนนสูงสุดได้โอกาสเกือบทั้งหมด, t มาก = โอกาสเฉลี่ยกันมากขึ้น
function softmax(scores: Record<string, number>, t: number): Record<string, number> {
  const entries = Object.entries(scores);
  const top = Math.max(...entries.map(([, s]) => s / t));
  // ลบค่าสูงสุดออกก่อน exp เพื่อกันตัวเลขใหญ่เกินไป ผลหลังหารเท่าเดิม
  const exps = entries.map(([word, s]) => [word, Math.exp(s / t - top)] as const);
  const total = exps.reduce((sum, [, e]) => sum + e, 0);
  return Object.fromEntries(exps.map(([word, e]) => [word, Math.round((e / total) * 100)]));
}

// ถามคำถามเดิมซ้ำทีละครั้ง (ไม่ขนาน) แล้วคืนคำตอบที่ย่อเป็นบรรทัดเดียว
async function askRepeatedly(model: ChatOllama): Promise<string[]> {
  const answers: string[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    const res = await model.invoke(NAME_QUESTION);
    answers.push(res.text.replace(/\s+/g, " ").trim());
  }
  return answers;
}

async function printSet(label: string, model: ChatOllama): Promise<void> {
  const answers = await askRepeatedly(model);
  console.log(`${label}: ${answers.join(" | ")}`);
  console.log(`ต่างกัน: ${new Set(answers).size} แบบ จาก ${ROUNDS} ครั้ง`);
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: temperature เปลี่ยนโอกาสของคำถัดไป ---");
  const scores = { กาแฟ: 2, ชา: 1, โกโก้: 0.5 };
  for (const t of [0.2, 1, 2]) {
    const percents = Object.entries(softmax(scores, t)).map(([word, p]) => `${word} ${p}%`);
    console.log(`t=${t}: ${percents.join(" | ")}`);
  }

  // ขั้นที่ 2: ถามโมเดลจริง ผลเปลี่ยนได้ทุกครั้ง
  console.log("--- ขั้นที่ 2: ถามซ้ำ 3 ครั้ง ---");
  await printSet("ชุดที่ 1 (temperature 0)", makeModel({ temperature: 0 }));
  await printSet("ชุดที่ 2 (temperature 1.5)", makeModel({ temperature: 1.5 }));

  // numPredict คือจำนวน token สูงสุดที่โมเดลจะสร้าง ถึงเมื่อไรก็ถูกตัดทันที
  console.log("--- จำกัดความยาว (numPredict 20) ---");
  const res = await makeModel({ numPredict: 20 }).invoke(LONG_QUESTION);
  const finish: unknown = res.response_metadata.done_reason;
  if (typeof finish !== "string") {
    throw new Error("ไม่พบเหตุที่โมเดลหยุดใน response_metadata (ลองพิมพ์ res.response_metadata ดูว่าฟิลด์ชื่ออะไร)");
  }
  console.log(`จบเพราะ: ${finish}`);
  console.log(`ได้ข้อความ: ${[...res.text].length} ตัวอักษร`);
}
