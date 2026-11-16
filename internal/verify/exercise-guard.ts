import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { countPointers, listLessons, RUNNABLE_RE } from "../../scripts/lib/lessons";

export const GUARD_ENV: Readonly<Record<string, string>> = {
  LLM_PROVIDER: "ollama",
  OLLAMA_BASE_URL: "http://127.0.0.1:9",
  OLLAMA_API_KEY: "",
  OLLAMA_MODEL: "guard-test",
  GOOGLE_API_KEY: "guard-test",
  GOOGLE_MODEL: "guard-test",
};

export interface GuardResult { file: string; exitCode: number | null; stdout: string; stderr: string; fetchCalls: number; timedOut: boolean }

// เก็บ timeout ของแต่ละผลลัพธ์ไว้ใช้ในข้อความตอนล้ม
const timeouts = new WeakMap<GuardResult, number>();

// path เต็มของ exercise-*.ts ที่ยังมี "// 👉" ในบทที่เลข >= from
export function guardTargets(lessonsDir: string, from: string): string[] {
  const targets: string[] = [];
  for (const lesson of listLessons(lessonsDir)) {
    if (Number(lesson.number) < Number(from)) continue;
    for (const e of fs.readdirSync(lesson.dir, { withFileTypes: true })) {
      if (!e.isFile() || !e.name.endsWith(".ts") || e.name.endsWith(".test.ts")) continue;
      const base = e.name.slice(0, -3);
      if (!RUNNABLE_RE.test(base) || !base.startsWith("exercise-")) continue;
      const full = path.join(lesson.dir, e.name);
      if (countPointers(fs.readFileSync(full, "utf8")) > 0) targets.push(full);
    }
  }
  return targets.sort();
}

export function runGuard(root: string, file: string, timeoutMs = 30000): Promise<GuardResult> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "--import", "./internal/verify/no-network-hook.ts", "scripts/run-cli.ts", file],
      { cwd: root, env: { ...process.env, ...GUARD_ENV }, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    child.stdout.on("data", (d) => { stdout += String(d); });
    child.stderr.on("data", (d) => { stderr += String(d); });
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeoutMs);
    const done = (exitCode: number | null) => {
      clearTimeout(timer);
      const fetchCalls = stderr.split(/\r?\n/).filter((l) => l.startsWith("DN_GUARD_FETCH")).length;
      const result: GuardResult = { file, exitCode, stdout, stderr, fetchCalls, timedOut };
      timeouts.set(result, timeoutMs);
      resolve(result);
    };
    child.on("error", (e) => { stderr += String(e); done(null); });
    child.on("close", (code) => done(code));
  });
}

export function guardProblem(r: GuardResult): string | null {
  if (r.timedOut) return `ค้างเกิน ${Math.round((timeouts.get(r) ?? 30000) / 1000)} วินาที`;
  if (r.fetchCalls > 0) return `เรียก API ทั้งที่ยังไม่ได้เติม (${r.fetchCalls} ครั้ง)`;
  if (r.exitCode !== 0) {
    const last = r.stderr.split(/\r?\n/).filter((l) => l.trim() !== "").pop() ?? "";
    return `exit code ${r.exitCode}: ${last}`;
  }
  if (!r.stdout.split(/\r?\n/).some((l) => l.startsWith("👉"))) return "ไม่พิมพ์บรรทัด 👉 บอกผู้เรียน";
  return null;
}
