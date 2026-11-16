import path from "node:path";
import {
  checkLessonFileNames,
  checkLessonFolders,
  checkNoHardcodedModels,
  checkNoSecrets,
  checkProviderPairs,
  checkReadmeHeadings,
  checkThaiSaraAm,
  checkVerifyCoverage,
  type Problem,
} from "./lib/course-rules";

const root = path.resolve(import.meta.dirname, "..");

const problems: Problem[] = [
  ...checkLessonFolders(root),
  ...checkLessonFileNames(root),
  ...checkReadmeHeadings(root),
  ...checkProviderPairs(root),
  ...checkNoHardcodedModels(root),
  ...checkNoSecrets(root),
  ...checkThaiSaraAm(root),
  ...checkVerifyCoverage(root),
];

if (problems.length > 0) {
  for (const p of problems) console.error(`${p.file}:${p.line ?? 0}: ${p.message}`);
  console.error(`\nพบปัญหา ${problems.length} จุด`);
  process.exit(1);
}
console.log("โครงคอร์สถูกต้อง");
