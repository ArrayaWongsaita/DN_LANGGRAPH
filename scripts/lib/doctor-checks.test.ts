import { describe, expect, it } from "vitest";
import { formatResults, runDoctor, type DoctorDeps } from "./doctor-checks";

const KEY = "AIzaFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE123";
const BOM = "﻿";
const okEnv = {
  GOOGLE_API_KEY: KEY,
  GOOGLE_MODEL: "gemini-test",
  OLLAMA_BASE_URL: "http://localhost:11434",
  OLLAMA_MODEL: "qwen-test",
};

interface FakeOptions { google?: number; googleModels?: string[]; ollamaThrows?: boolean; ollamaModels?: string[]; cloud?: number; googleThrows?: boolean }

function fakeFetch(o: FakeOptions = {}): typeof fetch {
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  return ((input: string | URL | Request): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
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
    expect((await runDoctor(okDeps({ nodeVersion: "v22.12.0" })))[0]).toMatchObject({ ok: false, lesson: "002" }));
  it("ไม่ใช่ pnpm 12 → ❌ บท 002", async () => {
    const r = await runDoctor(okDeps({ userAgent: "npm/10.0.0 node/v24" }));
    expect(r[1]).toMatchObject({ ok: false, lesson: "002" });
  });
  it("ไม่มี .env → ❌ บท 002", async () => {
    const r = await runDoctor(okDeps({ readEnvFile: () => null }));
    expect(r[2]).toMatchObject({ ok: false, lesson: "002" });
  });
  it(".env มี BOM → ❌ บท 002", async () => {
    const r = await runDoctor(okDeps({ readEnvFile: () => `${BOM}# x\nGOOGLE_API_KEY=k` }));
    expect(r.find((x) => x.lesson === "002" && !x.ok)?.detail).toContain("BOM");
  });
  it("Google ตอบ 400 → ❌ บท 005 และไม่พิมพ์ key", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ google: 400 }) }));
    const g = r.find((x) => x.lesson === "005")!;
    expect(g.ok).toBe(false);
    expect(formatResults(r)).not.toContain(KEY);
  });
  it("Google ไม่มีโมเดลที่ตั้งไว้ → ❌ บท 005", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ googleModels: ["other"] }) }));
    expect(r.find((x) => x.lesson === "005")?.ok).toBe(false);
  });
  it("Google ต่อไม่ได้ → ❌ บท 005 ไม่ crash", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ googleThrows: true }) }));
    expect(r.find((x) => x.lesson === "005")?.ok).toBe(false);
  });
  it("ไม่ได้ตั้ง OLLAMA_BASE_URL → ❌ บท 003", async () => {
    const r = await runDoctor(okDeps({ env: { ...okEnv, OLLAMA_BASE_URL: undefined } }));
    expect(r.find((x) => x.lesson === "003")?.ok).toBe(false);
  });
  it("Ollama ในเครื่องไม่ได้เปิด → ❌ บท 003", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ ollamaThrows: true }) }));
    expect(r.find((x) => x.lesson === "003")?.detail).toContain("เปิดโปรแกรม Ollama");
  });
  it("ยังไม่ pull โมเดล → บอกคำสั่ง", async () => {
    const r = await runDoctor(okDeps({ fetch: fakeFetch({ ollamaModels: [] }) }));
    expect(r.find((x) => x.lesson === "003")?.detail).toContain("ollama pull");
  });
  it("Ollama Cloud key ผิด → ❌ บท 004", async () => {
    const r = await runDoctor(okDeps({ env: { ...okEnv, OLLAMA_BASE_URL: "https://ollama.com", OLLAMA_API_KEY: "bad" }, fetch: fakeFetch({ cloud: 401 }) }));
    expect(r.find((x) => x.lesson === "004")?.ok).toBe(false);
  });
  it("env ผิดรูปแบบ → ❌ ไม่ throw", async () => {
    const r = await runDoctor(okDeps({ env: { ...okEnv, OLLAMA_BASE_URL: "localhost" } }));
    expect(r.find((x) => x.lesson === "003")?.ok).toBe(false);
  });
});

describe("formatResults", () => {
  it("มีข้อไม่ผ่าน", () =>
    expect(formatResults([{ ok: true, label: "Node v24.1.0" }, { ok: false, label: "Google", detail: "key ไม่ถูกต้อง", lesson: "005" }]))
      .toBe("✅ Node v24.1.0\n❌ Google — key ไม่ถูกต้อง (ดูบท 005)\nยังมี 1 เรื่องต้องแก้"));
  it("ผ่านหมด", () => expect(formatResults([{ ok: true, label: "A" }])).toBe("✅ A\nพร้อมเรียนแล้ว"));
});
