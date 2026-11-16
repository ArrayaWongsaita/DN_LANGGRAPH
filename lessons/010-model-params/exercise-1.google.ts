// แบบฝึกหัด 1: ตรวจว่าคำตอบถูกตัดเพราะหมดโควต้า token หรือไม่
//
// โจทย์: เติม isCutOff ให้คืน true เมื่อ AIMessage ที่ได้มาถูกตัดเพราะถึงขีดจำกัดความยาว ไม่เช่นนั้นคืน false
// แล้วไฟล์จะถาม 2 ครั้ง (ครั้งแรกจำกัดที่ 20 token ครั้งที่สองไม่จำกัด) และพิมพ์ 2 บรรทัด
//   จำกัด 20: ถูกตัด
//   ไม่จำกัด: ครบ
//
// แนวทาง:
// 1. บท 008 อ่านเหตุที่โมเดลหยุดจาก response_metadata ของ AIMessage (ชื่อฟิลด์อาจเป็นได้ 2 แบบ ดูตัวอย่างในบท 008 และ 010)
// 2. ค่าของเหตุที่หยุดมีหลายค่า ให้คืน true เฉพาะค่าที่แปลว่า "ถูกตัดเพราะถึงขีดจำกัดความยาว" (ดูหัวข้อ "จำกัดความยาว" ใน README บทนี้)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ isCutOff คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 010 exercise-1.google
import { AIMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

function makeModel(extra: { maxOutputTokens?: number }): ChatGoogle {
  return new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), ...extra });
}

function isCutOff(msg: AIMessage): boolean | undefined {
  void msg; // บรรทัดนี้กัน lint เตือนว่าตัวแปร msg ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ msg
  // 👉 คืน true เมื่อ msg ถูกตัดเพราะถึงขีดจำกัดความยาว ไม่เช่นนั้น false (แทนบรรทัด return undefined)
  return undefined;
}

export async function main(): Promise<void> {
  // บล็อกนี้ลองเรียก isCutOff กับ AIMessage ปลอมก่อน กันไม่ให้เรียกโมเดลทั้งที่ยังไม่ได้เติม (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const fake = new AIMessage({ content: "ทดสอบ", response_metadata: { finish_reason: "MAX_TOKENS" } });
  if (isCutOff(fake) === undefined) {
    console.log("👉 ยังไม่ได้เติม isCutOff (ดูบรรทัดที่มี 👉)");
    return;
  }

  const limited = await makeModel({ maxOutputTokens: 20 }).invoke("อธิบายวิธีชงกาแฟดริปให้ละเอียดทุกขั้นตอน");
  console.log(`จำกัด 20: ${isCutOff(limited) ? "ถูกตัด" : "ครบ"}`);
  const free = await makeModel({}).invoke("ร้านกาแฟควรเปิดกี่โมง ตอบ 1 ประโยค");
  console.log(`ไม่จำกัด: ${isCutOff(free) ? "ถูกตัด" : "ครบ"}`);
}
