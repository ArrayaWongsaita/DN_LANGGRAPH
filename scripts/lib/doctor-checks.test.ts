import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { ENV_LESSON } from "../../src/lib/env";
import { SETUP_LESSON, formatResults, runDoctor, type DoctorDeps } from "./doctor-checks";

const KEY = "AIza" + "FAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE123";
const CLOUD_KEY = "oc_sk" + "_FAKEFAKEFAKEFAKEFAKE";
const BOM = "﻿";
const okEnv = {
  GOOGLE_API_KEY: KEY,
  GOOGLE_MODEL: "gemini-test",
  OLLAMA_BASE_URL: "http://localhost:11434",
  OLLAMA_MODEL: "qwen-test",
};

interface FakeOptions { google?: number; googleModels?: string[]; ollamaThrows?: boolean; ollamaModels?: string[]; cloud?: number; googleThrows?: boolean; calls?: { url: string; headers: Record<string, string> }[] }

function fakeFetch(o: FakeOptions = {}): typeof fetch {
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  return ((input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = ((typeof input === "object" && !(input instanceof URL) ? input.headers : undefined) ?? init?.headers ?? {}) as Record<string, string>;
    o.calls?.push({ url, headers });
    return Promise.resolve(respond(url));
  });
  function respond(url: string): Response {
    if (url.includes("generativelanguage.googleapis.com")) {
      if (o.googleThrows) throw new TypeError("network down");
      const status = o.google ?? 200;
      if (status !== 200) return json(status, {});
      return json(200, { models: (o.googleModels ?? ["gemini-test"]).map((m) => ({ name: `models/${m}` })) });
    }
    if (url.endsWith("/api/tags")) {
      if (o.cloud !== undefined && o.cloud !== 200) return json(o.cloud, {});
      if (o.ollamaThrows) throw new TypeError("connect ECONNREFUSED");
      return json(200, { models: (o.ollamaModels ?? ["qwen-test:latest"]).map((m) => ({ name: m })) });
    }
    throw new Error(`unexpected url ${url}`);
  }
}

function okDeps(over: Partial<DoctorDeps> = {}): DoctorDeps {
  return {
    env: okEnv,
    fetch: fakeFetch(),
    nodeVersion: "v24.1.0",
    userAgent: "pnpm/12.21.0 npm/? node/v24.1.0 darwin arm64",
    readEnvFile: () => `GOOGLE_API_KEY=${KEY}\n`,
    ...over,
  };
}

