import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { countPointers, findLesson, pointerWarning, listLessons, normalizeLessonNumber, resolveLessonFile, runnableFiles } from "./lessons";

let dir: string;
beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "dn-lessons-"));
  const make = (d: string, files: string[]) => {
    fs.mkdirSync(path.join(dir, d));
    for (const f of files) fs.writeFileSync(path.join(dir, d, f), "");
  };
  make("006-raw-fetch", ["README.md", "example.ollama.ts", "example.google.ts", "exercise-1.ollama.ts", "exercise-1.google.ts", "helper.test.ts"]);
  make("002-setup-project", ["example.ts", "exercise-1.ts"]);
  make("009-empty", ["README.md"]);
  make("appendix-a-more-providers", []);
  fs.writeFileSync(path.join(dir, "notes.md"), "");
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("lessons", () => {
  it("normalizeLessonNumber", () => {
    expect(normalizeLessonNumber("7")).toBe("007");
    expect(normalizeLessonNumber("07")).toBe("007");
    expect(normalizeLessonNumber("152")).toBe("152");
    for (const bad of ["0", "000", "abc", "1000", "", "6a"]) expect(normalizeLessonNumber(bad)).toBeNull();
  });
  it("listLessons เอาเฉพาะโฟลเดอร์ NNN-slug เรียงตามเลข", () =>
    expect(listLessons(dir).map((l) => l.number)).toEqual(["002", "006", "009"]));
  it("ไม่มีโฟลเดอร์ lessons → []", () => expect(listLessons(path.join(dir, "ไม่มี"))).toEqual([]));
  it("findLesson รับ 6", () => expect(findLesson(dir, "6")?.slug).toBe("raw-fetch"));
  it("runnableFiles ไม่เอา README และ .test.ts", () =>
    expect(runnableFiles(findLesson(dir, "006")!)).toEqual(["example.google", "example.ollama", "exercise-1.google", "exercise-1.ollama"]));
  it("ไม่ระบุไฟล์ → example.ts", () =>
    expect(resolveLessonFile(findLesson(dir, "002")!)).toEqual({ ok: true, file: path.join(dir, "002-setup-project", "example.ts") }));
  it("ไม่มี example.ts → บอกให้เลือก", () => {
    const r = resolveLessonFile(findLesson(dir, "006")!);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe("บท 006 มีไฟล์ให้เลือก: example.google, example.ollama, exercise-1.google, exercise-1.ollama\nตัวอย่าง: pnpm lesson 006 example.google");
  });
  it("ชื่อไฟล์มี .ts ก็หาเจอ", () => expect(resolveLessonFile(findLesson(dir, "006")!, "exercise-1.google.ts").ok).toBe(true));
  it("ชื่อไฟล์ไม่มีจริง", () => {
    const r = resolveLessonFile(findLesson(dir, "002")!, "exercise-9");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe("บท 002 ไม่มีไฟล์ exercise-9.ts มีไฟล์ให้เลือก: example, exercise-1");
  });
  it("countPointers", () => expect(countPointers("// 👉 a\nconst x = 1; // 👉 b\n")).toBe(2));
  it("countPointers ไม่นับ 👉 ในข้อความ guard หรือหัวไฟล์", () =>
    expect(countPointers('// แนวทาง 👉 ดูข้างล่าง\nconsole.log("👉 ต้องเติมก่อน");\nconst x = 1; // 👉 เติมตรงนี้\n')).toBe(1));
  it("countPointers: เฉลยที่ไม่มี // 👉 → 0", () => expect(countPointers('const x = 1;\nconsole.log("👉 x");\n')).toBe(0));
  it("ไม่มีไฟล์ให้รัน", () => {
    const r = resolveLessonFile(findLesson(dir, "009")!);
    expect(r).toEqual({ ok: false, message: "บท 009 ไม่มีไฟล์ให้รัน อ่าน README.md ของบทนี้" });
  });
  it("pointerWarning", () => expect(pointerWarning(3)).toBe("⚠️  ไฟล์นี้ยังมี 👉 อีก 3 จุด ผลที่ได้อาจยังไม่ครบ"));
});
