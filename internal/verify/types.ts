import type { Lesson } from "../../scripts/lib/lessons";

export type VerifyProvider = "google" | "ollama-cloud" | "ollama";
export interface TokenUsage { input: number; output: number }
export interface RunResult {
  lesson: string; file: string; provider: VerifyProvider; attempt: number;
  env: Record<string, string | undefined>;
  stdout: string; stderr: string; exitCode: number | null; timedOut: boolean; durationMs: number;
  usage: TokenUsage | null;
}
export interface FileCheck { input?: string[]; timeoutMs?: number; check: (run: RunResult) => void }
export type LessonChecks = Record<string, FileCheck>;
export type { Lesson };
