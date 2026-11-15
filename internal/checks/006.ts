import {
  CheckFailure, expectIncludes, expectMatches, expectNotIncludes, expectSuccess, expectThai, extractAfter, extractRounds,
} from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

// ทุกไฟล์: สำเร็จ และไม่พิมพ์ค่า key จริง (ทั้ง key ของ Google และ Ollama)
function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNotIncludes(run.stdout, run.env.GOOGLE_API_KEY, `${label} (ห้ามพิมพ์ค่า key)`);
  expectNotIncludes(run.stdout, run.env.OLLAMA_API_KEY, `${label} (ห้ามพิมพ์ค่า key)`);
}

function expectAnswer(run: RunResult, label: string): void {
  const answer = extractAfter(run.stdout, "คำตอบ: ", label);
  expectThai(answer, label);
  if ([...answer].length < 20) throw new CheckFailure(`${label}: คำตอบสั้นเกินไป (${[...answer].length} ตัวอักษร ต้อง 20 ขึ้นไป)`);
}

const example = (marker: string, label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    expectIncludes(run.stdout, marker, label);
    if (marker === "/api/chat") expectIncludes(run.stdout, '"stream": false', label);
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
    expectMatches(run.stdout, /token ขาเข้า: ([1-9]\d*)/, label);
    expectMatches(run.stdout, /token ขาออก: ([1-9]\d*)/, label);
  },
});

const exercise3 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const rounds = extractRounds(run.stdout);
    const order = rounds.map((r) => r.n).join(",");
    if (order !== "1,2,3") throw new CheckFailure(`${label}: ต้องมี "ครั้งที่ 1/2/3" ตามลำดับ แต่เจอ [${order}]`);
    for (const r of rounds) {
      if (r.text === "") throw new CheckFailure(`${label}: ครั้งที่ ${r.n} คำตอบว่าง`);
      expectThai(r.text, `${label} ครั้งที่ ${r.n}`);
      if (r.inputTokens <= 0 || r.outputTokens <= 0) throw new CheckFailure(`${label}: ครั้งที่ ${r.n} จำนวน token ต้องมากกว่า 0`);
    }
  },
});

export default {
  "example.ollama": example("/api/chat", "example.ollama"),
  "example.google": example(":generateContent", "example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama"),
  "exercise-2.google": exercise2("exercise-2.google"),
  "exercise-3.ollama": exercise3("exercise-3.ollama"),
  "exercise-3.google": exercise3("exercise-3.google"),
} satisfies Record<string, FileCheck>;
