import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractAfter, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const STEP1 = "--- ขั้นที่ 1: ลองใหม่เมื่อเจอ 429 (การเรียกปลอม) ---";
const STEP2 = "--- ขั้นที่ 2: timeout และลองใหม่กับโมเดลจริง ---";
const STEP1_LINES = [
  "ครั้งที่ 1: ล้มเหลว (429) รอ 100 ms",
  "ครั้งที่ 2: ล้มเหลว (429) รอ 200 ms",
  "ครั้งที่ 3: สำเร็จ",
  "--- กรณี 401: ไม่ลองใหม่ ---",
  "ครั้งที่ 1: ล้มเหลว (401) หยุด เพราะลองใหม่ก็ไม่หาย",
];

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");

// ค่าที่หลุดจากโค้ด (ตัวแปรไม่มีค่า) ห้ามโผล่ในบรรทัดที่โปรแกรมพิมพ์เอง
function expectNoLeak(lines: string[], label: string): void {
  for (const l of lines) {
    if (/\b(undefined|null|NaN)\b/.test(l)) throw new CheckFailure(`${label}: บรรทัดมีค่าที่หลุดมา (undefined/null/NaN): ${l}`);
  }
}

function expectStep1(out: string, label: string): void {
  const got = linesOf(extractSection(out, STEP1, STEP2, label));
  if (got.join("\n") !== STEP1_LINES.join("\n")) {
    throw new CheckFailure(`${label}: ผลขั้นที่ 1 ไม่ตรงกับที่ต้องได้\n${got.join("\n")}`);
  }
}

// ลำดับ: บรรทัดล้มเหลว ต้องมาก่อนบรรทัดสำเร็จ และก่อนคำตอบ
function expectOrder(lines: string[], wanted: string[], label: string): void {
  let from = 0;
  for (const w of wanted) {
    const i = lines.indexOf(w, from);
    if (i < 0) throw new CheckFailure(`${label}: ไม่พบบรรทัด "${w}" (หรืออยู่ผิดลำดับ)`);
    from = i + 1;
  }
}

function expectAnswer(text: string, label: string): void {
  const answer = extractAfter(text, "คำตอบ:", label).replace(/\s+/g, " ").trim();
  if (answer === "" || /^(undefined|null)$/.test(answer)) throw new CheckFailure(`${label}: คำตอบว่างหรือเป็น ${answer || "ค่าว่าง"}`);
  expectThai(answer, `${label} (คำตอบ)`);
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    expectStep1(out, label);
    const s2 = extractSection(out, STEP2, null, label);
    expectOrder(linesOf(s2), ["ครั้งที่ 1: ล้มเหลว (TimeoutError)", "ครั้งที่ 2: สำเร็จ"], label);
    expectAnswer(s2, label);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const lines = linesOf(run.stdout);
    expectNoLeak(lines.filter((l) => !l.startsWith("คำตอบ:")), label);
    expectOrder(
      lines,
      [
        "รอก่อนลองครั้งที่ 2: 500 ms",
        "รอก่อนลองครั้งที่ 3: 1000 ms",
        "รอก่อนลองครั้งที่ 4: 2000 ms",
        "รอก่อนลองครั้งที่ 5: 4000 ms",
        "รอก่อนลองครั้งที่ 6: 4000 ms",
        "ครั้งที่ 1: ล้มเหลว (TimeoutError) รอ 500 ms",
        "ครั้งที่ 2: สำเร็จ",
      ],
      label,
    );
    expectAnswer(norm(run.stdout), label);
  },
});

const exercise2 = (label: string, provider: "ollama" | "google"): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    let sumIn = 0;
    let sumOut = 0;
    for (const i of [1, 2, 3]) {
      const m = expectMatches(out, new RegExp(`^ข้อ ${i}: ขาเข้า (\\d+) ขาออก (\\d+)$`, "m"), `${label} (ข้อ ${i})`);
      const [n, o] = [Number(m[1]), Number(m[2])];
      if (n <= 0 || o <= 0) throw new CheckFailure(`${label}: ข้อ ${i} ต้องมี token ขาเข้าและขาออกมากกว่า 0 (ได้ ${n} และ ${o})`);
      sumIn += n;
      sumOut += o;
    }
    const t = expectMatches(out, /^รวมทั้งหมด: ขาเข้า (\d+) ขาออก (\d+) รวม (\d+)$/m, `${label} (รวมทั้งหมด)`);
    const [tin, tout, ttotal] = [Number(t[1]), Number(t[2]), Number(t[3])];
    if (tin !== sumIn || tout !== sumOut) {
      throw new CheckFailure(`${label}: รวมทั้งหมด (ขาเข้า ${tin} ขาออก ${tout}) ไม่เท่าผลรวมของ 3 ข้อ (ขาเข้า ${sumIn} ขาออก ${sumOut})`);
    }
    if (ttotal !== tin + tout) throw new CheckFailure(`${label}: รวม ${ttotal} ไม่เท่ากับขาเข้า + ขาออก (${tin + tout})`);
    if (provider === "ollama" && run.usage !== null && (tin !== run.usage.input || tout !== run.usage.output)) {
      throw new CheckFailure(
        `${label}: ยอดรวมไม่ตรงกับ usage ที่วัดจากเครือข่าย (ได้ ${tin}/${tout} วัดได้ ${run.usage.input}/${run.usage.output})`,
      );
    }
  },
});

export default {
  "example.ollama": example("example.ollama"),
  "example.google": example("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama", "ollama"),
  "exercise-2.google": exercise2("exercise-2.google", "google"),
} satisfies Record<string, FileCheck>;
