import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { countPointers, locateLesson, pointerWarning, resolveLessonFile } from "./lib/lessons";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [input, name] = process.argv.slice(2);

if (!input) {
  console.error("ใช้งาน: pnpm lesson NNN [ชื่อไฟล์]");
  process.exit(1);
}
const located = locateLesson(path.join(root, "lessons"), input);
if (!located.ok) {
  console.error(located.message);
  process.exit(1);
}
const resolved = resolveLessonFile(located.lesson, name);
if (!resolved.ok) {
  console.error(resolved.message);
  process.exit(1);
}
const pointers = countPointers(fs.readFileSync(resolved.file, "utf8"));
if (pointers > 0) console.log(pointerWarning(pointers));

const child = spawnSync(
  process.execPath,
  ["--env-file-if-exists=.env", "--import", "tsx", "scripts/run-cli.ts", resolved.file],
  { cwd: root, stdio: "inherit" },
);
if (child.error) {
  console.error(`เปิดโปรแกรมรันบทไม่สำเร็จ: ${child.error.message}`);
  process.exit(1);
}
process.exit(child.status ?? 1);
