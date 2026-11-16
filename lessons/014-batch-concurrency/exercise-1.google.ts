// แบบฝึกหัด 1: batch ที่บางข้อล้ม: ใช้ returnExceptions แล้วนับข้อที่สำเร็จและล้มเหลว
//
// โจทย์: เติม countResults(rs) ให้นับผลของ batch ว่ามีกี่ข้อที่เป็นคำตอบ (string) และกี่ข้อที่เป็น Error
// คืน { ok, failed } ไฟล์ถาม 5 ข้อผ่าน RunnableLambda ที่ตั้งใจให้ล้ม 1 ข้อ (คำถามที่มี "(ทดสอบล้ม)") แล้วพิมพ์
//   ข้อ i: สำเร็จ   หรือ   ข้อ i: ล้มเหลว (<ข้อความ error>)
//   สำเร็จ X ล้มเหลว Y
//
// แนวทาง:
// 1. ปกติ batch จะ throw ทันทีที่มีข้อหนึ่งล้ม ไฟล์นี้ส่ง { returnExceptions: true } เป็นอาร์กิวเมนต์ที่ 3 ข้อที่ล้มจึงกลายเป็นค่า Error อยู่ในอาร์เรย์ผล
// 2. แยกว่าผลแต่ละตัวเป็นคำตอบหรือ Error ด้วย instanceof Error (เหมือนที่ main พิมพ์รายข้อ)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ countResults คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 014 exercise-1.google
import { RunnableLambda } from "@langchain/core/runnables";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTIONS = [
  "DN Shop ขายแก้วเซรามิกใบละ 250 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายเมล็ดกาแฟคั่วกลางถุงละ 380 บาท (ทดสอบล้ม) เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายที่กรองกาแฟดริปราคา 150 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายเครื่องบดกาแฟมือหมุนราคา 890 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
  "DN Shop ขายกระเป๋าผ้าลายกาแฟใบละ 120 บาท เขียนคำโปรยสั้นๆ ตอบไม่เกิน 1 ประโยค",
];

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function countResults(rs: (string | Error)[]): { ok: number; failed: number } | undefined {
  void rs; // บรรทัดนี้กัน lint เตือนว่าตัวแปร rs ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ rs
  // 👉 นับข้อที่เป็นคำตอบ (ok) และข้อที่เป็น Error (failed) แล้วคืน { ok, failed } (แทนบรรทัด return undefined)
  return undefined;
}

// ข้อที่มี "(ทดสอบล้ม)" จะ throw โดยไม่เรียกโมเดล ข้ออื่นถามโมเดลตามปกติ
const askOrFail = RunnableLambda.from(async (q: string): Promise<string> => {
  if (q.includes("(ทดสอบล้ม)")) throw new Error("ข้อนี้ตั้งใจให้ล้ม");
  return (await model.invoke(q)).text;
});

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ countResults ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (countResults(["ก", new Error("x")]) === undefined) {
    console.log("👉 ยังไม่ได้เติม countResults (ดูบรรทัดที่มี 👉)");
    return;
  }

  // อาร์กิวเมนต์ที่ 2 คือ config (maxConcurrency) อาร์กิวเมนต์ที่ 3 คือ batchOptions (returnExceptions)
  const results = await askOrFail.batch(QUESTIONS, { maxConcurrency: 2 }, { returnExceptions: true });
  results.forEach((r, i) => {
    console.log(r instanceof Error ? `ข้อ ${i + 1}: ล้มเหลว (${r.message})` : `ข้อ ${i + 1}: สำเร็จ`);
  });
  const counts = countResults(results);
  console.log(`สำเร็จ ${counts?.ok} ล้มเหลว ${counts?.failed}`);
}
