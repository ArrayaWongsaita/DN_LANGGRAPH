import type { TokenUsage } from "./types";

function parseJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return undefined; }
}

function objectsOf(body: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const push = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(push);
    else if (v !== null && typeof v === "object") out.push(v as Record<string, unknown>);
  };
  const whole = parseJson(body.trim());
  if (whole !== undefined) { push(whole); return out; }
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.startsWith("data:") ? raw.slice(5).trim() : raw.trim();
    if (line === "") continue;
    const v = parseJson(line);
    if (v !== undefined) push(v);
  }
  return out;
}

const num = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);

export function parseOllamaUsage(body: string): TokenUsage | null {
  let found = false;
  let input = 0;
  let output = 0;
  for (const o of objectsOf(body)) {
    const p = num(o.prompt_eval_count);
    const e = num(o.eval_count);
    if (p !== undefined) { input += p; found = true; }
    if (e !== undefined) { output += e; found = true; }
  }
  return found ? { input, output } : null;
}

export function parseGeminiUsage(body: string): TokenUsage | null {
  let last: Record<string, unknown> | undefined;
  for (const o of objectsOf(body)) {
    if (o.usageMetadata !== null && typeof o.usageMetadata === "object") last = o.usageMetadata as Record<string, unknown>;
  }
  if (!last) return null;
  return {
    input: num(last.promptTokenCount) ?? 0,
    output: (num(last.candidatesTokenCount) ?? 0) + (num(last.thoughtsTokenCount) ?? 0),
  };
}

export function addUsage(a: TokenUsage | null, b: TokenUsage | null): TokenUsage | null {
  if (!a) return b;
  if (!b) return a;
  return { input: a.input + b.input, output: a.output + b.output };
}
