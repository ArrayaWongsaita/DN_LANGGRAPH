// บท 016 ⭐: แชทบอทร้าน DN Shop ตัวแรกใน terminal จำบทสนทนาได้ และตอบทีละส่วนด้วย stream
// ขั้นที่ 1 ทดลองด้วยโมเดลปลอมว่า "ไม่ส่งประวัติ" กับ "ส่งประวัติ" ต่างกันอย่างไร ขั้นที่ 2 คือแชทบอทจริง พิมพ์ จบ เพื่อออก
// รัน: pnpm lesson 016 example.google
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { ask } from "../../src/lib/ask";
import { env } from "../../src/lib/env";

const SYSTEM = "คุณคือผู้ช่วยร้าน DN Shop ร้านขายกาแฟและอุปกรณ์ชงกาแฟออนไลน์ ตอบภาษาไทย สั้น สุภาพ";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

// โมเดลปลอม: "จำ" ได้เฉพาะสิ่งที่อยู่ใน messages ที่ส่งมา หาชื่อจากข้อความก่อนข้อความสุดท้ายเท่านั้น
// (ข้อความสุดท้ายคือคำถามปัจจุบัน ถ้าไม่ตัดออก "ฉันชื่ออะไร" จะถูกจับเป็นชื่อ "อะไร")
function fakeModel(messages: BaseMessage[]): string {
  for (const m of messages.slice(0, -1)) {
    const found = /ฉันชื่อ(\S+)/.exec(m.text);
    if (found) return `คุณชื่อ${found[1]}ครับ`;
  }
  return "ไม่ทราบชื่อครับ";
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: ไม่ส่งประวัติ vs ส่งประวัติ (โมเดลปลอม) ---");
  const without = [new HumanMessage("ฉันชื่ออะไร")];
  console.log(`ไม่ส่งประวัติ: ส่งไป ${without.length} ข้อความ → ${fakeModel(without)}`);
  const withHistory = [new HumanMessage("ฉันชื่อสมชาย"), new AIMessage("ยินดีที่ได้รู้จักครับ"), new HumanMessage("ฉันชื่ออะไร")];
  console.log(`ส่งประวัติ: ส่งไป ${withHistory.length} ข้อความ → ${fakeModel(withHistory)}`);

  // ขั้นที่ 2: แชทบอทจริง
  console.log("--- ขั้นที่ 2: แชทบอท DN Shop (พิมพ์ จบ เพื่อออก) ---");
  // history คือสิ่งที่โมเดลจะเห็นทุกครั้ง เริ่มด้วย system แล้วต่อท้ายด้วยทุกตาของทั้งคนและผู้ช่วย
  const history: BaseMessage[] = [new SystemMessage(SYSTEM)];
  while (true) {
    const line = await ask("คุณ: ");
    // null คือ input หมด (เช่นกด Ctrl+D) ถือว่าจบเหมือนพิมพ์ จบ
    if (line === null || line === "จบ") break;
    // กด Enter เปล่าๆ: ถามใหม่ ไม่ส่งข้อความว่างให้โมเดล
    if (line === "") continue;

    history.push(new HumanMessage(line));
    process.stdout.write("ผู้ช่วย: ");
    let reply = "";
    for await (const chunk of await model.stream(history)) {
      process.stdout.write(chunk.text);
      reply += chunk.text;
    }
    process.stdout.write("\n");
    // เก็บคำตอบเต็มลงประวัติ ตาหน้าโมเดลจะได้เห็นว่าตัวเองเคยตอบอะไร
    history.push(new AIMessage(reply));
  }
  console.log("ลาก่อนครับ");
  console.log(`จำนวนข้อความในประวัติ: ${history.length}`);
}
