import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const STEP2 = "--- ขั้นที่ 2: เจอ error จริง ---";

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");

// ตัดข้อความของสถานการณ์ที่ n (ตั้งแต่ "สถานการณ์ n:" ถึงก่อนสถานการณ์ถัดไป หรือท้ายไฟล์)
function scenarioText(out: string, n: number, last: number, label: string): string {
  return extractSection(out, `สถานการณ์ ${n}:`, n < last ? `สถานการณ์ ${n + 1}:` : null, label);
}

// ส่วนของขั้นที่ 2 เท่านั้น (กันไปปนกับขั้นที่ 1)
function step2(out: string, label: string): string {
  return extractSection(out, STEP2, null, label);
}

function expectStep1(out: string, label: string): void {
  const lines = out.split("\n").map((l) => l.trimEnd());
  for (const prefix of ["TypeError: fetch failed →", "status 404 →", "status 401 →", "status 429 →"]) {
    if (!lines.some((l) => l.startsWith(prefix))) throw new CheckFailure(`${label}: ไม่พบบรรทัดของขั้นที่ 1 ที่ขึ้นต้นด้วย "${prefix}"`);
  }
}

// อ่านค่าหลังหัวข้อในบรรทัดเยื้อง 2 ช่อง เช่น "  ชนิด: TypeError" ตัด Markdown ออก
function field(text: string, name: string, label: string): string {
  const m = expectMatches(text, new RegExp(`^ {2}${name}: (.*)$`, "m"), label);
  return m[1].replace(/[*`]/g, "").trim();
}

function expectRealText(value: string, what: string, label: string): void {
  if (value === "" || /^(undefined|null)$/.test(value)) throw new CheckFailure(`${label}: ${what} ว่างหรือเป็น ${value || "ค่าว่าง"}`);
  expectThai(value, `${label} (${what})`);
}

const exampleOllama = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    expectStep1(out, label);
    const s2 = step2(out, label);
    const sc = [1, 2, 3, 4].map((n) => scenarioText(s2, n, 4, label));
    if (field(sc[0], "ชนิด", `${label} (สถานการณ์ 1)`) !== "TypeError") throw new CheckFailure(`${label}: สถานการณ์ 1 ต้องมี "ชนิด: TypeError"`);
    if (field(sc[1], "status", `${label} (สถานการณ์ 2)`) !== "404") throw new CheckFailure(`${label}: สถานการณ์ 2 ต้องมี "status: 404"`);
    if (!/^ {2}ข้าม: /m.test(sc[2]) && field(sc[2], "status", `${label} (สถานการณ์ 3)`) !== "401") {
      throw new CheckFailure(`${label}: สถานการณ์ 3 ต้องมี "ข้าม:" หรือ "status: 401"`);
    }
    expectRealText(field(sc[3], "คำตอบ", `${label} (สถานการณ์ 4)`), "สถานการณ์ 4 คำตอบ", label);
  },
});

const exampleGoogle = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    expectStep1(out, label);
    const s2 = step2(out, label);
    // ยังไม่ล็อกเลข status ของ Gemini จนกว่าจะทดสอบกับ key จริง (6b): ตรวจแค่ว่ามีบรรทัด ชนิด และ status
    for (const n of [1, 2]) {
      const text = scenarioText(s2, n, 3, label);
      field(text, "ชนิด", `${label} (สถานการณ์ ${n})`);
      field(text, "status", `${label} (สถานการณ์ ${n})`);
    }
    expectRealText(field(scenarioText(s2, 3, 3, label), "คำตอบ", `${label} (สถานการณ์ 3)`), "สถานการณ์ 3 คำตอบ", label);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    for (const n of [1, 2]) {
      expectRealText(field(scenarioText(out, n, 2, label), "อธิบาย", `${label} (สถานการณ์ ${n})`), `สถานการณ์ ${n} อธิบาย`, label);
    }
  },
});

const exercise2 = (label: string, expected: [string, string]): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    for (const n of [1, 2]) {
      const value = field(scenarioText(out, n, 2, label), "ควรลองใหม่", `${label} (สถานการณ์ ${n})`);
      if (value !== expected[n - 1]) {
        throw new CheckFailure(`${label}: สถานการณ์ ${n} ต้องได้ "ควรลองใหม่: ${expected[n - 1]}" (ได้ "${value}")`);
      }
    }
  },
});

export default {
  "example.ollama": exampleOllama("example.ollama"),
  "example.google": exampleGoogle("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama", ["ใช่", "ไม่ใช่"]),
  "exercise-2.google": exercise2("exercise-2.google", ["ไม่ใช่", "ไม่ใช่"]),
} satisfies Record<string, FileCheck>;
