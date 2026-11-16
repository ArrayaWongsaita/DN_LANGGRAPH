import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { filesForProvider, opencodeDevConfig, providerEnv, runOnce } from "./runner";
import type { Lesson } from "./types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let dir: string;
let lesson: Lesson;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "dn-verify-test-"));
  lesson = { number: "001", slug: "t", dir };
  fs.writeFileSync(path.join(dir, "package.json"), '{"type":"module"}');
  fs.writeFileSync(path.join(dir, "echo.ts"),
    'import readline from "node:readline";\nconst rl = readline.createInterface({ input: process.stdin });\nfor await (const line of rl) { console.log(`ได้รับ: ${line}`); break; }\n');
  fs.writeFileSync(path.join(dir, "chat-input.ts"),
    'import { ask } from ' + JSON.stringify(pathToFileURL(path.join(root, "src", "lib", "ask.ts")).href) +
    ';\nwhile (true) {\n  const line = await ask("> ");\n  if (line === null || line === "จบ") break;\n  console.log(`ได้: ${line}`);\n}\n');
  fs.writeFileSync(path.join(dir, "hang.ts"), "setInterval(() => undefined, 1000);\n");
  fs.writeFileSync(path.join(dir, "chat.ts"),
    'const r = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, { method: "POST", body: "{}" });\nconsole.log(JSON.stringify(await r.json()));\n');
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

const noop = () => undefined;

describe("providerEnv", () => {
  it("google", () => expect(providerEnv("google", {})).toEqual({ LLM_PROVIDER: "google" }));
  it("ollama-cloud", () =>
    expect(providerEnv("ollama-cloud", { VERIFY_OLLAMA_CLOUD_API_KEY: "k", VERIFY_OLLAMA_CLOUD_MODEL: "m" }))
      .toEqual({ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "https://ollama.com", OLLAMA_API_KEY: "k", OLLAMA_MODEL: "m" }));
  it("ollama local", () =>
    expect(providerEnv("ollama", { VERIFY_OLLAMA_LOCAL_MODEL: "m", VERIFY_OLLAMA_LOCAL_NUM_CTX: "8192" }))
      .toEqual({ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://localhost:11434", OLLAMA_API_KEY: "", OLLAMA_MODEL: "m", OLLAMA_NUM_CTX: "8192" }));
  it("opencode-dev", () =>
    expect(providerEnv("opencode-dev", { DN_OPENCODE_SHIM_URL: "http://127.0.0.1:1", OPENCODE_API_KEY: "a", OPENCODE_DEV_MODEL: "m" }))
      .toEqual({ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://127.0.0.1:1", OLLAMA_MODEL: "m", GOOGLE_MODEL: "dev-placeholder" }));
  it("opencode-dev ขาด env ให้ข้อความไทย", () => {
    expect(() => opencodeDevConfig({})).toThrow(/ยังไม่ได้ตั้งค่า OPENCODE_API_KEY, OPENCODE_DEV_MODEL/);
    expect(opencodeDevConfig({ OPENCODE_API_KEY: "a", OPENCODE_DEV_MODEL: "m" })).toEqual({ apiKey: "a", model: "m" });
  });
  it("ขาดตัวแปร", () => expect(() => providerEnv("ollama", {})).toThrow("VERIFY_OLLAMA_LOCAL_MODEL"));
});

describe("filesForProvider", () => {
  it("opencode-dev เท่ากับ ollama", () => {
    const files = ["example.google", "example.ollama", "exercise-1"];
    expect(filesForProvider(files, "opencode-dev")).toEqual(filesForProvider(files, "ollama"));
  });
  it("ollama-cloud", () =>
    expect(filesForProvider(["example.google", "example.ollama", "exercise-1"], "ollama-cloud")).toEqual(["example.ollama", "exercise-1"]));
  it("google", () =>
    expect(filesForProvider(["example.google", "example.ollama", "exercise-1"], "google")).toEqual(["example.google", "exercise-1"]));
});

describe("runOnce", () => {
  it("เก็บ stdout และส่ง input เข้า stdin", async () => {
    const r = await runOnce({ root, lesson, file: "echo", provider: "google", attempt: 1, check: { input: ["สวัสดี"], check: noop }, env: {} });
    expect(r.stdout).toContain("ได้รับ: สวัสดี");
    expect(r.exitCode).toBe(0);
    expect(r.timedOut).toBe(false);
  }, 30000);
  it("input ส่งผ่าน ask() ได้ครบทุกบรรทัด", async () => {
    const r = await runOnce({ root, lesson, file: "chat-input", provider: "google", attempt: 1, check: { input: ["ก", "ข", "จบ", "ค"], check: noop }, env: {} });
    expect(r.stdout).toContain("ได้: ก");
    expect(r.stdout).toContain("ได้: ข");
    expect(r.stdout).not.toContain("ได้: ค");
    expect(r.exitCode).toBe(0);
  }, 30000);
  it("ตัดเมื่อเกินเวลา", async () => {
    const r = await runOnce({ root, lesson, file: "hang", provider: "google", attempt: 1, check: { timeoutMs: 500, check: noop }, env: {} });
    expect(r.timedOut).toBe(true);
  }, 30000);
  it("นับ token ผ่าน hook", async () => {
    const server = http.createServer((_req, res) => {
      res.setHeader("content-type", "application/json");
      res.end('{"done":true,"prompt_eval_count":10,"eval_count":5}');
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const r = await runOnce({ root, lesson, file: "chat", provider: "ollama", attempt: 1, check: { check: noop }, env: { OLLAMA_BASE_URL: url } });
      expect(r.exitCode).toBe(0);
      expect(r.usage).toEqual({ input: 10, output: 5 });
    } finally {
      server.close();
    }
  }, 30000);
});
