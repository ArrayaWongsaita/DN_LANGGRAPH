// เฉลยแบบฝึกหัด 1: ตรวจว่าคำตอบถูกตัดเพราะหมดโควต้า token หรือไม่
//
// โจทย์: เติม isCutOff ให้คืน true เมื่อ AIMessage ที่ได้มาถูกตัดเพราะถึงขีดจำกัดความยาว ไม่เช่นนั้นคืน false
// แล้วไฟล์จะถาม 2 ครั้ง (ครั้งแรกจำกัดที่ 20 token ครั้งที่สองไม่จำกัด) และพิมพ์ 2 บรรทัด
//   จำกัด 20: ถูกตัด
//   ไม่จำกัด: ครบ
// รัน: pnpm lesson 010 exercise-1.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
import { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

function makeModel(extra: { maxOutputTokens?: number }): ChatGoogle {
  return new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), ...extra });
}

function isCutOff(msg: AIMessage): boolean {
  // เฉลยจุดที่ 1: ชื่อฟิลด์เหตุที่หยุดเป็นได้ 2 แบบ (finish_reason หรือ finishReason) จึงอ่านทั้งคู่
  // "MAX_TOKENS" แปลว่าถึงขีดจำกัดความยาวจึงถูกตัด ส่วน "STOP" แปลว่าตอบจบเอง
  const finish: unknown = msg.response_metadata.finish_reason ?? msg.response_metadata.finishReason;
  return finish === "MAX_TOKENS";
}

export async function main(): Promise<void> {
  const limited = await makeModel({ maxOutputTokens: 20 }).invoke("อธิบายวิธีชงกาแฟดริปให้ละเอียดทุกขั้นตอน");
  console.log(`จำกัด 20: ${isCutOff(limited) ? "ถูกตัด" : "ครบ"}`);
  const free = await makeModel({}).invoke("ร้านกาแฟควรเปิดกี่โมง ตอบ 1 ประโยค");
  console.log(`ไม่จำกัด: ${isCutOff(free) ? "ถูกตัด" : "ครบ"}`);
}
