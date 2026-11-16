// เฉลยแบบฝึกหัด 2: ตัดประวัติให้สั้นลงก่อนส่งให้โมเดล
//
// โจทย์: เติม trimHistory(history, max) ให้คืนอาร์เรย์ใหม่ที่เป็น system (ตัวแรกของ history) ตามด้วย max ข้อความล่าสุดของส่วนที่ไม่ใช่ system
// ถ้าข้อความแรกที่เหลืออยู่เป็นของผู้ช่วย (ai) ให้ตัดทิ้งด้วย (บาง provider ไม่รับประวัติที่ขึ้นต้นด้วยคำตอบของผู้ช่วย)
// ไฟล์ส่งเฉพาะผลของ trimHistory ไปให้โมเดล แต่ history ของไฟล์ยังเก็บครบทุกข้อความ และพิมพ์
//   (ส่งไป N ข้อความ)
// ก่อนคำตอบของทุกตา (N นับ system ด้วย) ไฟล์ใช้ max เท่ากับ 4
// รัน: pnpm lesson 016 exercise-2.ollama

import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { ask } from "../../src/lib/ask";
import { env, optionalEnv } from "../../src/lib/env";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ร้านขายกาแฟและอุปกรณ์ชงกาแฟออนไลน์ ตอบภาษาไทย สั้น สุภาพ";
const MAX = 4;

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function trimHistory(history: BaseMessage[], max: number): BaseMessage[] {
  // เฉลยจุดที่ 1: แยก system (ตัวแรก) ออกก่อน แล้วเลือก max ข้อความท้ายสุดของส่วนที่เหลือด้วย slice(-max)
  // system ต้องอยู่ครบเสมอ ไม่งั้นโมเดลลืมบทบาทของตัวเอง
  const [system, ...rest] = history;
  const recent = rest.slice(-max);
  // เฉลยจุดที่ 2: ถ้าตัดแล้วข้อความแรกเป็น ai (เหลือแต่คำตอบโดยไม่มีคำถามนำ) ให้ทิ้ง เพราะบาง provider ไม่รับประวัติแบบนี้
  // ผลคือบางตาได้ max - 1 ข้อความ (จึงเห็น [2, 4, 4, 4] ไม่ใช่ 5)
  if (recent[0]?.type === "ai") recent.shift();
  return [system, ...recent];
}

export async function main(): Promise<void> {
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
