// แบบฝึกหัด 1: อธิบาย error เป็นภาษาไทย
//
// โจทย์: เติม explainError ให้รับ error แล้วคืนข้อความภาษาไทยสั้นๆ ที่บอกว่าเกิดอะไรขึ้นและต้องแก้อะไร
// (แยกอย่างน้อย: ต่อ provider ไม่ได้ / ไม่พบโมเดล (404) / ที่เหลือ) ไฟล์จะทำให้เกิด error จริง 2 สถานการณ์ แล้วพิมพ์
//   สถานการณ์ N: <ชื่อ>
//     อธิบาย: <ข้อความของคุณ>
//
// แนวทาง:
// 1. ใน example ของบทนี้ explainError ดู 2 อย่างตามลำดับ: เลข status ก่อน แล้วชนิดของ error (ไฟล์นี้มี statusOf ให้ใช้แล้ว)
// 2. สถานการณ์ในไฟล์นี้เกิด error ชนิดอะไรและมี status หรือไม่ ลองรันดูผลโดยเปลี่ยนให้พิมพ์ e ตรงๆ ชั่วคราวก็ได้
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ explainError คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 012 exercise-1.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

// error จาก HTTP มีเลข status ใน status_code หรือ status (อธิบายไว้ใน README) ถ้าไม่มีคืน undefined
function statusOf(e: unknown): number | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const fields = e as Record<string, unknown>;
  const status = fields.status_code ?? fields.status;
  return typeof status === "number" ? status : undefined;
}

function makeModel(overrides: { model?: string; apiKey?: string }): ChatGoogle {
  return new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), ...overrides });
}

function explainError(e: unknown): string | undefined {
  void e; // บรรทัดนี้กัน lint เตือนว่าตัวแปร e ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ e
  void statusOf; // บรรทัดนี้กัน lint เตือนว่า statusOf ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้
  // 👉 คืนข้อความอธิบายภาษาไทยตามชนิดของ e (แทนบรรทัด return undefined)
  return undefined;
}

function report(n: number, title: string, e: unknown): void {
  console.log(`สถานการณ์ ${n}: ${title}`);
  console.log(`  อธิบาย: ${explainError(e)}`);
}

// ทำให้เกิด error จริง แล้วคืน error ที่จับได้ (ถ้าไม่เกิด error คืน undefined)
async function catchError(model: { invoke: (input: string) => Promise<unknown> }): Promise<unknown> {
  try {
    await model.invoke("สวัสดี");
    return undefined;
  } catch (e) {
    return e;
  }
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ explainError ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (explainError(new TypeError("fetch failed")) === undefined) {
    console.log("👉 ยังไม่ได้เติม explainError (ดูบรรทัดที่มี 👉)");
    return;
  }

  report(1, "ชื่อโมเดลผิด", await catchError(makeModel({ model: env("GOOGLE_MODEL") + "-not-real" })));
  report(2, "key ผิด", await catchError(makeModel({ apiKey: "wrong-key-for-lesson-012" })));
}
