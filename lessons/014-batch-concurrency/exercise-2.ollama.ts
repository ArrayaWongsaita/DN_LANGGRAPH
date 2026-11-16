// แบบฝึกหัด 2: เลือก maxConcurrency เอง
//
// โจทย์: เติม pickConcurrency() ให้คืนเลข 1, 2 หรือ 3 ที่คุณเลือกเป็น maxConcurrency โดยมีเหตุผลตามที่อ่านใน README (หัวข้อเลือก maxConcurrency)
// แล้วไฟล์จะ batch 6 คำถามด้วยเลขที่เลือก พร้อม tracker ที่นับงานพร้อมกัน และพิมพ์
//   maxConcurrency: K
//   งานพร้อมกันสูงสุด: N
//   ได้คำตอบ: 6 ข้อ
//
// แนวทาง:
// 1. อ่านข้อดีข้อเสียของเลขต่ำและเลขสูงใน README ก่อน แล้วเลือกเลขเดียว ทุกตัวเลือก 1-3 ใช้ได้ ผลที่เห็นต่างกันที่ N และเวลารัน
// 2. ลองรันซ้ำโดยเปลี่ยนเลข แล้วดูว่า N เปลี่ยนตามหรือไม่
// 3. จุด 👉: คืนเลขที่เลือก ตอนนี้ pickConcurrency คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 014 exercise-2.ollama
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

function pickConcurrency(): number | undefined {
  // 👉 คืนเลข 1, 2 หรือ 3 ที่คุณเลือก (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ยังไม่ได้เลือกเลข (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const concurrency = pickConcurrency();
  if (concurrency === undefined) {
    console.log("👉 ยังไม่ได้เติม pickConcurrency (ดูบรรทัดที่มี 👉)");
    return;
  }

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
