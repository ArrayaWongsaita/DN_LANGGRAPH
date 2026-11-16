// แบบฝึกหัด 2: ตัดประวัติให้สั้นลงก่อนส่งให้โมเดล
//
// โจทย์: เติม trimHistory(history, max) ให้คืนอาร์เรย์ใหม่ที่เป็น system (ตัวแรกของ history) ตามด้วย max ข้อความล่าสุดของส่วนที่ไม่ใช่ system
// ถ้าข้อความแรกที่เหลืออยู่เป็นของผู้ช่วย (ai) ให้ตัดทิ้งด้วย (บาง provider ไม่รับประวัติที่ขึ้นต้นด้วยคำตอบของผู้ช่วย)
// ไฟล์ส่งเฉพาะผลของ trimHistory ไปให้โมเดล แต่ history ของไฟล์ยังเก็บครบทุกข้อความ และพิมพ์
//   (ส่งไป N ข้อความ)
// ก่อนคำตอบของทุกตา (N นับ system ด้วย) ไฟล์ใช้ max เท่ากับ 4
//
// แนวทาง:
// 1. history[0] คือ system ข้อความที่เหลือเริ่มที่ตำแหน่ง 1 ส่วน slice กับเลขติดลบใช้เลือกข้อความท้ายสุดของอาร์เรย์ได้ (ดูลิงก์ MDN ใน README)
// 2. ข้อความ ai มี .type เป็น "ai" ดูตอนตรวจข้อความแรกที่เหลือ
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ trimHistory คืน history เดิมทั้งหมด (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 016 exercise-2.google
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { ask } from "../../src/lib/ask";
import { env } from "../../src/lib/env";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ร้านขายกาแฟและอุปกรณ์ชงกาแฟออนไลน์ ตอบภาษาไทย สั้น สุภาพ";
const MAX = 4;

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function trimHistory(history: BaseMessage[], max: number): BaseMessage[] {
  void max; // บรรทัดนี้กัน lint เตือนว่าตัวแปร max ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ max
  // 👉 คืน [system, ...max ข้อความล่าสุด] และตัดข้อความ ai ที่อยู่หน้าสุดของส่วนที่เหลือทิ้ง (แทนบรรทัด return history)
  return history;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ trimHistory ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const sample = [new SystemMessage("ระบบ"), new HumanMessage("1"), new AIMessage("2"), new HumanMessage("3"), new AIMessage("4"), new HumanMessage("5")];
  if (trimHistory(sample, MAX).length === sample.length) {
    console.log("👉 ยังไม่ได้เติม trimHistory (ดูบรรทัดที่มี 👉)");
    return;
  }

  console.log("--- แชทบอท DN Shop (พิมพ์ จบ เพื่อออก ส่งโมเดลสูงสุด 4 ข้อความล่าสุด) ---");
  const history: BaseMessage[] = [new SystemMessage(SYSTEM)];
  while (true) {
    const line = await ask("คุณ: ");
    if (line === null || line === "จบ") break;
    if (line === "") continue;

    history.push(new HumanMessage(line));
    // history เก็บครบทุกข้อความ ส่งโมเดลเฉพาะส่วนที่ตัดแล้ว
    const toSend = trimHistory(history, MAX);
    console.log(`(ส่งไป ${toSend.length} ข้อความ)`);
    // ตรวจรูปร่างของส่วนที่ตัด: ขึ้นต้นด้วย system, ต่อด้วย human และลงท้ายด้วยข้อความล่าสุดของ history
    if (toSend[0] !== history[0] || toSend[1]?.type !== "human" || toSend.at(-1) !== history.at(-1)) {
      console.log("(เตือน: trimHistory ต้องคืน system ตามด้วยข้อความล่าสุด โดยไม่ขึ้นต้นด้วยคำตอบของผู้ช่วย)");
    }
    process.stdout.write("ผู้ช่วย: ");
    let reply = "";
    for await (const chunk of await model.stream(toSend)) {
      process.stdout.write(chunk.text);
      reply += chunk.text;
    }
    process.stdout.write("\n");
    history.push(new AIMessage(reply));
  }
  console.log("ลาก่อนครับ");
  console.log(`จำนวนข้อความในประวัติ: ${history.length}`);
}
