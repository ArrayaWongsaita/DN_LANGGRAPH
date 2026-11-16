// บท 012: อ่าน error ของ ChatOllama ให้ออก
// ขั้นที่ 1 ลองอ่าน error ปลอม 4 ตัว ไม่ยิงเน็ต ขั้นที่ 2 ทำให้เกิด error จริงทีละแบบ แล้วจับด้วย try/catch (ทุกกรณีจบด้วย exit 0)
// รัน: pnpm lesson 012 example.ollama
import { ChatOllama } from "@langchain/ollama";
import { env, isOllamaCloudDirect, optionalEnv } from "../../src/lib/env";

// error จาก Ollama ที่มาจาก HTTP จะมีเลข status ใน status_code (ไลบรารีอื่นอาจใช้ status) ถ้าไม่มีคืน undefined
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
  if (status === 404) return "ไม่พบโมเดล (ชื่อโมเดลผิด หรือยังไม่ได้ pull)";
  if (status === 401) return "key ผิดหรือหมดอายุ";
  if (status === 429) return "เรียกถี่เกินหรือโควต้าหมด (ดูบท 013)";
  if (e instanceof TypeError) return "ต่อ provider ไม่ได้ (Ollama ยังไม่เปิด หรือ URL ผิด)";
  return "ไม่รู้จัก error นี้ ดูข้อความและ stack trace";
}

function errorWithStatus(status: number): unknown {
  return Object.assign(new Error(`HTTP ${status}`), { status_code: status });
}

const apiKey = optionalEnv("OLLAMA_API_KEY");

function makeModel(overrides: { baseUrl?: string; model?: string; headers?: Record<string, string> }): ChatOllama {
  return new ChatOllama({
    model: env("OLLAMA_MODEL"),
    baseUrl: env("OLLAMA_BASE_URL"),
    headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
    ...overrides,
  });
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
  await scenario(1, "ต่อ Ollama ไม่ได้", async () => {
    // พอร์ต 9 ไม่มีใครเปิดรอรับ จึงต่อไม่ติด
    return (await makeModel({ baseUrl: "http://127.0.0.1:9" }).invoke("สวัสดี")).text;
  });
  await scenario(2, "ชื่อโมเดลผิด", async () => {
    return (await makeModel({ model: env("OLLAMA_MODEL") + "-not-real" }).invoke("สวัสดี")).text;
  });
  if (isOllamaCloudDirect(env("OLLAMA_BASE_URL"))) {
    await scenario(3, "key ผิด", async () => {
      return (await makeModel({ headers: { Authorization: "Bearer wrong-key-for-lesson-012" } }).invoke("สวัสดี")).text;
    });
  } else {
    console.log("สถานการณ์ 3: key ผิด");
    console.log("  ข้าม: ทดลองได้เฉพาะตอนต่อ Ollama Cloud ตรง (OLLAMA_BASE_URL=https://ollama.com)");
  }
  await scenario(4, "ตั้งค่าถูกต้อง", async () => {
    return (await makeModel({}).invoke("ตอบสั้นๆ ว่า สวัสดี")).text;
  });
}
