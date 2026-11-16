import {
  CheckFailure, expectIncludes, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractAfter,
} from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

// คำตอบหลัง "คำตอบ: " ต้องเป็นไทยและยาว 20 ตัวอักษรขึ้นไป
function expectAnswer(run: RunResult, label: string): void {
  const answer = extractAfter(run.stdout, "คำตอบ: ", label);
  expectThai(answer, label);
  const length = [...answer].length;
  if (length < 20) throw new CheckFailure(`${label}: คำตอบสั้นเกินไป (${length} ตัวอักษร ต้อง 20 ขึ้นไป)`);
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    expectIncludes(run.stdout, ".text ของทั้งสองแบบ: สวัสดีครับ | สวัสดีครับ", label);
    expectAnswer(run, label);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    expectAnswer(run, label);
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    expectMatches(run.stdout, /ชนิดของ content: (string|array)/, label);
    const text = extractAfter(run.stdout, "text: ", label);
    expectThai(text, label);
  },
});

// ชื่อโมเดลที่พิมพ์ต้องเท่ากับค่าใน .env ของ provider ของไฟล์นั้น
const exercise3 = (label: string, envName: "OLLAMA_MODEL" | "GOOGLE_MODEL"): FileCheck => ({
  check: (run) => {
    common(run, label);
    const printed = expectMatches(run.stdout, /โมเดล: ([^\r\n]*)/, label)[1].trim();
    const expected = run.env[envName];
    if (expected === undefined || expected === "") throw new CheckFailure(`${label}: ไม่มีค่า ${envName} ใน env ของการรัน`);
    if (printed !== expected) throw new CheckFailure(`${label}: ชื่อโมเดลที่พิมพ์ไม่ตรงกับ ${envName} (พิมพ์ "${printed}")`);
    expectAnswer(run, label);
  },
});

export default {
  "example.ollama": example("example.ollama"),
  "example.google": example("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama"),
  "exercise-2.google": exercise2("exercise-2.google"),
  "exercise-3.ollama": exercise3("exercise-3.ollama", "OLLAMA_MODEL"),
  "exercise-3.google": exercise3("exercise-3.google", "GOOGLE_MODEL"),
} satisfies Record<string, FileCheck>;
