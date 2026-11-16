import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractAfter } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

type Provider = "ollama" | "google";

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");

const example = (label: string, provider: Provider): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const lines = out.split("\n").map((l) => l.trimEnd());
    if (!lines.includes(".text: คืนได้ภายใน 7 วันครับ")) throw new CheckFailure(`${label}: ไม่พบบรรทัด ".text: คืนได้ภายใน 7 วันครับ"`);
    expectMatches(out, /^block: reasoning \(\d+ ตัวอักษร\)$/m, label);

    // ขั้นที่ 2: 2 ชุด แต่ละชุดมีบรรทัดสรุป (reasoning / เวลา / token) แล้วตามด้วยคำตอบที่เป็นไทย
    const stats: number[] = [];
    for (const n of [1, 2]) {
      const start = out.indexOf(`ชุดที่ ${n} (`);
      if (start < 0) throw new CheckFailure(`${label}: ไม่พบบรรทัด "ชุดที่ ${n} ("`);
      const rest = out.slice(start);
      const head = rest.slice(0, rest.indexOf("\n") < 0 ? rest.length : rest.indexOf("\n"));
      const m = expectMatches(head, /reasoning (\d+) ตัวอักษร · ใช้เวลา [\d.]+ วินาที · token ขาออก (\d+)$/, `${label} (ชุดที่ ${n})`);
      stats.push(Number(m[1]));
      const next = out.indexOf(`ชุดที่ ${n + 1} (`, start);
      const body = next < 0 ? rest : out.slice(start, next);
      expectThai(extractAfter(body, "คำตอบ: ", `${label} (ชุดที่ ${n})`), `${label} (ชุดที่ ${n})`);
    }
    if (provider === "ollama" && stats[0] <= 0) {
      throw new CheckFailure(`${label}: ชุดที่ 1 (think: true) ต้องมี reasoning มากกว่า 0 ตัวอักษร (ได้ ${stats[0]}) รุ่นที่เลือกอาจไม่รองรับการคิด`);
    }
  },
});

const exercise1 = (label: string, provider: Provider): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const m = expectMatches(out, /^ความคิด \(80 ตัวอักษรแรก\): (.*)$/m, label);
    const thought = m[1].replace(/[*`]/g, "").trim();
    if (provider === "ollama" && (thought === "" || /^(undefined|null)$/.test(thought))) {
      throw new CheckFailure(`${label}: ความคิดต้องไม่ว่าง (reasoningOf ต้องคืนข้อความของ block reasoning)`);
    }
    if (/^(undefined|null)$/.test(thought)) throw new CheckFailure(`${label}: ความคิดเป็น ${thought}`);
    expectThai(extractAfter(out, "คำตอบ: ", label), label);
  },
});

const exercise2 = (label: string, provider: Provider): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const [first, second] = provider === "ollama" ? ["false", "true"] : ["low", "high"];
    const key = provider === "ollama" ? "think" : "thinkingLevel";
    const a = out.indexOf(`→ ${key}: ${first}`);
    const b = out.indexOf(`→ ${key}: ${second}`);
    if (a < 0 || b < 0 || a > b) {
      throw new CheckFailure(`${label}: ต้องมี "→ ${key}: ${first}" ก่อน "→ ${key}: ${second}" (คำถามทักทายไม่ต้องคิด คำถามคำนวณต้องคิด)`);
    }
    // แต่ละข้อมีคำตอบที่เป็นไทย
    const blocks = out.split(/^คำถาม: /m).slice(1);
    if (blocks.length !== 2) throw new CheckFailure(`${label}: ต้องมี 2 ข้อ (บรรทัดที่ขึ้นต้น "คำถาม: ") ได้ ${blocks.length}`);
    blocks.forEach((block, i) => expectThai(extractAfter(block, "คำตอบ: ", `${label} (ข้อ ${i + 1})`), `${label} (ข้อ ${i + 1})`));
  },
});

export default {
  "example.ollama": example("example.ollama", "ollama"),
  "example.google": example("example.google", "google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama", "ollama"),
  "exercise-1.google": exercise1("exercise-1.google", "google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama", "ollama"),
  "exercise-2.google": exercise2("exercise-2.google", "google"),
} satisfies Record<string, FileCheck>;
