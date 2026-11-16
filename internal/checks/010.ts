import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

type Provider = "ollama" | "google";

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const STEP1_LINES = [
  "t=0.2: กาแฟ 99% | ชา 1% | โกโก้ 0%",
  "t=1: กาแฟ 63% | ชา 23% | โกโก้ 14%",
  "t=2: กาแฟ 48% | ชา 29% | โกโก้ 23%",
];

const example = (label: string, provider: Provider): FileCheck => ({
  check: (run) => {
    common(run, label);
    const lines = run.stdout.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd());
    // ขั้นที่ 1: ต้องมี 3 บรรทัด t=... ตรงทุกตัว และไม่มีบรรทัด t=... อื่น
    const tLines = lines.filter((l) => /^t=/.test(l));
    if (tLines.join("\n") !== STEP1_LINES.join("\n")) {
      throw new CheckFailure(`${label}: บรรทัด t=... ไม่ตรงกับที่ต้องได้\n${tLines.join("\n")}`);
    }
    // ขั้นที่ 2: 2 ชุด แต่ละชุดมี 3 คำตอบที่ไม่ว่าง และตัวเลข "ต่างกัน" ตรงกับจำนวนคำตอบที่ไม่ซ้ำ
    for (const n of [1, 2]) {
      const i = lines.findIndex((l) => l.startsWith(`ชุดที่ ${n} (`));
      if (i < 0) throw new CheckFailure(`${label}: ไม่พบบรรทัด "ชุดที่ ${n} ("`);
      const m = expectMatches(lines[i], /^ชุดที่ \d \([^)]+\): (.*)$/, label);
      const parts = m[1].split(" | ").map((p) => p.trim());
      if (parts.length !== 3 || parts.some((p) => p === "" || /^(undefined|null)$/.test(p))) {
        throw new CheckFailure(`${label}: ชุดที่ ${n} ต้องมี 3 คำตอบที่ไม่ว่าง (ได้ ${parts.length} ส่วน)\n${lines[i]}`);
      }
      const diff = expectMatches(lines[i + 1] ?? "", /^ต่างกัน: ([1-3]) แบบ จาก 3 ครั้ง$/, `${label} (ชุดที่ ${n})`);
      if (Number(diff[1]) !== new Set(parts).size) {
        throw new CheckFailure(`${label}: ชุดที่ ${n} ต่างกัน ${diff[1]} แบบ แต่นับจากคำตอบได้ ${new Set(parts).size}`);
      }
    }
    // จำกัดความยาว: เหตุที่หยุดต้องเป็นค่าของ provider นั้น และจำนวนตัวอักษรเป็นตัวเลข (0 ได้ เพราะโมเดลที่คิดก่อนตอบอาจใช้ token หมดกับความคิด)
    const reason = provider === "ollama" ? "length" : "MAX_TOKENS";
    if (!lines.includes(`จบเพราะ: ${reason}`)) throw new CheckFailure(`${label}: ไม่พบบรรทัด "จบเพราะ: ${reason}"`);
    expectMatches(run.stdout, /^ได้ข้อความ: \d+ ตัวอักษร$/m, label);
  },
});

// ตัดเครื่องหมาย Markdown (* และ `) แล้วย่อเป็นบรรทัดเดียว
const plain = (s: string): string => s.replace(/[*`]/g, "").replace(/\s+/g, " ").trim();

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const lines = run.stdout.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd());
    for (const line of ["จำกัด 20: ถูกตัด", "ไม่จำกัด: ครบ"]) {
      if (!lines.includes(line)) throw new CheckFailure(`${label}: ไม่พบบรรทัด "${line}"`);
    }
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const answers = new Map<number, string>();
    for (const m of run.stdout.replace(/\r\n/g, "\n").matchAll(/^ครั้งที่ (\d+): (.*)$/gm)) answers.set(Number(m[1]), plain(m[2]));
    for (const n of [1, 2, 3]) {
      const a = answers.get(n);
      if (a === undefined) throw new CheckFailure(`${label}: ไม่พบ "ครั้งที่ ${n}:"`);
      expectMatches(a, /เวลาเปิด\s*:\s*\d{1,2}[:.]\d{2}\s*[-–—]\s*\d{1,2}[:.]\d{2}/, `${label} (ครั้งที่ ${n})`);
    }
  },
});

export default {
  "example.ollama": example("example.ollama", "ollama"),
  "example.google": example("example.google", "google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama"),
  "exercise-2.google": exercise2("exercise-2.google"),
} satisfies Record<string, FileCheck>;
