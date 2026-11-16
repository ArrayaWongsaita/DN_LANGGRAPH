import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { duplicateNumbers, listLessons, runnableFiles } from "../../scripts/lib/lessons";
import { filesForProvider, runOnce } from "./runner";
import { addUsage } from "./usage";
import type { LessonChecks, TokenUsage, VerifyProvider } from "./types";

export interface VerifyOptions {
  root: string; // cwd ของ child (repo จริง เพราะ child เรียก scripts/run-cli.ts)
  lessonsDir: string; checksDir: string;
  provider: VerifyProvider; env: Record<string, string>;
  range: { lo: number; hi: number } | null;
  repeat: number; examplesOnly: boolean;
  log: (line: string) => void;
}
export interface VerifySummary { passed: number; failed: number; runs: number; usage: TokenUsage | null; exitCode: 0 | 1 }

const pad3 = (n: number): string => String(n).padStart(3, "0");
const firstLine = (e: unknown): string => (e instanceof Error ? e.message : String(e)).split(/\r?\n/)[0];

export async function verifyLessons(opts: VerifyOptions): Promise<VerifySummary> {
  const { log, provider, range } = opts;
  const all = listLessons(opts.lessonsDir);
  const lo = range?.lo ?? 1;
  const hi = range?.hi ?? Infinity;
  const inRange = all.filter((l) => Number(l.number) >= lo && Number(l.number) <= hi);
  const dups = duplicateNumbers(inRange);

  let passed = 0;
  let failed = 0;
  let runs = 0;
  let total: TokenUsage | null = null;

  if (inRange.length === 0) {
    log(`ไม่พบบทในช่วงที่ระบุ (${pad3(lo)}–${Number.isFinite(hi) ? pad3(hi) : "สุดท้าย"})`);
    log(`\nสรุป: ผ่าน ${passed} ไม่ผ่าน ${failed}`);
    log(`token ที่ใช้: ขาเข้า 0 ขาออก 0`);
    return { passed, failed, runs, usage: total, exitCode: 1 };
  }

  const reported = new Set<string>();
  for (const lesson of inRange) {
    const names = dups.get(lesson.number);
    if (names) {
      if (!reported.has(lesson.number)) {
        reported.add(lesson.number);
        log(`❌ บท ${lesson.number} มีหลายโฟลเดอร์: ${names.join(", ")} ข้ามบทนี้`);
        failed++;
      }
      continue;
    }
    let files = filesForProvider(runnableFiles(lesson), provider);
    if (opts.examplesOnly) files = files.filter((f) => f.startsWith("example"));
    if (files.length === 0) {
      log(`– ${lesson.number} ไม่มีไฟล์ให้รัน`);
      continue;
    }
    const checksPath = path.join(opts.checksDir, `${lesson.number}.ts`);
    if (!fs.existsSync(checksPath)) {
      log(`❌ ไม่มี internal/checks/${lesson.number}.ts`);
      failed++;
      continue;
    }
    let checks: LessonChecks;
    try {
      checks = ((await import(pathToFileURL(checksPath).href)) as { default: LessonChecks }).default;
      if (typeof checks !== "object" || checks === null) throw new Error("ไฟล์เกณฑ์ตรวจไม่ได้ export default เป็น object");
    } catch (e) {
      log(`❌ ${lesson.number} โหลดเกณฑ์ตรวจไม่ได้ (internal/checks/${lesson.number}.ts): ${firstLine(e)}`);
      failed++;
      continue;
    }
    for (const file of files) {
      const check = checks[file];
      if (!check) {
        log(`❌ ไม่มีเกณฑ์ตรวจของไฟล์ ${file}`);
        failed++;
        continue;
      }
      for (let attempt = 1; attempt <= opts.repeat; attempt++) {
        const run = await runOnce({ root: opts.root, lesson, file, provider, attempt, check, env: opts.env });
        runs++;
        total = addUsage(total, run.usage);
        const secs = (run.durationMs / 1000).toFixed(1);
        const label = `${lesson.number} ${file} #${attempt}`;
        try {
          check.check(run);
          log(`✅ ${label} (${secs}s, ${run.usage?.input ?? 0}→${run.usage?.output ?? 0} token)`);
          passed++;
        } catch (e) {
          log(`❌ ${label} (${secs}s) — ${e instanceof Error ? e.message : String(e)}`);
          failed++;
        }
      }
    }
  }

  let exitCode: 0 | 1 = failed > 0 ? 1 : 0;
  if (runs === 0 && failed === 0) {
    log("ไม่มีไฟล์ให้ตรวจเลย (0 รอบ) ตรวจเลขบทและ --examples-only อีกครั้ง");
    exitCode = 1;
  } else if (runs === 0) exitCode = 1;
  log(`\nสรุป: ผ่าน ${passed} ไม่ผ่าน ${failed}`);
  log(`token ที่ใช้: ขาเข้า ${total?.input ?? 0} ขาออก ${total?.output ?? 0}`);
  return { passed, failed, runs, usage: total, exitCode };
}
