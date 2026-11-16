// แบบฝึกหัด 2: คำถามยาวขึ้น token ขาเข้าเพิ่มจริงไหม
//
// โจทย์: เขียนคำถามยาว 200 ตัวอักษรขึ้นไป แล้วถามโมเดลทั้งคำถามสั้นและคำถามยาว พิมพ์ 3 บรรทัด
//   คำถามสั้น: ขาเข้า N token
//   คำถามยาว: ขาเข้า M token
//   ต่างกัน: D token   (D = M - N)
//
// แนวทาง:
// 1. คำถามสั้นให้ไว้แล้ว (SHORT_QUESTION) ส่วนคำถามยาวเขียนเอง จะเป็นเรื่องอะไรก็ได้ที่ยาวพอ
// 2. จุด 👉: คืนข้อความยาว 200 ตัวอักษรขึ้นไป (ใช้ .repeat() ต่อข้อความสั้นๆ ซ้ำก็ได้)
// 3. ตอนนี้ longQuestion คืน "" เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 008 exercise-2.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const SHORT_QUESTION = "ร้านเปิดกี่โมง";

const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });

function longQuestion(): string {
  // 👉 คืนคำถามยาว 200 ตัวอักษรขึ้นไป (แทนบรรทัด return "")
  return "";
}

// ถามแล้วคืนจำนวน token ขาเข้าจาก usage_metadata
async function inputTokens(question: string): Promise<number> {
  const res = await model.invoke(question);
  return res.usage_metadata?.input_tokens ?? 0;
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ยังไม่มีคำถามยาว (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  const long = longQuestion();
  if (long === "") {
    console.log("👉 ยังไม่ได้เติม longQuestion (ดูบรรทัดที่มี 👉)");
    return;
  }
  if ([...long].length < 200) {
    console.log(`👉 longQuestion ต้องยาว 200 ตัวอักษรขึ้นไป (ตอนนี้ ${[...long].length})`);
    return;
  }

  const shortTokens = await inputTokens(SHORT_QUESTION);
  const longTokens = await inputTokens(long);
  console.log(`คำถามสั้น: ขาเข้า ${shortTokens} token`);
  console.log(`คำถามยาว: ขาเข้า ${longTokens} token`);
  console.log(`ต่างกัน: ${longTokens - shortTokens} token`);
}
