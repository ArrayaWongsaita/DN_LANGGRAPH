import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const LABELS: readonly string[] = ["product", "order", "policy", "other"];
const SYSTEM = "แยกประเภทข้อความของลูกค้าร้าน DN Shop เป็น product, order, policy หรือ other";
const EXAMPLES: [string, string][] = [
  ["มีแก้วเก็บความเย็นไหม", "product"],
  ["ขอเลขพัสดุของคำสั่งซื้อ O1005", "order"],
  ["ค่าส่งต่างจังหวัดเท่าไร", "policy"],
  ["แนะนำหนังสนุกๆ หน่อย", "other"],
];
const FIRST_TEST = "เมล็ดกาแฟคั่วอ่อนมีรสเปรี้ยวไหม";
// คำตอบที่คาดของ TESTS (บท 019 example และ exercise-2) และ HARD_TESTS (exercise-1) ตามลำดับข้อ
const TESTS_EXPECTED = ["product", "order", "policy", "other", "order"];
const HARD_EXPECTED = ["order", "product", "policy", "order", "product"];
const STEP1 = "--- ขั้นที่ 1: ข้อความที่ส่งเมื่อมีตัวอย่าง ---";
const ZERO = "--- ขั้นที่ 2: ไม่มีตัวอย่าง (zero-shot) ---";
const FEW = "--- ขั้นที่ 2: มีตัวอย่าง (few-shot) ---";

const STEP1_LINES = [
  STEP1,
  `system: ${SYSTEM}`,
  ...EXAMPLES.flatMap(([text, label]) => [`user: ${text}`, `assistant: ${label}`]),
  `user: ${FIRST_TEST}`,
  "รวม 10 ข้อความ",
];

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");

interface Round { labels: string[]; formatOk: number; matched: number }

