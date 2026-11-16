import type { RunResult } from "./types";

export class CheckFailure extends Error {
  override name = "CheckFailure";
}

export function expectSuccess(run: RunResult): void {
  if (run.timedOut) throw new CheckFailure(`หมดเวลา (${Math.round(run.durationMs / 1000)} วินาที)`);
  if (run.exitCode !== 0) {
    const tail = run.stderr.split(/\r?\n/).filter((l) => l !== "").slice(-20).join("\n");
    throw new CheckFailure(`exit code ${String(run.exitCode)}\n${tail}`);
  }
}

export function expectIncludes(text: string, needle: string, label: string): void {
  if (!text.includes(needle)) throw new CheckFailure(`${label}: ไม่พบ "${needle}"`);
}

export function expectNotIncludes(text: string, needle: string | undefined, label: string): void {
  if (needle === undefined || needle === "") return;
  if (text.includes(needle)) throw new CheckFailure(`${label}: พบค่าที่ไม่ควรมี (ยาว ${needle.length} ตัวอักษร ไม่แสดงค่า)`);
}

export function expectMatches(text: string, pattern: RegExp, label: string): RegExpMatchArray {
  const m = pattern.exec(text);
  if (!m) throw new CheckFailure(`${label}: ไม่ตรงกับ ${String(pattern)}`);
  return m;
}

export function expectThai(text: string, label: string): void {
  if (!/[฀-๿]/.test(text)) throw new CheckFailure(`${label}: ไม่มีอักษรไทย`);
}

// คืนข้อความทั้งหมดหลัง marker ตัวแรก (ถึงท้าย stdout) ตัดช่องว่างหัวท้าย ใช้กับคำตอบ LLM ที่ขึ้นหลายบรรทัดได้
export function extractAfter(text: string, marker: string, label: string): string {
  const i = text.indexOf(marker);
  if (i < 0) throw new CheckFailure(`${label}: ไม่พบ "${marker}"`);
  return text.slice(i + marker.length).trim();
}

export interface Round { n: number; text: string; inputTokens: number; outputTokens: number }

// อ่านผลแบบ "ครั้งที่ N: <ข้อความ ขึ้นได้หลายบรรทัด>" ตามด้วยบรรทัด "(token A→B)"
export function extractRounds(text: string): Round[] {
  const re = /ครั้งที่ (\d+): ([\s\S]*?)\n\(token (\d+)→(\d+)\)/g;
  return [...text.matchAll(re)].map((m) => ({
    n: Number(m[1]), text: m[2].trim(), inputTokens: Number(m[3]), outputTokens: Number(m[4]),
  }));
}

export const SECRET_ENV_NAMES: readonly string[] = [
  "GOOGLE_API_KEY", "OLLAMA_API_KEY", "OPENCODE_API_KEY", "VERIFY_OLLAMA_CLOUD_API_KEY", "LANGSMITH_API_KEY",
];

// stdout/stderr ต้องไม่มีค่าของ key ที่ส่งให้ child ข้อความ error ไม่แสดงค่า
export function expectNoSecrets(run: RunResult, label: string): void {
  for (const name of SECRET_ENV_NAMES) {
    const value = run.env[name];
    if (value === undefined || value === "") continue;
    for (const [stream, text] of [["stdout", run.stdout], ["stderr", run.stderr]] as const) {
      if (text.includes(value)) throw new CheckFailure(`${label}: พบค่าของ ${name} ใน ${stream} (ไม่แสดงค่า)`);
    }
  }
}

// ข้อความหลัง start ตัวแรก ถึงก่อน end ตัวแรกที่อยู่หลังจากนั้น (end = null คือถึงท้าย) ตัดช่องว่างหัวท้าย
export function extractSection(text: string, start: string, end: string | null, label: string): string {
  const i = text.indexOf(start);
  if (i < 0) throw new CheckFailure(`${label}: ไม่พบ "${start}"`);
  const from = i + start.length;
  if (end === null) return text.slice(from).trim();
  const j = text.indexOf(end, from);
  if (j < 0) throw new CheckFailure(`${label}: ไม่พบ "${end}"`);
  return text.slice(from, j).trim();
}