describe("runDoctor", () => {
  it("ครบทุกอย่าง → ผ่านหมด", async () => expect((await runDoctor(okDeps())).every((r) => r.ok)).toBe(true));
  it("Node 22 → ❌ บท 002", async () =>
    expect((await runDoctor(okDeps({ nodeVersion: "v22.12.0" })))[0]).toMatchObject({ ok: false, lesson: SETUP_LESSON }));
  it("ไม่ใช่ pnpm 12 → ❌ บท 002", async () => {
    const r = await runDoctor(okDeps({ userAgent: "npm/10.0.0 node/v24" }));
    expect(r[1]).toMatchObject({ ok: false, lesson: SETUP_LESSON });
  });
  it("ไม่มี .env → ❌ บท 002", async () => {
    const r = await runDoctor(okDeps({ readEnvFile: () => null }));
    expect(r[2]).toMatchObject({ ok: false, lesson: SETUP_LESSON });
  });
  it(".env มี BOM → ❌ บท 002", async () => {
    const r = await runDoctor(okDeps({ readEnvFile: () => `${BOM}# x\nGOOGLE_API_KEY=k` }));
    expect(r.find((x) => x.lesson === SETUP_LESSON && !x.ok)?.detail).toContain("BOM");
  });
  it("Google ตอบ 400 → ❌ บท 005 และไม่พิมพ์ key", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ google: 400 }) }));
    const g = r.find((x) => x.lesson === ENV_LESSON.GOOGLE_API_KEY)!;
    expect(g.ok).toBe(false);
    expect(formatResults(r)).not.toContain(KEY);
  });
  it("Google: key อยู่ใน header ไม่อยู่ใน URL", async () => {
    const calls: NonNullable<FakeOptions["calls"]> = [];
    await runDoctor(okDeps({ fetch: fakeFetch({ calls }) }));
    const g = calls.find((c) => c.url.includes("generativelanguage"))!;
    expect(g.headers["x-goog-api-key"]).toBe(KEY);
    expect(g.url).not.toContain(KEY);
  });
  it("Ollama Cloud: key อยู่ใน header Authorization ไม่อยู่ใน URL", async () => {
    const calls: NonNullable<FakeOptions["calls"]> = [];
    await runDoctor(okDeps({ env: { ...okEnv, OLLAMA_BASE_URL: "https://ollama.com", OLLAMA_API_KEY: CLOUD_KEY }, fetch: fakeFetch({ calls }) }));
    const c = calls.find((x) => x.url.endsWith("/api/tags"))!;
    expect(c.headers.Authorization).toBe(`Bearer ${CLOUD_KEY}`);
    expect(c.url).not.toContain(CLOUD_KEY);
  });
  it(".env มีตัวแปรซ้ำ → ❌ บอกชื่อตัวแปรและบท", async () => {
    const r = await runDoctor(okDeps({ readEnvFile: () => "OLLAMA_API_KEY=abc\nGOOGLE_API_KEY=x\nOLLAMA_API_KEY=\n" }));
    const e = r[2];
    expect(e).toMatchObject({ ok: false, lesson: ENV_LESSON.OLLAMA_API_KEY });
    expect(e.detail).toContain("OLLAMA_API_KEY");
    expect(e.detail).not.toContain("abc");
  });
  it(".env ที่ไม่ซ้ำ (บรรทัด # ไม่นับ) → ผ่าน", async () => {
    const r = await runDoctor(okDeps({ readEnvFile: () => "# OLLAMA_API_KEY=\nOLLAMA_API_KEY=abc\n" }));
    expect(r[2].ok).toBe(true);
  });
  it(".env.example บรรทัดแรกเป็น comment (ปลอดภัยจาก BOM)", () => {
    const text = fs.readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
    expect(text.startsWith("#")).toBe(true);
  });
  it(".env.example ไม่มีตัวแปรซ้ำ (ทั้งบรรทัดจริงและที่ comment ไว้)", () => {
    const text = fs.readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
    const keys = [...text.matchAll(/^#?\s*([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]);
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
  });
  it("Google ไม่มีโมเดลที่ตั้งไว้ → ❌ บท 005", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ googleModels: ["other"] }) }));
    expect(r.find((x) => x.lesson === ENV_LESSON.GOOGLE_API_KEY)?.ok).toBe(false);
  });
  it("Google ต่อไม่ได้ → ❌ บท 005 ไม่ crash", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ googleThrows: true }) }));
    expect(r.find((x) => x.lesson === ENV_LESSON.GOOGLE_API_KEY)?.ok).toBe(false);
  });
  it("ไม่ได้ตั้ง OLLAMA_BASE_URL → ❌ บท 003", async () => {
    const r = await runDoctor(okDeps({ env: { ...okEnv, OLLAMA_BASE_URL: undefined } }));
    expect(r.find((x) => x.lesson === ENV_LESSON.OLLAMA_BASE_URL)?.ok).toBe(false);
  });
  it("Ollama ในเครื่องไม่ได้เปิด → ❌ บท 003", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ ollamaThrows: true }) }));
    expect(r.find((x) => x.lesson === ENV_LESSON.OLLAMA_BASE_URL)?.detail).toContain("เปิดโปรแกรม Ollama");
  });
  it("ยังไม่ pull โมเดล → บอกคำสั่ง", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ ollamaModels: [] }) }));
    expect(r.find((x) => x.lesson === ENV_LESSON.OLLAMA_BASE_URL)?.detail).toContain("ollama pull");
  });
  it("Ollama Cloud key ผิด → ❌ บท 004", async () => {
    const r = await runDoctor(okDeps({ env: { ...okEnv, OLLAMA_BASE_URL: "https://ollama.com", OLLAMA_API_KEY: "bad" }, fetch: fakeFetch({ cloud: 401 }) }));
    expect(r.find((x) => x.lesson === ENV_LESSON.OLLAMA_API_KEY)?.ok).toBe(false);
  });
  it("Cloud 401 และ network ล้ม → ไม่พิมพ์ key", async () => {
    const env = { ...okEnv, OLLAMA_BASE_URL: "https://ollama.com", OLLAMA_API_KEY: CLOUD_KEY };
    const r401 = await runDoctor(okDeps({ env, fetch: fakeFetch({ cloud: 401 }) }));
    expect(formatResults(r401)).not.toContain(CLOUD_KEY);
    const down = await runDoctor(okDeps({ env, fetch: fakeFetch({ ollamaThrows: true, googleThrows: true }) }));
    const text = formatResults(down);
    expect(text).not.toContain(CLOUD_KEY);
    expect(text).not.toContain(KEY);
  });
  it("env ผิดรูปแบบ → ❌ ไม่ throw", async () => {
    const r = await runDoctor(okDeps({ env: { ...okEnv, OLLAMA_BASE_URL: "localhost" } }));
    expect(r.find((x) => x.lesson === ENV_LESSON.OLLAMA_BASE_URL)?.ok).toBe(false);
  });
});

describe("formatResults", () => {
  it("มีข้อไม่ผ่าน", () =>
    expect(formatResults([{ ok: true, label: "Node v24.1.0" }, { ok: false, label: "Google", detail: "key ไม่ถูกต้อง", lesson: "005" }]))
      .toBe("✅ Node v24.1.0\n❌ Google — key ไม่ถูกต้อง (ดูบท 005)\nยังมี 1 เรื่องต้องแก้"));
  it("ผ่านหมด", () => expect(formatResults([{ ok: true, label: "A" }])).toBe("✅ A\nพร้อมเรียนแล้ว"));
});
