// แบบฝึกหัด 1: คำสั่ง /ล้าง ล้างความจำของแชทบอท
//
// โจทย์: เติม handleCommand(line, history) ให้ถ้า line คือ "/ล้าง" ให้เหลือแค่ system message ใน history (ลบที่เหลือทิ้ง) แล้วคืน true
// ถ้าไม่ใช่คำสั่งให้คืน false โครง loop เหมือนตัวอย่าง ต่างที่เมื่อ handleCommand คืน true ไฟล์จะพิมพ์ ล้างประวัติแล้ว
// และถามคำถามถัดไปเลยโดยไม่ส่งอะไรให้โมเดล
//
// แนวทาง:
// 1. history เป็นอาร์เรย์ที่ main ถืออยู่ ต้องแก้อาร์เรย์เดิม (ไม่ใช่สร้างอาร์เรย์ใหม่) จึงจะเห็นผลนอกฟังก์ชัน
// 2. system อยู่ตำแหน่งแรกของ history เสมอ ค้นดูว่า JavaScript ทำให้อาร์เรย์เดิมสั้นลงได้อย่างไร (ดูลิงก์ MDN ใน README)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ handleCommand คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 016 exercise-1.ollama
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { ask } from "../../src/lib/ask";
import { env, optionalEnv } from "../../src/lib/env";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ร้านขายกาแฟและอุปกรณ์ชงกาแฟออนไลน์ ตอบภาษาไทย สั้น สุภาพ";

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function handleCommand(line: string, history: BaseMessage[]): boolean | undefined {
  void line; // บรรทัดนี้กัน lint เตือนว่าตัวแปร line ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ line
  void history; // เช่นเดียวกัน: ลบทิ้งเมื่อเริ่มใช้ history
  // 👉 ถ้า line คือ "/ล้าง" ให้เหลือแค่ system ใน history แล้วคืน true ไม่เช่นนั้นคืน false (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ handleCommand ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (handleCommand("/ล้าง", [new SystemMessage("ระบบ"), new HumanMessage("ทดสอบ")]) === undefined) {
    console.log("👉 ยังไม่ได้เติม handleCommand (ดูบรรทัดที่มี 👉)");
    return;
  }

  console.log("--- แชทบอท DN Shop (พิมพ์ จบ เพื่อออก พิมพ์ /ล้าง เพื่อลืมบทสนทนา) ---");
  const history: BaseMessage[] = [new SystemMessage(SYSTEM)];
  while (true) {
    const line = await ask("คุณ: ");
    if (line === null || line === "จบ") break;
    if (line === "") continue;
    if (handleCommand(line, history)) {
      console.log("ล้างประวัติแล้ว");
      continue;
    }

    history.push(new HumanMessage(line));
    process.stdout.write("ผู้ช่วย: ");
    let reply = "";
    for await (const chunk of await model.stream(history)) {
      process.stdout.write(chunk.text);
      reply += chunk.text;
    }
    process.stdout.write("\n");
    history.push(new AIMessage(reply));
  }
  console.log("ลาก่อนครับ");
  console.log(`จำนวนข้อความในประวัติ: ${history.length}`);
}
