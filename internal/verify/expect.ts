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
  if (text.includes(needle)) throw new CheckFailure(`${label}: ไม่ควรมี "${needle}"`);
}

export function expectMatches(text: string, pattern: RegExp, label: string): RegExpMatchArray {
  const m = pattern.exec(text);
  if (!m) throw new CheckFailure(`${label}: ไม่ตรงกับ ${String(pattern)}`);
  return m;
}

export function expectThai(text: string, label: string): void {
  if (!/[฀-๿]/.test(text)) throw new CheckFailure(`${label}: ไม่มีอักษรไทย`);
}
