// เฉลยแบบฝึกหัด 1: อธิบาย error เป็นภาษาไทย
//
// โจทย์: เติม explainError ให้รับ error แล้วคืนข้อความภาษาไทยสั้นๆ ที่บอกว่าเกิดอะไรขึ้นและต้องแก้อะไร
// (แยกอย่างน้อย: ต่อ provider ไม่ได้ / ไม่พบโมเดล (404) / ที่เหลือ) ไฟล์จะทำให้เกิด error จริง 2 สถานการณ์ แล้วพิมพ์
//   สถานการณ์ N: <ชื่อ>
//     อธิบาย: <ข้อความของคุณ>
// รัน: pnpm lesson 012 exercise-1.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, optionalEnv } from "../../src/lib/env";

// error จาก HTTP มีเลข status ใน status_code หรือ status (อธิบายไว้ใน README) ถ้าไม่มีคืน undefined
function statusOf(e: unknown): number | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const fields = e as Record<string, unknown>;
  const status = fields.status_code ?? fields.status;
  return typeof status === "number" ? status : undefined;
}

const apiKey = optionalEnv("OLLAMA_API_KEY");

function makeModel(overrides: { baseUrl?: string; model?: string }): ChatOllama {
  return new ChatOllama({
    model: env("OLLAMA_MODEL"),
    baseUrl: env("OLLAMA_BASE_URL"),
    headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
    ...overrides,
  });
}

function explainError(e: unknown): string {
  // เฉลยจุดที่ 1: ดูเลข status ก่อน เพราะบอกสาเหตุได้ตรงกว่า แล้วค่อยดูชนิดของ error
  // TypeError ที่ไม่มี status คือต่อ provider ไม่ได้เลย (ยังไม่ถึงขั้นตอบกลับ) ส่วนที่เหลือคืนข้อความกลางๆ ให้ไปดู stack trace
  const status = statusOf(e);
  if (status === 404) return "ไม่พบโมเดล ตรวจชื่อโมเดลในไฟล์ .env ว่าสะกดถูกและใช้ได้จริง";
  if (status === 401) return "key ผิดหรือหมดอายุ ตรวจ key ในไฟล์ .env";
  if (status === 429) return "เรียกถี่เกินหรือโควต้าหมด รอสักครู่แล้วลองใหม่";
  if (e instanceof TypeError) return "ต่อ provider ไม่ได้ ตรวจว่า provider เปิดอยู่และ URL ถูกต้อง";
  return "ไม่รู้จัก error นี้ ดูข้อความและ stack trace";
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
  report(1, "ต่อ Ollama ไม่ได้", await catchError(makeModel({ baseUrl: "http://127.0.0.1:9" })));
  report(2, "ชื่อโมเดลผิด", await catchError(makeModel({ model: env("OLLAMA_MODEL") + "-not-real" })));
}
