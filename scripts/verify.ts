import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listLessons, normalizeLessonNumber, runnableFiles } from "./lib/lessons";
import { startShim } from "../internal/dev/opencode-shim";
import { opencodeDevConfig, providerEnv, filesForProvider, runOnce } from "../internal/verify/runner";
import { addUsage } from "../internal/verify/usage";
import type { LessonChecks, TokenUsage, VerifyProvider } from "../internal/verify/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const providers: VerifyProvider[] = ["google", "ollama-cloud", "ollama", "opencode-dev"];
const usageText = "ใช้งาน: pnpm verify [NNN | NNN-NNN] --provider <google|ollama-cloud|ollama|opencode-dev> [--repeat N] [--examples-only]";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
let provider: VerifyProvider | undefined;
let repeat = 1;
let examplesOnly = false;
let range: string | undefined;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--provider") {
    const v = args[++i];
    if (!providers.includes(v as VerifyProvider)) fail(usageText);
    provider = v as VerifyProvider;
  } else if (a === "--repeat") {
    repeat = Number(args[++i]);
    if (!Number.isInteger(repeat) || repeat < 1) fail(usageText);
  } else if (a === "--examples-only") examplesOnly = true;
  else if (!a.startsWith("--") && range === undefined) range = a;
  else fail(usageText);
}
if (!provider) fail(usageText);

let lo = 1;
let hi = Infinity;
if (range !== undefined) {
  const [a, b] = range.split("-");
  const from = normalizeLessonNumber(a);
  const to = normalizeLessonNumber(b ?? a);
  if (from === null || to === null) fail(usageText);
  lo = Number(from);
  hi = Number(to);
}

let shim: Awaited<ReturnType<typeof startShim>> | undefined;
let env: Record<string, string>;
try {
  const base: Record<string, string | undefined> = { ...process.env };
  if (provider === "opencode-dev") {
    const { apiKey, model } = opencodeDevConfig(base);
    shim = await startShim({ apiKey, model });
    base.DN_OPENCODE_SHIM_URL = shim.baseUrl;
  }
  env = providerEnv(provider, base);
} catch (e) {
  await shim?.close();
  fail(e instanceof Error ? e.message : String(e));
}
const lessons = listLessons(path.join(root, "lessons")).filter((l) => Number(l.number) >= lo && Number(l.number) <= hi);

let passed = 0;
let failed = 0;
let total: TokenUsage | null = null;

for (const lesson of lessons) {
  let files = filesForProvider(runnableFiles(lesson), provider);
  if (examplesOnly) files = files.filter((f) => f.startsWith("example"));
  if (files.length === 0) {
    console.log(`– ${lesson.number} ไม่มีไฟล์ให้รัน`);
    continue;
  }
  const checksPath = path.join(root, "internal", "checks", `${lesson.number}.ts`);
  if (!fs.existsSync(checksPath)) {
    console.log(`❌ ไม่มี internal/checks/${lesson.number}.ts`);
    failed++;
    continue;
  }
  const checks = ((await import(pathToFileURL(checksPath).href)) as { default: LessonChecks }).default;
  for (const file of files) {
    const check = checks[file];
    if (!check) {
      console.log(`❌ ไม่มีเกณฑ์ตรวจของไฟล์ ${file}`);
      failed++;
      continue;
    }
    for (let attempt = 1; attempt <= repeat; attempt++) {
      const run = await runOnce({ root, lesson, file, provider, attempt, check, env });
      total = addUsage(total, run.usage);
      const secs = (run.durationMs / 1000).toFixed(1);
      const label = `${lesson.number} ${file} #${attempt}`;
      try {
        check.check(run);
        console.log(`✅ ${label} (${secs}s, ${run.usage?.input ?? 0}→${run.usage?.output ?? 0} token)`);
        passed++;
      } catch (e) {
        console.log(`❌ ${label} (${secs}s) — ${e instanceof Error ? e.message : String(e)}`);
        failed++;
      }
    }
  }
}

await shim?.close();
console.log(`\nสรุป: ผ่าน ${passed} ไม่ผ่าน ${failed}`);
console.log(`token ที่ใช้: ขาเข้า ${total?.input ?? 0} ขาออก ${total?.output ?? 0}`);
process.exit(failed > 0 ? 1 : 0);
