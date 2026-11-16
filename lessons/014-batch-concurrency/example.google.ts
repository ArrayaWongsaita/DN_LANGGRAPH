// บท 014: ถามหลายคำถามพร้อมกันด้วย .batch() และจำกัดจำนวนงานพร้อมกันด้วย maxConcurrency
// ขั้นที่ 1 เขียนตัวจำกัดงานพร้อมกันเองกับงานปลอม ไม่ยิงเน็ต ขั้นที่ 2 ใช้ model.batch กับโมเดลจริง แล้วนับว่ามีงานพร้อมกันสูงสุดกี่งาน
// รัน: pnpm lesson 014 example.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTIONS = [
  "DN Shop ขายแก้วเซรามิกใบละ 250 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายเมล็ดกาแฟคั่วกลางถุงละ 380 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายที่กรองกาแฟดริปราคา 150 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายเครื่องบดกาแฟมือหมุนราคา 890 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายกระเป๋าผ้าลายกาแฟใบละ 120 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
];

// ChatGoogle ลองใหม่เองโดยปริยาย (ลองซ้ำหลายรอบ) ถ้าไม่ปิด 429 จะถูกลองซ้ำเงียบๆ ข้างใน ทำให้เราไม่เห็นว่าชนโควต้า
// และผลวัดเวลา batch เพี้ยน ตั้ง maxRetries: 0 ให้ error ออกมาถึงโค้ดของเรา
const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), maxRetries: 0 });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// รัน tasks โดยให้ทำพร้อมกันไม่เกิน limit งาน คืนผล "ตามลำดับของ tasks" และจำนวนงานพร้อมกันสูงสุดที่เกิดขึ้นจริง
async function runLimited<T>(tasks: (() => Promise<T>)[], limit: number): Promise<{ results: T[]; peak: number }> {
  const results: T[] = [];
  let next = 0; // งานถัดไปที่ยังไม่มีใครหยิบ
  let running = 0;
  let peak = 0;
  // worker หนึ่งตัวหยิบงานทีละงานจนหมด เปิด worker limit ตัว จึงมีงานพร้อมกันไม่เกิน limit
  async function worker(): Promise<void> {
    while (next < tasks.length) {
      const index = next;
      next += 1;
      running += 1;
      peak = Math.max(peak, running);
      try {
        results[index] = await tasks[index]();
      } finally {
        running -= 1;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return { results, peak };
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: จำกัดงานพร้อมกัน (งานปลอม) ---");
  // งานปลอม 5 งาน รอ 50, 10, 30, 20, 40 ms แล้วคืนเลขลำดับของตัวเอง
  const fakeTasks = [50, 10, 30, 20, 40].map((ms, i) => async () => {
    await sleep(ms);
    return i + 1;
  });
  const unlimited = await runLimited(fakeTasks, 5);
  console.log(`ไม่จำกัด: พร้อมกันสูงสุด ${unlimited.peak}`);
  const limited = await runLimited(fakeTasks, 2);
  console.log(`จำกัด 2: พร้อมกันสูงสุด ${limited.peak}`);
  console.log(`ลำดับผล: ${limited.results.join(", ")}`);

  // ขั้นที่ 2: ยิงโมเดลจริง
  console.log("--- ขั้นที่ 2: model.batch กับ maxConcurrency 2 ---");
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
  const answers = await model.batch(QUESTIONS, { maxConcurrency: 2, callbacks: [tracker] });
  console.log(`งานพร้อมกันสูงสุด: ${peak}`);
  console.log(`ได้คำตอบ: ${answers.filter((a) => a.text.trim() !== "").length} ข้อ`);
  answers.forEach((a, i) => {
    // คำตอบอาจขึ้นหลายบรรทัด เอาบรรทัดแรกที่ไม่ว่าง
    const firstLine = a.text.split("\n").find((l) => l.trim() !== "") ?? "";
    console.log(`ข้อ ${i + 1}: ${firstLine.trim()}`);
  });
}
