// เฉลยแบบฝึกหัด 1: คำสั่ง /ล้าง ล้างความจำของแชทบอท
//
// โจทย์: เติม handleCommand(line, history) ให้ถ้า line คือ "/ล้าง" ให้เหลือแค่ system message ใน history (ลบที่เหลือทิ้ง) แล้วคืน true
// ถ้าไม่ใช่คำสั่งให้คืน false โครง loop เหมือนตัวอย่าง ต่างที่เมื่อ handleCommand คืน true ไฟล์จะพิมพ์ ล้างประวัติแล้ว
// และถามคำถามถัดไปเลยโดยไม่ส่งอะไรให้โมเดล
// รัน: pnpm lesson 016 exercise-1.ollama
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

function handleCommand(line: string, history: BaseMessage[]): boolean {
  if (line !== "/ล้าง") return false;
  // เฉลยจุดที่ 1: history.length = 1 ทำให้อาร์เรย์เดิมสั้นลงเหลือแค่ system (ตัวแรก) ต้องแก้อาร์เรย์ตัวเดิมที่ main ถืออยู่
  // ถ้า history = [history[0]] จะเป็นแค่การเปลี่ยนตัวแปรในฟังก์ชัน main มองไม่เห็นผล
  history.length = 1;
  return true;
}

export async function main(): Promise<void> {
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
