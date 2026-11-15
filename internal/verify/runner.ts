import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { FileCheck, Lesson, RunResult, TokenUsage, VerifyProvider } from "./types";

function need(base: Record<string, string | undefined>, name: string): string {
  const v = base[name];
  if (v === undefined || v === "") throw new Error(`ยังไม่ได้ตั้งค่า ${name} ในไฟล์ .env ของผู้สอน (ดู internal/README.md)`);
  return v;
}

export function providerEnv(provider: VerifyProvider, base: Record<string, string | undefined>): Record<string, string> {
  switch (provider) {
    case "google":
      return { LLM_PROVIDER: "google" };
    case "ollama-cloud":
      return {
        LLM_PROVIDER: "ollama",
        OLLAMA_BASE_URL: "https://ollama.com",
        OLLAMA_API_KEY: need(base, "VERIFY_OLLAMA_CLOUD_API_KEY"),
        OLLAMA_MODEL: need(base, "VERIFY_OLLAMA_CLOUD_MODEL"),
      };
    case "ollama":
      return {
        LLM_PROVIDER: "ollama",
        OLLAMA_BASE_URL: "http://localhost:11434",
        OLLAMA_API_KEY: "",
        OLLAMA_MODEL: need(base, "VERIFY_OLLAMA_LOCAL_MODEL"),
        OLLAMA_NUM_CTX: need(base, "VERIFY_OLLAMA_LOCAL_NUM_CTX"),
      };
  }
}

export function filesForProvider(files: string[], provider: VerifyProvider): string[] {
  const wanted = provider === "google" ? "google" : "ollama";
  const other = provider === "google" ? "ollama" : "google";
  return files.filter((f) => {
    const parts = f.split(".");
    if (parts.includes(wanted)) return true;
    return !parts.includes(other);
  });
}

const DEFAULT_TIMEOUT_MS = 300000;

export async function runOnce(opts: {
  root: string; lesson: Lesson; file: string; provider: VerifyProvider; attempt: number;
  check: FileCheck; env: Record<string, string>;
}): Promise<RunResult> {
  const { root, lesson, file, check } = opts;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dn-verify-"));
  const usageFile = path.join(tmpDir, "usage.json");
  const env = { ...process.env, ...opts.env, DN_USAGE_FILE: usageFile };
  const started = Date.now();
  try {
    const target = path.join(lesson.dir, `${file}.ts`);
    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean }>((resolve) => {
      const child = spawn(
        process.execPath,
        ["--env-file-if-exists=.env", "--import", "tsx", "--import", "./internal/verify/usage-hook.ts", "scripts/run-cli.ts", target],
        { cwd: root, env, stdio: ["pipe", "pipe", "pipe"] },
      );
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;
      child.stdout.setEncoding("utf8").on("data", (d: string) => { stdout += d; });
      child.stderr.setEncoding("utf8").on("data", (d: string) => { stderr += d; });
      const finish = (exitCode: number | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode, timedOut });
      };
      const timer = setTimeout(() => { timedOut = true; child.kill(); }, check.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      child.on("error", (e) => { stderr += `${e.message}\n`; finish(null); });
      child.on("close", (code) => finish(code));
      child.stdin.on("error", () => undefined);
      child.stdin.end(check.input && check.input.length > 0 ? check.input.join("\n") + "\n" : "");
    });
    let usage: TokenUsage | null = null;
    try {
      const parsed = JSON.parse(fs.readFileSync(usageFile, "utf8")) as TokenUsage;
      usage = { input: parsed.input, output: parsed.output };
    } catch { /* no usage recorded */ }
    const { DN_USAGE_FILE: _omit, ...shown } = env;
    void _omit;
    return {
      lesson: lesson.number, file, provider: opts.provider, attempt: opts.attempt,
      env: shown, ...result, durationMs: Date.now() - started, usage,
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
