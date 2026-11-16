import { CheckFailure, expectIncludes, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const STEP1 = "--- ขั้นที่ 1: ประกอบ system prompt จาก 4 ส่วน ---";
const STEP2 = "--- ขั้นที่ 2: คำถามเดิม มีและไม่มี system prompt ---";
const Q1_NO = "--- คำถามที่ 1 ไม่มี system prompt ---";
const Q1_YES = "--- คำถามที่ 1 มี system prompt ---";
const Q2_NO = "--- คำถามที่ 2 ไม่มี system prompt ---";
const Q2_YES = "--- คำถามที่ 2 มี system prompt ---";
const HEADINGS = ["## บทบาท", "## ขอบเขต", "## น้ำเสียง", "## สิ่งที่ห้ามตอบ"];
const OUT_OF_SCOPE = "[นอกขอบเขต]";
const REFUSE = "[ไม่ตอบ]";
// คำหลักท้าย marker: โมเดลบางครั้งพิมพ์ตัวอักษรหน้าคำเพี้ยน (เจอจริง: "[nอกขอบเขต]") จึงรับ [ตามด้วยอักษรสั้นๆ แล้วคำหลัก]
const OUT_OF_SCOPE_KEY = "ขอบเขต";
const REFUSE_KEY = "ตอบ";
const Q_FORBIDDEN = "--- คำถามที่ห้ามตอบ ---";
const Q_NORMAL = "--- คำถามปกติ ---";

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");

// คำตอบของโมเดลต้องไม่ว่าง ไม่ใช่ undefined/null ที่หลุดมาจากโค้ด และเป็นภาษาไทย
function expectAnswer(text: string, label: string): void {
  if (text === "" || /^(undefined|null)$/.test(text)) throw new CheckFailure(`${label}: คำตอบว่างหรือเป็น ${text || "ค่าว่าง"}`);
  expectThai(text, label);
}

// marker ครบตัวหรือเพี้ยนเล็กน้อย (วงเล็บเหลี่ยมที่ลงท้ายด้วยคำหลัก ไม่เกิน 8 ตัวอักษรนำหน้า)
function hasMarker(text: string, key: string): boolean {
  return new RegExp(`\\[[^\\]\\n]{0,8}${key}\\]`).test(text);
}

function expectNoLeak(text: string, label: string): void {
  if (/\b(undefined|null|NaN)\b/.test(text)) throw new CheckFailure(`${label}: พบ undefined/null/NaN หลุดมาในผลที่พิมพ์`);
}

// ส่วนที่ต่อจากหัวข้อ start ถึงก่อนหัวข้อถัดไปในรายการ (null = ถึงท้าย)
function answersBetween(out: string, headings: string[], label: string): string[] {
  return headings.map((h, i) => extractSection(out, h, headings[i + 1] ?? null, label));
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const step1 = extractSection(out, STEP1, STEP2, label);

    // หัวข้อ 4 ส่วนต้องมีครบและเรียงตามลำดับ
    let from = 0;
    for (const h of HEADINGS) {
      const i = step1.indexOf(h, from);
      if (i < 0) throw new CheckFailure(`${label}: ขั้นที่ 1 ไม่มีหัวข้อ "${h}" (หรือเรียงผิดลำดับ ต้องเป็น ${HEADINGS.join(", ")})`);
      from = i + h.length;
    }
    // แยกบรรทัดสุดท้าย (ความยาว) ออกจากตัว prompt
    const m = expectMatches(step1, /^([\s\S]*?)\n+ความยาว: (\d+) ตัวอักษร\s*$/, `${label} (ความยาว: N ตัวอักษร ต้องเป็นบรรทัดสุดท้ายของขั้นที่ 1)`);
    const prompt = m[1].trim();
    const items = prompt.split("\n").filter((l) => l.startsWith("- "));
    if (items.length !== 5) throw new CheckFailure(`${label}: ต้องมีบรรทัดที่ขึ้นต้นด้วย "- " 5 บรรทัด (ได้ ${items.length})`);
    if (Number(m[2]) !== [...prompt].length) {
      throw new CheckFailure(`${label}: ความยาวที่พิมพ์ (${m[2]}) ไม่ตรงกับจำนวนตัวอักษรของ prompt ที่พิมพ์ (${[...prompt].length})`);
    }
    expectNoLeak(step1, `${label} (ขั้นที่ 1)`);

    const step2 = extractSection(out, STEP2, null, label);
    const [q1No, q1Yes, q2No, q2Yes] = answersBetween(step2, [Q1_NO, Q1_YES, Q2_NO, Q2_YES], label);
    expectAnswer(q1No, `${label} (คำถามที่ 1 ไม่มี system)`);
    expectAnswer(q1Yes, `${label} (คำถามที่ 1 มี system)`);
    expectAnswer(q2No, `${label} (คำถามที่ 2 ไม่มี system)`);
    expectAnswer(q2Yes, `${label} (คำถามที่ 2 มี system)`);
    // คำถามนอกขอบเขตที่ส่ง system ไปด้วยต้องมี marker ส่วนที่ไม่ได้ส่ง system หรือเป็นคำถามในขอบเขตต้องไม่มี
    if (!hasMarker(q2Yes, OUT_OF_SCOPE_KEY)) throw new CheckFailure(`${label} (คำถามที่ 2 มี system): ไม่พบ "${OUT_OF_SCOPE}"`);
    for (const [name, text] of [["คำถามที่ 2 ไม่มี system", q2No], ["คำถามที่ 1 มี system", q1Yes]] as const) {
      if (hasMarker(text, OUT_OF_SCOPE_KEY)) throw new CheckFailure(`${label}: ${name} ต้องไม่มี ${OUT_OF_SCOPE}`);
    }
    expectIncludes(q1Yes, "ครับ", `${label} (คำถามที่ 1 มี system)`);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const m = expectMatches(out, /^กฎที่ห้าม: (\d+) ข้อ$/m, `${label} (กฎที่ห้าม: N ข้อ)`);
    if (Number(m[1]) < 1) throw new CheckFailure(`${label}: กฎที่ห้ามต้องมีอย่างน้อย 1 ข้อ (ได้ ${m[1]})`);
    const [forbidden, normal] = answersBetween(out, [Q_FORBIDDEN, Q_NORMAL], label);
    expectAnswer(forbidden, `${label} (คำถามที่ห้ามตอบ)`);
    expectAnswer(normal, `${label} (คำถามปกติ)`);
    if (!hasMarker(forbidden, REFUSE_KEY)) throw new CheckFailure(`${label} (คำถามที่ห้ามตอบ): ไม่พบ "${REFUSE}"`);
    if (hasMarker(normal, REFUSE_KEY)) throw new CheckFailure(`${label}: คำถามปกติต้องไม่มี ${REFUSE}`);
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const [a1, a2] = answersBetween(out, ["--- คำถามที่ 1 ---", "--- คำถามที่ 2 ---"], label);
    for (const [i, a] of [a1, a2].entries()) {
      expectAnswer(a, `${label} (คำตอบที่ ${i + 1})`);
      expectIncludes(a, "ขอบคุณที่อุดหนุน DN Shop", `${label} (คำตอบที่ ${i + 1})`);
    }
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
