// บท 012: อ่าน error ของ ChatGoogle ให้ออก
// ขั้นที่ 1 ลองอ่าน error ปลอม 4 ตัว ไม่ยิงเน็ต ขั้นที่ 2 ทำให้เกิด error จริงทีละแบบ แล้วจับด้วย try/catch (ทุกกรณีจบด้วย exit 0)
// รัน: pnpm lesson 012 example.google
import { ChatGoogle } from "@langchain/google";
import { env } from "../../src/lib/env";

// error ที่มาจาก HTTP มักมีเลข status ใน status_code หรือ status (ชื่อฟิลด์ขึ้นกับไลบรารี) ถ้าไม่มีคืน undefined
function statusOf(e: unknown): number | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const fields = e as Record<string, unknown>;
  const status = fields.status_code ?? fields.status;
  return typeof status === "number" ? status : undefined;
}

function nameOf(e: unknown): string {
  return e instanceof Error ? e.name : typeof e;
}

// อธิบาย error ให้คนอ่านรู้ว่าต้องแก้อะไร: ดูเลข status ก่อน ถ้าไม่มีให้ดูชนิดของ error
function explainError(e: unknown): string {
  const status = statusOf(e);
  if (status === 404) return "ไม่พบโมเดล (ชื่อโมเดลผิด หรือรุ่นนี้ใช้ไม่ได้กับ key นี้)";
  if (status === 401) return "key ผิดหรือหมดอายุ";
  if (status === 429) return "เรียกถี่เกินหรือโควต้าหมด (ดูบท 013)";
  if (e instanceof TypeError) return "ต่อ provider ไม่ได้ (Ollama ยังไม่เปิด หรือ URL ผิด)";
  return "ไม่รู้จัก error นี้ ดูข้อความและ stack trace";
}

function errorWithStatus(status: number): unknown {
  return Object.assign(new Error(`HTTP ${status}`), { status_code: status });
}

function makeModel(overrides: { model?: string; apiKey?: string }): ChatGoogle {
  return new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY"), ...overrides });
}

// รันสถานการณ์หนึ่ง: ถ้าได้คำตอบพิมพ์คำตอบ ถ้า error พิมพ์รายละเอียด 4 บรรทัด (เยื้อง 2 ช่อง)
async function scenario(n: number, title: string, run: () => Promise<string>): Promise<void> {
  console.log(`สถานการณ์ ${n}: ${title}`);
  try {
    console.log(`  คำตอบ: ${(await run()).replace(/\s+/g, " ").trim()}`);
  } catch (e) {
    console.log(`  ชนิด: ${nameOf(e)}`);
    console.log(`  status: ${statusOf(e) ?? "-"}`);
    // e.message อาจยาวหลายบรรทัด เอาบรรทัดแรกพอ
    console.log(`  ข้อความ: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
    console.log(`  อธิบาย: ${explainError(e)}`);
  }
}

export async function main(): Promise<void> {
  // ขั้นที่ 1: ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
  console.log("--- ขั้นที่ 1: อ่าน error ให้ออก (error ปลอม) ---");
  const fakes = [new TypeError("fetch failed"), errorWithStatus(404), errorWithStatus(401), errorWithStatus(429)];
  for (const e of fakes) {
    const status = statusOf(e);
    const label = status === undefined ? `${nameOf(e)}: ${(e as Error).message}` : `status ${status}`;
    console.log(`${label} → ${explainError(e)}`);
  }

  // ขั้นที่ 2: ทำให้เกิด error จริง ผลเปลี่ยนตามเครื่องและ provider ที่ใช้
  console.log("--- ขั้นที่ 2: เจอ error จริง ---");
  await scenario(1, "ชื่อโมเดลผิด", async () => {
    return (await makeModel({ model: env("GOOGLE_MODEL") + "-not-real" }).invoke("สวัสดี")).text;
  });
  await scenario(2, "key ผิด", async () => {
    return (await makeModel({ apiKey: "wrong-key-for-lesson-012" }).invoke("สวัสดี")).text;
  });
  await scenario(3, "ตั้งค่าถูกต้อง", async () => {
    return (await makeModel({}).invoke("ตอบสั้นๆ ว่า สวัสดี")).text;
  });
}
