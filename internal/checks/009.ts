import {
  CheckFailure, expectIncludes, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractAfter, extractSection,
} from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const STEP1_LINES = [
  "--- ขั้นที่ 1: ข้อความ 3 บทบาท ---",
  "system: คุณคือพนักงานร้าน DN Shop ตอบสุภาพ สั้น ไม่เกิน 2 ประโยค",
  "human: ร้านมีบริการห่อของขวัญไหม",
  "ai: มีครับ ห่อฟรีทุกออร์เดอร์",
  'แบบย่อ {role: "user"} กลายเป็น: human',
];

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const stdout = run.stdout.replace(/\r\n/g, "\n");
    for (const line of STEP1_LINES) expectIncludes(stdout, `${line}\n`, label);
    const first = extractSection(stdout, "--- system แบบที่ 1: ตอบสั้น ---", "--- system แบบที่ 2: ตอบเป็นข้อ ---", label);
    const second = extractSection(stdout, "--- system แบบที่ 2: ตอบเป็นข้อ ---", null, label);
    expectThai(first, `${label} (system แบบที่ 1)`);
    expectThai(second, `${label} (system แบบที่ 2)`);
    const bullets = second.match(/^\s*([-*•]|\d+[.)])\s/gm)?.length ?? 0;
    if (bullets < 2) throw new CheckFailure(`${label}: คำตอบแบบที่ 2 ต้องเป็นข้อ อย่างน้อย 2 บรรทัด (เจอ ${bullets})`);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const answer = extractAfter(run.stdout, "คำตอบ: ", label);
    // ตัด Markdown (* และ `) ก่อน แล้วยอมรับช่วงราคา ~ ทศนิยม ตัวคั่นหลักพัน และ ฿
    const plain = answer.replace(/[*`]/g, "");
    expectMatches(plain, /สินค้า\s*:[^|\n]+\|\s*ราคา\s*:\s*฿?\s*~?\s*[\d,.]+(?:\s*[-–~]\s*฿?\s*[\d,.]+)?\s*(?:฿\s*)?บาท/, label);
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    expectIncludes(extractAfter(run.stdout, "คำตอบ: ", label), "ดีเอ็น", label);
  },
});

export default {
  "example.ollama": example("example.ollama"),
  "example.google": example("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama"),
  "exercise-2.google": exercise2("exercise-2.google"),
} satisfies Record<string, FileCheck>;
