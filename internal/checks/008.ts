import {
  CheckFailure, expectIncludes, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractAfter, extractSection,
} from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

type Provider = "ollama" | "google";

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const STEP1 = "--- ขั้นที่ 1: อ่าน AIMessage ที่สร้างเอง ---";
const STEP2 = "--- ขั้นที่ 2: อ่าน AIMessage จากโมเดลจริง ---";

function num(text: string, pattern: RegExp, label: string): number {
  return Number(expectMatches(text, pattern, label)[1]);
}

const example = (label: string, provider: Provider): FileCheck => ({
  check: (run) => {
    common(run, label);
    // ขั้นที่ 1: ตรงทุกบรรทัด
    const step1 = extractSection(run.stdout, STEP1, "--- ขั้นที่ 2", label).split(/\r?\n/).map((l) => l.trimEnd()).join("\n");
    const expected = ["ขาเข้า: 12", "ขาออก: 3", "รวม: 15", `provider: ${provider}`, "block: text"].join("\n");
    if (step1 !== expected) throw new CheckFailure(`${label}: ขั้นที่ 1 ไม่ตรงกับที่ต้องได้\n${step1}`);

    // ขั้นที่ 2: อ่านเฉพาะส่วนก่อน "คำตอบ: " เพื่อไม่ให้ปนกับข้อความของโมเดล
    const head = extractSection(run.stdout, STEP2, "คำตอบ: ", label);
    const input = num(head, /ขาเข้า: (\d+)/, label);
    const output = num(head, /ขาออก: (\d+)/, label);
    const total = num(head, /รวม: (\d+)/, label);
    if (input <= 0 || output <= 0) throw new CheckFailure(`${label}: token ขาเข้า/ขาออกของขั้นที่ 2 ต้องมากกว่า 0 (ได้ ${input}/${output})`);
    if (total !== input + output) throw new CheckFailure(`${label}: รวม (${total}) ไม่เท่ากับขาเข้า + ขาออก (${input + output})`);
    expectIncludes(head, `provider: ${provider}`, label);
    expectIncludes(head, "block: text", label);
    expectMatches(head, /จบเพราะ: (?!undefined\b|null\b)\S+/, label);
    expectThai(extractAfter(run.stdout, "คำตอบ: ", label), label);
    if (provider === "ollama" && run.usage !== null) {
      if (input !== run.usage.input || output !== run.usage.output) {
        throw new CheckFailure(`${label}: token ไม่ตรงกับตัวนับของ verify (อ่านได้ ${input}/${output} ตัวนับ ${run.usage.input}/${run.usage.output})`);
      }
    }
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const input = num(run.stdout, /ขาเข้า: (\d+)\r?\n/, label);
    const output = num(run.stdout, /ขาออก: (\d+)\r?\n/, label);
    if (input <= 0 || output <= 0) throw new CheckFailure(`${label}: token ต้องมากกว่า 0 (ได้ ${input}/${output})`);
    const cost = num(run.stdout, /ค่าใช้จ่ายโดยประมาณ: ([\d.]+) ดอลลาร์/, label);
    const expected = (input * 0.3 + output * 2.5) / 1e6;
    if (Math.abs(cost - expected) > 0.000002) {
      throw new CheckFailure(`${label}: ค่าใช้จ่าย ${cost} ไม่ตรงกับที่คำนวณได้ ${expected.toFixed(6)}`);
    }
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const n = num(run.stdout, /คำถามสั้น: ขาเข้า (\d+) token/, label);
    const m = num(run.stdout, /คำถามยาว: ขาเข้า (\d+) token/, label);
    const d = num(run.stdout, /ต่างกัน: (-?\d+) token/, label);
    if (m <= n) throw new CheckFailure(`${label}: คำถามยาว (${m}) ต้องใช้ token มากกว่าคำถามสั้น (${n})`);
    if (d !== m - n) throw new CheckFailure(`${label}: ต่างกัน ${d} ไม่เท่ากับ ${m} - ${n}`);
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
