// บท 013: โควต้าเต็ม (429) กับการลองใหม่ และการตั้ง timeout กับ ChatGoogle
// ขั้นที่ 1 เขียนฟังก์ชันลองใหม่แบบรอเพิ่มเท่าตัว ลองกับการเรียกปลอม ไม่ยิงเน็ต ขั้นที่ 2 ใช้ .withRetry() กับโมเดลจริง โดยบังคับให้ครั้งแรก timeout
// รัน: pnpm lesson 013 example.google
import { RunnableLambda } from "@langchain/core/runnables";
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

const QUESTION = "ร้านกาแฟควรเปิดกี่โมง ตอบ 1 ประโยค";

// ChatGoogle ลองใหม่เองโดยปริยาย (ลองซ้ำหลายรอบ) และไม่หยุดเมื่อเจอ TimeoutError จึงซ้อนกับ .withRetry() ของบทนี้
// และทำให้โปรแกรมค้างอยู่หลังได้คำตอบแล้ว ตั้ง maxRetries: 0 เพื่อให้ .withRetry() เป็นชั้นลองใหม่ชั้นเดียว
const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), maxRetries: 0 });

// error จาก HTTP มีเลข status ใน status_code หรือ status (เหมือนบท 012) ถ้าไม่มีคืน undefined
function statusOf(e: unknown): number | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const fields = e as Record<string, unknown>;
  const status = fields.status_code ?? fields.status;
  return typeof status === "number" ? status : undefined;
}

function nameOf(e: unknown): string {
  return e instanceof Error ? e.name : typeof e;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ลองเรียก fn ซ้ำเมื่อเจอ 429 หรือ 500 ขึ้นไป โดยรอ 100, 200, 400 ... ms ก่อนลองครั้งถัดไป
// maxRetries คือจำนวนครั้งที่ "ลองใหม่" ได้ (ไม่นับครั้งแรก) error อื่นๆ เช่น 401 โยนต่อทันที
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries: number, log: (line: string) => void): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const result = await fn();
      log(`ครั้งที่ ${attempt}: สำเร็จ`);
      return result;
    } catch (e) {
      const status = statusOf(e);
      const retryable = status === 429 || (status !== undefined && status >= 500);
      if (!retryable) {
        log(`ครั้งที่ ${attempt}: ล้มเหลว (${status ?? nameOf(e)}) หยุด เพราะลองใหม่ก็ไม่หาย`);
        throw e;
      }
      if (attempt > maxRetries) {
        log(`ครั้งที่ ${attempt}: ล้มเหลว (${status}) ลองครบแล้ว`);
        throw e;
      }
      const waitMs = 100 * 2 ** (attempt - 1);
      log(`ครั้งที่ ${attempt}: ล้มเหลว (${status}) รอ ${waitMs} ms`);
      await sleep(waitMs);
    }
  }
}

function errorWithStatus(status: number): Error {
  return Object.assign(new Error(`HTTP ${status}`), { status_code: status });
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: ลองใหม่เมื่อเจอ 429 (การเรียกปลอม) ---");
  let calls = 0;
  const flaky = (): Promise<string> => {
    calls += 1;
    // ล้มด้วย 429 สองครั้งแรก ครั้งที่ 3 สำเร็จ
    return calls <= 2 ? Promise.reject(errorWithStatus(429)) : Promise.resolve("ok");
  };
  await callWithRetry(flaky, 3, console.log);

  console.log("--- กรณี 401: ไม่ลองใหม่ ---");
  try {
    await callWithRetry(() => Promise.reject(errorWithStatus(401)), 3, console.log);
  } catch {
    // callWithRetry พิมพ์เหตุผลไปแล้ว ที่นี่แค่จับไม่ให้โปรแกรมล้ม
  }

  // ขั้นที่ 2: ยิงโมเดลจริง
  console.log("--- ขั้นที่ 2: timeout และลองใหม่กับโมเดลจริง ---");
  let round = 0;
  // RunnableLambda ห่อฟังก์ชันของเราให้ใช้ .withRetry() ได้ ฟังก์ชันนี้นับรอบเอง:
  // ครั้งแรกตั้ง timeout 1 ms เพื่อให้ล้มแน่ๆ ครั้งต่อไปให้ 60 วินาที
  // ใช้ .stream() ตามที่ README อธิบาย (ผลของ invoke + timeout ต่างกันตาม provider)
  const askOnce = RunnableLambda.from(async (q: string): Promise<string> => {
    round += 1;
    const timeout = round === 1 ? 1 : 60_000;
    let text = "";
    for await (const chunk of await model.stream(q, { timeout })) text += chunk.text;
    return text;
  });
  const askWithRetry = askOnce.withRetry({
    stopAfterAttempt: 3,
    onFailedAttempt: (e) => {
      console.log(`ครั้งที่ ${round}: ล้มเหลว (${nameOf(e)})`);
    },
  });
  const answer = await askWithRetry.invoke(QUESTION);
  console.log(`ครั้งที่ ${round}: สำเร็จ`);
  console.log(`คำตอบ: ${answer.replace(/\s+/g, " ").trim()}`);
}
