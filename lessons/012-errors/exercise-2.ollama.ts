// แบบฝึกหัด 2: ตัดสินว่าควรลองเรียกใหม่หรือไม่
//
// โจทย์: เติม isRetryable ให้คืน true เมื่อ error น่าจะหายเองถ้าลองใหม่ (TypeError ต่อไม่ติด, status 429, หรือ status 500 ขึ้นไป)
// และ false เมื่อลองกี่ครั้งก็ไม่หาย (เช่น 404 ชื่อโมเดลผิด, 401 key ผิด) ไฟล์จะทำให้เกิด error จริง 2 สถานการณ์ แล้วพิมพ์
//   สถานการณ์ N: <ชื่อ>
//     ควรลองใหม่: ใช่ หรือ ไม่ใช่
//
// แนวทาง:
// 1. ใช้ statusOf (มีให้ในไฟล์) และ instanceof TypeError ตามที่เห็นใน example
// 2. ตัดสินใจจาก "ลองซ้ำแล้วมีโอกาสหายไหม" ไม่ใช่จากข้อความ error ว่าตรงกับอะไร (ดูหัวข้อ retry ใน README)
// 3. จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ isRetryable คืน undefined เสมอ (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 012 exercise-2.ollama
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

function isRetryable(e: unknown): boolean | undefined {
  void e; // บรรทัดนี้กัน lint เตือนว่าตัวแปร e ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้ e
  void statusOf; // บรรทัดนี้กัน lint เตือนว่า statusOf ยังไม่ได้ใช้ ลบทิ้งเมื่อเริ่มใช้
  // 👉 คืน true เมื่อควรลองใหม่ ไม่เช่นนั้น false (แทนบรรทัด return undefined)
  return undefined;
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
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ isRetryable ยังไม่ทำงาน (ไม่เสีย token) ลบทิ้งได้เมื่อเติมเสร็จ
  if (isRetryable(new TypeError("fetch failed")) === undefined) {
    console.log("👉 ยังไม่ได้เติม isRetryable (ดูบรรทัดที่มี 👉)");
    return;
  }

  report(1, "ต่อ Ollama ไม่ได้", await catchError(makeModel({ baseUrl: "http://127.0.0.1:9" })));
  report(2, "ชื่อโมเดลผิด", await catchError(makeModel({ model: env("OLLAMA_MODEL") + "-not-real" })));
}