// อ่านผลของ 1 รอบ: ข้อ 1–5 ตามลำดับ แล้วเทียบ "รูปแบบถูก" และ "ตรงกับที่คาด" กับที่นับเองจากบรรทัดรายข้อ
export function parseRound(section: string, expected: string[], label: string): Round {
  const items = [...section.matchAll(/^ข้อ (\d+):[ \t]*(.*)$/gm)];
  if (items.map((m) => m[1]).join(",") !== "1,2,3,4,5") {
    throw new CheckFailure(`${label}: ต้องมีบรรทัด "ข้อ 1:" ถึง "ข้อ 5:" ตามลำดับ (ได้ ${items.map((m) => m[1]).join(",") || "ไม่มีเลย"})`);
  }
  const labels = items.map((m) => m[2].trim());
  const formatOk = labels.filter((l) => LABELS.includes(l)).length;
  const matched = labels.filter((l, i) => l === expected[i]).length;
  const y = expectMatches(section, /^รูปแบบถูก: (\d+)\/5$/m, `${label} (รูปแบบถูก: Y/5)`);
  const x = expectMatches(section, /^ตรงกับที่คาด: (\d+)\/5$/m, `${label} (ตรงกับที่คาด: X/5)`);
  if (Number(y[1]) !== formatOk) throw new CheckFailure(`${label}: รูปแบบถูก ${y[1]}/5 ไม่ตรงกับที่นับจากรายข้อ (${formatOk}/5)`);
  if (Number(x[1]) !== matched) throw new CheckFailure(`${label}: ตรงกับที่คาด ${x[1]}/5 ไม่ตรงกับที่นับจากรายข้อ (${matched}/5)`);
  return { labels, formatOk, matched };
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const step1 = linesOf(extractSection(out, STEP1, ZERO, `${label} (ขั้นที่ 1)`));
    const got = [STEP1, ...step1];
    if (got.join("\n") !== STEP1_LINES.join("\n")) throw new CheckFailure(`${label}: ผลขั้นที่ 1 ไม่ตรงกับที่ต้องได้\n${got.join("\n")}`);
    parseRound(extractSection(out, ZERO, FEW, label), TESTS_EXPECTED, `${label} (zero-shot)`);
    const few = parseRound(extractSection(out, FEW, null, label), TESTS_EXPECTED, `${label} (few-shot)`);
    if (few.formatOk !== 5) throw new CheckFailure(`${label}: few-shot ต้องได้รูปแบบถูก 5/5 (ได้ ${few.formatOk}/5)`);
    if (few.matched < 4) throw new CheckFailure(`${label}: few-shot ต้องตรงกับที่คาดอย่างน้อย 4/5 (ได้ ${few.matched}/5)`);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const n = expectMatches(out, /^ตัวอย่างทั้งหมด: (\d+) ข้อ$/m, `${label} (ตัวอย่างทั้งหมด: N ข้อ)`);
    if (Number(n[1]) < 6) throw new CheckFailure(`${label}: ต้องมีตัวอย่างทั้งหมดอย่างน้อย 6 ข้อ คือ 4 ข้อเดิมกับที่เพิ่มอย่างน้อย 2 ข้อ (ได้ ${n[1]})`);
    const copied = expectMatches(out, /^ตัวอย่างที่ซ้ำกับข้อสอบ: (\d+) ข้อ$/m, `${label} (ตัวอย่างที่ซ้ำกับข้อสอบ: M ข้อ)`);
    if (Number(copied[1]) !== 0) throw new CheckFailure(`${label}: ตัวอย่างที่เพิ่มซ้ำกับข้อสอบ ${copied[1]} ข้อ ต้องเป็น 0 (เขียนตัวอย่างของตัวเอง)`);
    const round = parseRound(out, HARD_EXPECTED, label);
    if (round.matched < 4) throw new CheckFailure(`${label}: ต้องตรงกับที่คาดอย่างน้อย 4/5 (ได้ ${round.matched}/5)`);
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const sample = expectMatches(out, /^ตรวจตัวอย่าง: (.*)$/m, `${label} (ตรวจตัวอย่าง)`)[1];
    if (/\b(undefined|null|NaN)\b/.test(sample)) throw new CheckFailure(`${label}: บรรทัด ตรวจตัวอย่าง มี undefined/null/NaN`);
    // ข้อความและป้ายของตัวอย่าง 2 ข้อแรก ต้องอยู่เรียงตามลำดับ และป้ายต้องอยู่หลังข้อความของข้อนั้น (ก่อนข้อถัดไป)
    const [first, second] = EXAMPLES;
    const i1 = sample.indexOf(first[0]);
    const i2 = sample.indexOf(second[0]);
    if (i1 < 0 || i2 < 0 || i2 < i1) throw new CheckFailure(`${label}: บรรทัด ตรวจตัวอย่าง ต้องมีข้อความของตัวอย่างทั้ง 2 ข้อเรียงตามลำดับ`);
    const seg1 = sample.slice(i1 + first[0].length, i2);
    const seg2 = sample.slice(i2 + second[0].length);
    if (!new RegExp(`(^|[^a-z])${first[1]}($|[^a-z])`).test(seg1)) throw new CheckFailure(`${label}: ไม่พบป้าย ${first[1]} ต่อท้ายข้อความของตัวอย่างที่ 1`);
    if (!new RegExp(`(^|[^a-z])${second[1]}($|[^a-z])`).test(seg2)) throw new CheckFailure(`${label}: ไม่พบป้าย ${second[1]} ต่อท้ายข้อความของตัวอย่างที่ 2`);
    const round = parseRound(out, TESTS_EXPECTED, label);
    if (round.formatOk < 4) throw new CheckFailure(`${label}: รูปแบบถูกต้องอย่างน้อย 4/5 (ได้ ${round.formatOk}/5)`);
    if (round.matched < 4) throw new CheckFailure(`${label}: ตรงกับที่คาดอย่างน้อย 4/5 (ได้ ${round.matched}/5)`);
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
