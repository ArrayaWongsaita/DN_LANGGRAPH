import fs from "node:fs";
import path from "node:path";
import { listLessons, runnableFiles, type Lesson } from "./lessons";

export interface Problem { file: string; line?: number; message: string } // file is relative to root

export const README_HEADINGS: readonly string[] = [
  "จบบทนี้แล้วทำอะไรได้",
  "เชื่อมกับที่รู้แล้ว",
  "เนื้อหา",
  "จุดที่มักพลาด",
  "วิธีรัน",
  "ผลที่ควรเห็น",
  "เปิดดูใน Studio",
  "แบบฝึกหัด",
  "อ่านเพิ่ม",
];

const STUDIO_HEADING = "เปิดดูใน Studio";
const STUDIO_FROM = 46;
const FOLDER_RE = /^\d{3}-[a-z0-9]+(-[a-z0-9]+)*$/;
const APPENDIX_RE = /^appendix-[a-c]-[a-z0-9]+(-[a-z0-9]+)*$/;
// Wrong Thai sara am (nikhahit U+0E4D + sara aa U+0E32), built from char codes so this file does not trip its own rule
const BAD_SARA_AM = String.fromCharCode(0x0e4d, 0x0e32);

const rel = (root: string, file: string): string => path.relative(root, file);

function lessonDirNames(root: string): string[] {
  const dir = path.join(root, "lessons");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

function lessons(root: string): Lesson[] {
  return listLessons(path.join(root, "lessons")).filter((l) => FOLDER_RE.test(path.basename(l.dir)));
}

export function checkLessonFolders(root: string): Problem[] {
  const problems: Problem[] = [];
  const numbers = new Set<number>();
  for (const name of lessonDirNames(root)) {
    const file = path.join("lessons", name);
    if (FOLDER_RE.test(name)) numbers.add(Number(name.slice(0, 3)));
    else if (!APPENDIX_RE.test(name)) problems.push({ file, message: "ชื่อโฟลเดอร์ไม่ถูกรูปแบบ NNN-slug" });
  }
  const max = Math.max(0, ...numbers);
  for (let n = 1; n <= max; n++) {
    if (!numbers.has(n)) problems.push({ file: "lessons", message: `เลขบทขาด: ไม่มีบท ${String(n).padStart(3, "0")}` });
  }
  return problems;
}

export function checkReadmeHeadings(root: string): Problem[] {
  const problems: Problem[] = [];
  for (const lesson of lessons(root)) {
    const readme = path.join(lesson.dir, "README.md");
    const file = rel(root, readme);
    if (!fs.existsSync(readme)) {
      problems.push({ file, message: "ไม่มี README.md" });
      continue;
    }
    const found = fs.readFileSync(readme, "utf8").split(/\r?\n/).filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim());
    const needStudio = Number(lesson.number) >= STUDIO_FROM;
    const required = README_HEADINGS.filter((h) => needStudio || h !== STUDIO_HEADING);
    let ok = true;
    for (const h of required) {
      if (!found.includes(h)) {
        problems.push({ file, message: `README ขาดหัวข้อ "## ${h}"` });
        ok = false;
      }
    }
    if (!ok) continue;
    const indexes = README_HEADINGS.filter((h) => found.includes(h)).map((h) => found.indexOf(h));
    if (indexes.some((v, i) => i > 0 && v < indexes[i - 1])) {
      problems.push({ file, message: `หัวข้อ README เรียงไม่ตรงลำดับ: ${README_HEADINGS.join(" > ")}` });
    }
  }
  return problems;
}

export function checkProviderPairs(root: string): Problem[] {
  const problems: Problem[] = [];
  for (const lesson of lessons(root)) {
    const n = Number(lesson.number);
    if (n < 6 || n > 27) continue;
    const names = runnableFiles(lesson);
    for (const name of names) {
      const file = rel(root, path.join(lesson.dir, `${name}.ts`));
      const m = /^(.+)\.(ollama|google)$/.exec(name);
      if (!m) {
        problems.push({ file, message: "บท 006–027 ต้องแยกไฟล์ตาม provider เช่น example.ollama.ts และ example.google.ts" });
        continue;
      }
      const other = `${m[1]}.${m[2] === "ollama" ? "google" : "ollama"}`;
      if (!names.includes(other)) problems.push({ file, message: `ขาดไฟล์คู่ ${other}.ts` });
    }
  }
  return problems;
}

