import fs from "node:fs";
import path from "node:path";

export interface Lesson { number: string; slug: string; dir: string }

export function normalizeLessonNumber(input: string): string | null {
  if (!/^\d{1,3}$/.test(input)) return null;
  const n = Number(input);
  if (n < 1) return null;
  return String(n).padStart(3, "0");
}

export function listLessons(lessonsDir: string): Lesson[] {
  if (!fs.existsSync(lessonsDir)) return [];
  const lessons: Lesson[] = [];
  for (const entry of fs.readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const m = /^(\d{3})-(.+)$/.exec(entry.name);
    if (!m) continue;
    lessons.push({ number: m[1], slug: m[2], dir: path.join(lessonsDir, entry.name) });
  }
  return lessons.sort((a, b) => a.number.localeCompare(b.number));
}

export function findLesson(lessonsDir: string, input: string): Lesson | null {
  const number = normalizeLessonNumber(input);
  if (number === null) return null;
  return listLessons(lessonsDir).find((l) => l.number === number) ?? null;
}

export const RUNNABLE_RE = /^(example|exercise-\d+)(\.(ollama|google))?$/;

// ชื่อไฟล์ที่รันได้ (ไม่มี .ts) ตรง RUNNABLE_RE เรียงตามตัวอักษร
export function runnableFiles(lesson: Lesson): string[] {
  return fs
    .readdirSync(lesson.dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".ts") && !e.name.endsWith(".test.ts"))
    .map((e) => e.name.slice(0, -3))
    .filter((n) => RUNNABLE_RE.test(n))
    .sort();
}

// เลขบท → ชื่อโฟลเดอร์ (เฉพาะเลขที่มี 2 โฟลเดอร์ขึ้นไป)
export function duplicateNumbers(lessons: Lesson[]): Map<string, string[]> {
  const by = new Map<string, string[]>();
  for (const l of lessons) by.set(l.number, [...(by.get(l.number) ?? []), path.basename(l.dir)]);
  const dup = new Map<string, string[]>();
  for (const [n, names] of by) if (names.length > 1) dup.set(n, names.sort());
  return dup;
}

export type Located = { ok: true; lesson: Lesson } | { ok: false; message: string };

export function locateLesson(lessonsDir: string, input: string): Located {
  const number = normalizeLessonNumber(input);
  const all = number === null ? [] : listLessons(lessonsDir).filter((l) => l.number === number);
  if (number === null || all.length === 0) return { ok: false, message: `ไม่พบบท ${input} ในโฟลเดอร์ lessons/` };
  if (all.length > 1) {
    const names = all.map((l) => path.basename(l.dir)).sort();
    return { ok: false, message: `บท ${number} มีหลายโฟลเดอร์: ${names.join(", ")} ให้เหลือโฟลเดอร์เดียว` };
  }
  return { ok: true, lesson: all[0] };
}

export type Resolved = { ok: true; file: string } | { ok: false; message: string };

export function resolveLessonFile(lesson: Lesson, name?: string): Resolved {
  const choices = runnableFiles(lesson);
  if (name === undefined) {
    if (choices.includes("example")) return { ok: true, file: path.join(lesson.dir, "example.ts") };
    if (choices.length === 0) return { ok: false, message: `บท ${lesson.number} ไม่มีไฟล์ให้รัน อ่าน README.md ของบทนี้` };
    return {
      ok: false,
      message: `บท ${lesson.number} มีไฟล์ให้เลือก: ${choices.join(", ")}\nตัวอย่าง: pnpm lesson ${lesson.number} ${choices[0]}`,
    };
  }
  const base = name.endsWith(".ts") ? name.slice(0, -3) : name;
  if (choices.includes(base)) return { ok: true, file: path.join(lesson.dir, `${base}.ts`) };
  if (choices.length === 0) return { ok: false, message: `บท ${lesson.number} ไม่มีไฟล์ให้รัน อ่าน README.md ของบทนี้` };
  return { ok: false, message: `บท ${lesson.number} ไม่มีไฟล์ ${base}.ts มีไฟล์ให้เลือก: ${choices.join(", ")}` };
}

export function countPointers(source: string): number {
  return source.match(/\/\/\s*👉/g)?.length ?? 0;
}

export function pointerWarning(count: number): string {
  return `⚠️  ไฟล์นี้ยังมี 👉 อีก ${count} จุด ผลที่ได้อาจยังไม่ครบ`;
}
