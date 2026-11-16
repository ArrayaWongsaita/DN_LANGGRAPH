// เฉลยแบบฝึกหัด 2: ตัดสินว่าควรลองเรียกใหม่หรือไม่
//
// โจทย์: เติม isRetryable ให้คืน true เมื่อ error น่าจะหายเองถ้าลองใหม่ (TypeError ต่อไม่ติด, status 429, หรือ status 500 ขึ้นไป)
// และ false เมื่อลองกี่ครั้งก็ไม่หาย (เช่น 404 ชื่อโมเดลผิด, 401 key ผิด) ไฟล์จะทำให้เกิด error จริง 2 สถานการณ์ และมีสถานการณ์ 3 เป็น error ปลอมที่มี status 429 (ไม่ยิงเน็ต) แล้วพิมพ์
//   สถานการณ์ N: <ชื่อ>
//     ควรลองใหม่: ใช่ หรือ ไม่ใช่
// รัน: pnpm lesson 012 exercise-2.google
// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง (เขียนตามรูปแบบใน example.google.ts)
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

function isRetryable(e: unknown): boolean {
  // เฉลยจุดที่ 1: ลองใหม่เฉพาะ error ที่มีโอกาสหายเอง คือต่อไม่ติดชั่วคราว (TypeError) ถูกจำกัดความถี่ (429) หรือฝั่งเซิร์ฟเวอร์พัง (500 ขึ้นไป)
  // 404 ชื่อโมเดลผิด และ 401 key ผิด ลองกี่ครั้งก็ไม่หาย ต้องแก้ที่ต้นเหตุ จึงไม่ลองใหม่
  if (e instanceof TypeError) return true;
  const status = statusOf(e);
  return status !== undefined && (status === 429 || status >= 500);
}

function report(n: number, title: string, e: unknown): void {
  console.log(`สถานการณ์ ${n}: ${title}`);
  console.log(`  ควรลองใหม่: ${isRetryable(e) ? "ใช่" : "ไม่ใช่"}`);
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
  report(1, "ชื่อโมเดลผิด", await catchError(makeModel({ model: env("GOOGLE_MODEL") + "-not-real" })));
  report(2, "key ผิด", await catchError(makeModel({ apiKey: "wrong-key-for-lesson-012" })));
  report(3, "error ปลอม (status_code 429)", Object.assign(new Error("fake"), { status_code: 429 }));
}