function* walk(dir: string, skip: (name: string, isDir: boolean) => boolean): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip(e.name, e.isDirectory())) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full, skip);
    else if (e.isFile()) yield full;
  }
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".superpowers", ".langgraph", ".next", "coverage"]);

function* lines(file: string): Generator<{ text: string; line: number }> {
  const content = fs.readFileSync(file, "utf8");
  const all = content.split(/\r?\n/);
  for (let i = 0; i < all.length; i++) yield { text: all[i], line: i + 1 };
}

const MODEL_PATTERNS = [/\bmodel\s*:\s*["'`]/, /initChatModel\(\s*["'`]/];

export function checkNoHardcodedModels(root: string): Problem[] {
  const problems: Problem[] = [];
  for (const top of ["lessons", "src"]) {
    for (const file of walk(path.join(root, top), (n, d) => d && SKIP_DIRS.has(n))) {
      if (!/\.tsx?$/.test(file)) continue;
      for (const { text, line } of lines(file)) {
        if (MODEL_PATTERNS.some((re) => re.test(text))) {
          problems.push({ file: rel(root, file), line, message: "ห้ามใส่ชื่อโมเดลในโค้ด ให้อ่านจาก .env" });
        }
      }
    }
  }
  return problems;
}

const SECRET_PATTERNS = [/AIza[0-9A-Za-z_-]{35}/, /lsv2_[a-z]{2}_[0-9a-f]{20,}/, /oc_sk_[A-Za-z0-9_-]{16,}/];

function isBinary(file: string): boolean {
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(4096);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    return buf.subarray(0, n).includes(0);
  } finally {
    fs.closeSync(fd);
  }
}

export function checkNoSecrets(root: string): Problem[] {
  const problems: Problem[] = [];
  const skip = (name: string, isDir: boolean): boolean =>
    isDir ? SKIP_DIRS.has(name) : name === ".env" || (name.startsWith(".env.") && name !== ".env.example");
  for (const file of walk(root, skip)) {
    if (isBinary(file)) continue;
    for (const { text, line } of lines(file)) {
      if (SECRET_PATTERNS.some((re) => re.test(text))) {
        problems.push({ file: rel(root, file), line, message: "พบสิ่งที่ดูเหมือน API key ห้ามเก็บในรีโป" });
      }
    }
  }
  const gitignore = path.join(root, ".gitignore");
  const ignored = fs.existsSync(gitignore) && fs.readFileSync(gitignore, "utf8").split(/\r?\n/).some((l) => l.trim() === ".env");
  if (!ignored) problems.push({ file: ".gitignore", message: "ต้องมีบรรทัด .env เพื่อกันไม่ให้ commit key" });
  return problems;
}

export function checkThaiSaraAm(root: string): Problem[] {
  const problems: Problem[] = [];
  const files: string[] = [];
  for (const top of ["lessons", "src", "scripts", "internal", "docs"]) {
    for (const f of walk(path.join(root, top), (n, d) => d && SKIP_DIRS.has(n))) files.push(f);
  }
  const readme = path.join(root, "README.md");
  if (fs.existsSync(readme)) files.push(readme);
  for (const file of files) {
    if (isBinary(file)) continue;
    for (const { text, line } of lines(file)) {
      if (text.includes(BAD_SARA_AM)) {
        problems.push({ file: rel(root, file), line, message: "พบสระอำที่พิมพ์ผิดรหัส (นิคหิต + สระอา) ให้แก้เป็นสระอำตัวเดียว" });
      }
    }
  }
  return problems;
}

export function checkVerifyCoverage(root: string): Problem[] {
  const problems: Problem[] = [];
  for (const lesson of lessons(root)) {
    if (runnableFiles(lesson).length === 0) continue;
    const check = path.join(root, "internal", "checks", `${lesson.number}.ts`);
    if (!fs.existsSync(check)) {
      problems.push({ file: rel(root, lesson.dir), message: `บทนี้มีไฟล์ให้รันแต่ไม่มี internal/checks/${lesson.number}.ts` });
    }
  }
  return problems;
}
