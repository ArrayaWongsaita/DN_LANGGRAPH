import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const STEP1 = "--- ขั้นที่ 1: for await กับ stream ปลอม ---";
const STEP2 = "--- ขั้นที่ 2: stream จากโมเดลจริง ---";
const STEP1_LINES = ["ร้าน|เปิด|ทุก|วัน", "ได้ 4 ชิ้น รวมเป็น: ร้านเปิดทุกวัน"];

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");

// อ่านตัวเลขของบรรทัด "<หัวข้อ>: N" (ต้องเป็นจำนวนเต็มล้วน ไม่รับ undefined/NaN)
function numberAfter(out: string, heading: string, unit: string, label: string): number {
  const m = expectMatches(out, new RegExp(`^${heading}: (\\d+)${unit}$`, "m"), `${label} (${heading})`);
  return Number(m[1]);
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const step1 = linesOf(extractSection(out, STEP1, STEP2, label));
    if (step1.join("\n") !== STEP1_LINES.join("\n")) throw new CheckFailure(`${label}: ผลขั้นที่ 1 ไม่ตรงกับที่ต้องได้\n${step1.join("\n")}`);
    const pieces = numberAfter(out, "ชิ้นที่มีข้อความ", "", label);
    if (pieces < 2) throw new CheckFailure(`${label}: ชิ้นที่มีข้อความต้องมีอย่างน้อย 2 ชิ้น (ได้ ${pieces}) ถ้าได้ชิ้นเดียวแปลว่าไม่ได้ stream`);
    const chars = numberAfter(out, "ความยาวรวม", " ตัวอักษร", label);
    if (chars <= 0) throw new CheckFailure(`${label}: ความยาวรวมต้องมากกว่า 0`);
    // ข้อความที่ stream ออกมา (ระหว่างหัวข้อขั้นที่ 2 ถึงบรรทัดนับชิ้น) ต้องไม่ว่างและเป็นไทย
    const streamed = extractSection(out, STEP2, "ชิ้นที่มีข้อความ:", label);
    if (/^(undefined|null)$/.test(streamed)) throw new CheckFailure(`${label}: ข้อความที่ stream เป็นค่า ${streamed}`);
    expectThai(streamed, `${label} (ข้อความที่ stream)`);
    expectMatches(out, /^หยุดกลางทาง หลังได้ 3 ชิ้น$/m, `${label} (หยุดกลางทาง)`);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const n = numberAfter(out, "ได้ทั้งหมด", " ตัวอักษร", label);
    if (n <= 0) throw new CheckFailure(`${label}: ได้ทั้งหมดต้องมากกว่า 0`);
    expectMatches(out, /^ใช้เวลาถึงชิ้นแรก: \d+ ms$/m, `${label} (เวลาถึงชิ้นแรก)`);
    // ข้อความที่พิมพ์ระหว่าง stream (ก่อนบรรทัดสรุป) ต้องยาวเท่ากับที่ streamToText คืน
    // กันคืนค่าคงที่ หรือไม่เรียก onText
    const streamed = out.slice(0, out.indexOf("\nได้ทั้งหมด:")).trim();
    const printed = [...streamed].length;
    if (printed !== n) throw new CheckFailure(`${label}: ข้อความที่พิมพ์ระหว่าง stream ยาว ${printed} ตัวอักษร แต่ streamToText คืนข้อความยาว ${n} ตัวอักษร ต้องเท่ากัน`);
    expectThai(streamed, `${label} (ข้อความที่ stream)`);
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    expectMatches(out, /^ตรวจตัวอย่าง: 49 ตัว=false 50 ตัว=true$/m, `${label} (ตรวจตัวอย่าง shouldStop)`);
    const m = expectMatches(out, /^หยุดเมื่อได้ (\d+) ตัวอักษร \(ตั้งไว้ 50\)$/m, label);
    if (Number(m[1]) < 50) throw new CheckFailure(`${label}: หยุดเมื่อได้ ${m[1]} ตัวอักษร ซึ่งน้อยกว่า 50 (ต้องหยุดเมื่อถึง 50 ขึ้นไป)`);
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
