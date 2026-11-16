// เฉลยแบบฝึกหัด 2: เลือก maxConcurrency เอง
//
// โจทย์: เติม pickConcurrency() ให้คืนเลข 1, 2 หรือ 3 ที่คุณเลือกเป็น maxConcurrency โดยมีเหตุผลตามที่อ่านใน README (หัวข้อเลือก maxConcurrency)
// แล้วไฟล์จะ batch 6 คำถามด้วยเลขที่เลือก พร้อม tracker ที่นับงานพร้อมกัน และพิมพ์
//   maxConcurrency: K
//   งานพร้อมกันสูงสุด: N
//   ได้คำตอบ: 6 ข้อ
// รัน: pnpm lesson 014 exercise-2.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const QUESTIONS = [
  "DN Shop ขายแก้วเซรามิกใบละ 250 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายเมล็ดกาแฟคั่วกลางถุงละ 380 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายที่กรองกาแฟดริปราคา 150 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายเครื่องบดกาแฟมือหมุนราคา 890 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายกระเป๋าผ้าลายกาแฟใบละ 120 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายผ้ากันเปื้อนบาริสต้าตัวละ 290 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
];

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function pickConcurrency(): number {
  // เฉลยจุดที่ 1: เลือก 2 เพราะเป็นจุดสมดุล
  // - 1 ปลอดภัยที่สุดแต่ช้า เท่ากับถามทีละข้อ ไม่ได้ประโยชน์จาก batch
  // - 3 เร็วกว่า แต่ยิงพร้อมกันมากขึ้นก็ยิ่งเสี่ยงชนลิมิตของ provider (429) โดยเฉพาะแผนฟรี
  // - 2 เร็วขึ้นประมาณเท่าตัวเมื่อเทียบกับ 1 แต่ยังเหลือที่ว่างจากลิมิต และตรงกับค่าที่ใช้ในตัวอย่างของบท
  // (ผลของเลขอื่นต่างกันที่ "งานพร้อมกันสูงสุด" และเวลารัน ไม่ต่างที่จำนวนคำตอบ)
  return 2;
}

export async function main(): Promise<void> {
  const concurrency = pickConcurrency();

  // tracker ฟังเหตุการณ์ของโมเดล: เริ่มเรียก (+1) จบ (-1) หรือล้ม (-1) แล้วจดค่าสูงสุดที่เคยเห็น
  let active = 0;
  let peak = 0;
  const tracker = {
    handleChatModelStart: () => {
      active += 1;
      peak = Math.max(peak, active);
    },
    handleLLMEnd: () => {
      active -= 1;
    },
    handleLLMError: () => {
      active -= 1;
    },
  };
  const answers = await model.batch(QUESTIONS, { maxConcurrency: concurrency, callbacks: [tracker] });
  console.log(`maxConcurrency: ${concurrency}`);
  console.log(`งานพร้อมกันสูงสุด: ${peak}`);
  console.log(`ได้คำตอบ: ${answers.filter((a) => a.text.trim() !== "").length} ข้อ`);
}
