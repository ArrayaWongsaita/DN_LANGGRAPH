import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeLessonNumber } from "./lib/lessons";
import { startShim } from "../internal/dev/opencode-shim";
import { opencodeDevConfig, providerEnv } from "../internal/verify/runner";
import { verifyLessons, type VerifySummary } from "../internal/verify/run-all";
import type { VerifyProvider } from "../internal/verify/types";

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
let summary: VerifySummary;
try {
  summary = await verifyLessons({
    root, lessonsDir: path.join(root, "lessons"), checksDir: path.join(root, "internal", "checks"),
    provider, env, range: range === undefined ? null : { lo, hi }, repeat, examplesOnly, log: console.log,
  });
} finally {
  await shim?.close();
}
process.exit(summary.exitCode);
