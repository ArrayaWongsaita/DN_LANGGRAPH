import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { countPointers, findLesson, resolveLessonFile } from "./lib/lessons";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [input, name] = process.argv.slice(2);

if (!input) {
  console.error("ใช้งาน: pnpm lesson NNN [ชื่อไฟล์]");
  process.exit(1);
}
const lesson = findLesson(path.join(root, "lessons"), input);
if (!lesson) {
  console.error(`ไม่พบบท ${input} ในโฟลเดอร์ lessons/`);
  process.exit(1);
}
const resolved = resolveLessonFile(lesson, name);
if (!resolved.ok) {
  console.error(resolved.message);
  process.exit(1);
}
const pointers = countPointers(fs.readFileSync(resolved.file, "utf8"));
if (pointers > 0) console.log(`⚠️  ไฟล์นี้ยังมี 👉 อีก ${pointers} จุด ผลที่ได้อาจยังไม่ครบ`);

const child = spawnSync(
  process.execPath,
  ["--env-file-if-exists=.env", "--import", "tsx", "scripts/run-cli.ts", resolved.file],
  { cwd: root, stdio: "inherit" },
);
process.exit(child.status ?? 1);
