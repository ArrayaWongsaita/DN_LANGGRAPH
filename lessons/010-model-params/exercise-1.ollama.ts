// เฉลยแบบฝึกหัด 1: ตรวจว่าคำตอบถูกตัดเพราะหมดโควต้า token หรือไม่
//
// โจทย์: เติม isCutOff ให้คืน true เมื่อ AIMessage ที่ได้มาถูกตัดเพราะถึงขีดจำกัดความยาว ไม่เช่นนั้นคืน false
// แล้วไฟล์จะถาม 2 ครั้ง (ครั้งแรกจำกัดที่ 20 token ครั้งที่สองไม่จำกัด) และพิมพ์ 2 บรรทัด
//   จำกัด 20: ถูกตัด
//   ไม่จำกัด: ครบ
// รัน: pnpm lesson 010 exercise-1.ollama
import { AIMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

const apiKey = optionalEnv("OLLAMA_API_KEY");

function makeModel(extra: { numPredict?: number }): ChatOllama {
  return new ChatOllama({
    model: env("OLLAMA_MODEL"),
    baseUrl: env("OLLAMA_BASE_URL"),
    headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
    ...extra,
  });
}

function isCutOff(msg: AIMessage): boolean {
  // เฉลยจุดที่ 1: เหตุที่โมเดลหยุดอยู่ใน response_metadata.done_reason
  // "length" แปลว่าถึงขีดจำกัดความยาวจึงถูกตัด ส่วน "stop" แปลว่าตอบจบเอง จึงเทียบเฉพาะค่า "length"
  return msg.response_metadata.done_reason === "length";
}

export async function main(): Promise<void> {
  const limited = await makeModel({ numPredict: 20 }).invoke("อธิบายวิธีชงกาแฟดริปให้ละเอียดทุกขั้นตอน");
  console.log(`จำกัด 20: ${isCutOff(limited) ? "ถูกตัด" : "ครบ"}`);
  const free = await makeModel({}).invoke("ร้านกาแฟควรเปิดกี่โมง ตอบ 1 ประโยค");
  console.log(`ไม่จำกัด: ${isCutOff(free) ? "ถูกตัด" : "ครบ"}`);
}
