import { ENV_LESSON, isOllamaCloudDirect, optionalEnv } from "../../src/lib/env";

export interface CheckResult { ok: boolean; label: string; detail?: string; lesson?: string }
export interface DoctorDeps {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
  nodeVersion: string;
  userAgent: string | undefined;
  readEnvFile: () => string | null;
}

const TIMEOUT_MS = 10_000;
const pass = (label: string): CheckResult => ({ ok: true, label });
const fail = (label: string, detail: string, lesson: string): CheckResult => ({ ok: false, label, detail, lesson });

// ห้ามใส่ error message ลงผลลัพธ์ เพราะอาจมี URL/key ติดมา
async function get(deps: DoctorDeps, url: string, headers: Record<string, string>): Promise<Response | null> {
  try {
    return await deps.fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return null;
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function names(body: unknown): string[] {
  const models = (body as { models?: unknown } | null)?.models;
  if (!Array.isArray(models)) return [];
  return models.map((m) => (m as { name?: unknown } | null)?.name).filter((n): n is string => typeof n === "string");
}

function checkNode(deps: DoctorDeps): CheckResult {
  const major = Number(/^v?(\d+)/.exec(deps.nodeVersion)?.[1]);
  return major >= 24
    ? pass(`Node ${deps.nodeVersion}`)
    : fail(`Node ${deps.nodeVersion}`, "ต้องใช้ Node 24 ขึ้นไป ให้ติดตั้งรุ่นใหม่จาก nodejs.org", "002");
}

function checkPnpm(deps: DoctorDeps): CheckResult {
  return deps.userAgent?.startsWith("pnpm/12.")
    ? pass("pnpm 12")
    : fail("pnpm", "ต้องรันผ่าน pnpm รุ่น 12 (ลอง corepack enable แล้วรันใหม่ด้วย pnpm doctor)", "002");
}

function checkEnvFile(deps: DoctorDeps): CheckResult {
  let content: string | null;
  try {
    content = deps.readEnvFile();
  } catch {
    content = null;
  }
  if (content === null) return fail(".env", "ยังไม่มีไฟล์ .env ให้คัดลอกจาก .env.example", "002");
  if (content.startsWith("﻿")) return fail(".env", "ไฟล์มี BOM นำหน้า: บันทึกใหม่เป็น UTF-8 แบบไม่มี BOM", "002");
  return pass(".env");
}

async function checkGoogle(deps: DoctorDeps): Promise<CheckResult> {
  const label = "Google Gemini";
  const lesson = ENV_LESSON.GOOGLE_API_KEY;
  const key = optionalEnv("GOOGLE_API_KEY", deps.env);
  const model = optionalEnv("GOOGLE_MODEL", deps.env);
  if (!key) return fail(label, "ยังไม่ได้ตั้ง GOOGLE_API_KEY ในไฟล์ .env", lesson);
  if (!model) return fail(label, "ยังไม่ได้ตั้ง GOOGLE_MODEL ในไฟล์ .env", lesson);
  const res = await get(deps, "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", { "x-goog-api-key": key });
  if (!res) return fail(label, "ต่อ Google ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่", lesson);
  if (res.status === 400 || res.status === 403) return fail(label, "key ไม่ถูกต้อง", lesson);
  if (res.status !== 200) return fail(label, `Google ตอบสถานะ ${res.status}`, lesson);
  if (!names(await readJson(res)).includes(`models/${model}`)) return fail(label, `ไม่พบโมเดล ${model} ในบัญชีนี้ ตรวจ GOOGLE_MODEL`, lesson);
  return pass(`Google Gemini (${model})`);
}

function hasModel(available: string[], model: string): boolean {
  return available.some((n) => n === model || n === `${model}:latest`);
}

async function checkOllama(deps: DoctorDeps): Promise<CheckResult> {
  const label = "Ollama";
  const base = optionalEnv("OLLAMA_BASE_URL", deps.env);
  if (!base) return fail(label, "ยังไม่ได้ตั้ง OLLAMA_BASE_URL ในไฟล์ .env", ENV_LESSON.OLLAMA_BASE_URL);
  const model = optionalEnv("OLLAMA_MODEL", deps.env);
  const cloud = isOllamaCloudDirect(base);
  const lesson = cloud ? ENV_LESSON.OLLAMA_API_KEY : ENV_LESSON.OLLAMA_BASE_URL;
  const headers: Record<string, string> = {};
  if (cloud) {
    const apiKey = optionalEnv("OLLAMA_API_KEY", deps.env);
    if (!apiKey) return fail(label, "ยังไม่ได้ตั้ง OLLAMA_API_KEY ในไฟล์ .env", lesson);
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const res = await get(deps, `${base}/api/tags`, headers);
  if (!res) {
    return fail(label, cloud ? "ต่อ Ollama Cloud ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่" : "ต่อ Ollama ไม่ได้ เปิดโปรแกรม Ollama ก่อน", lesson);
  }
  if (res.status === 401) return fail(label, "OLLAMA_API_KEY ไม่ถูกต้อง", lesson);
  if (res.status !== 200) return fail(label, `Ollama ตอบสถานะ ${res.status}`, lesson);
  const available = names(await readJson(res));
  const found = model ? hasModel(available, model) : available.length > 0;
  if (!found) {
    const detail = cloud
      ? `ไม่พบโมเดล${model ? ` ${model}` : ""} ในรายการ ตรวจ OLLAMA_MODEL`
      : `ยังไม่มีโมเดล${model ? ` ${model}` : ""} ให้รัน ollama pull ${model ?? "<ชื่อโมเดล>"}`;
    return fail(label, detail, lesson);
  }
  return pass(`Ollama${model ? ` (${model})` : ""}`);
}

export async function runDoctor(deps: DoctorDeps): Promise<CheckResult[]> {
  const guard = async (label: string, lesson: string, check: () => CheckResult | Promise<CheckResult>): Promise<CheckResult> => {
    try {
      return await check();
    } catch (e) {
      // EnvError มีข้อความภาษาไทยที่ไม่มีค่า key; error อื่นไม่แสดงข้อความ
      const detail = e instanceof Error && e.name === "EnvError" ? e.message : "ตรวจไม่สำเร็จ";
      return fail(label, detail, lesson);
    }
  };
  return [
    await guard("Node", "002", () => checkNode(deps)),
    await guard("pnpm", "002", () => checkPnpm(deps)),
    await guard(".env", "002", () => checkEnvFile(deps)),
    await guard("Google Gemini", ENV_LESSON.GOOGLE_API_KEY, () => checkGoogle(deps)),
    await guard("Ollama", ENV_LESSON.OLLAMA_BASE_URL, () => checkOllama(deps)),
  ];
}

export function formatResults(results: CheckResult[]): string {
  const lines = results.map((r) => (r.ok ? `✅ ${r.label}` : `❌ ${r.label} — ${r.detail} (ดูบท ${r.lesson})`));
  const bad = results.filter((r) => !r.ok).length;
  lines.push(bad === 0 ? "พร้อมเรียนแล้ว" : `ยังมี ${bad} เรื่องต้องแก้`);
  return lines.join("\n");
}
