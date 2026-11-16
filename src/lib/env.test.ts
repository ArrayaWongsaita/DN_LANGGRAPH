import { describe, expect, it } from "vitest";
import { env, optionalEnv, isOllamaCloudDirect, EnvError, ENV_LESSON } from "./env";

describe("env", () => {
  it("ตัดช่องว่างหน้าหลัง", () => expect(env("GOOGLE_MODEL", { GOOGLE_MODEL: "  m1  " })).toBe("m1"));
  it("ไม่มีค่า → EnvError บอกชื่อและบท", () => {
    expect(() => env("GOOGLE_API_KEY", {})).toThrow(EnvError);
    expect(() => env("GOOGLE_API_KEY", {})).toThrow(`ยังไม่ได้ตั้งค่า GOOGLE_API_KEY ในไฟล์ .env (ดูวิธีตั้งในบท ${ENV_LESSON.GOOGLE_API_KEY})`);
  });
  it("มีแต่ช่องว่าง = ไม่มีค่า", () => expect(() => env("OLLAMA_MODEL", { OLLAMA_MODEL: "   " })).toThrow(`บท ${ENV_LESSON.OLLAMA_MODEL}`));
  it("ตัด / ท้าย OLLAMA_BASE_URL", () =>
    expect(env("OLLAMA_BASE_URL", { OLLAMA_BASE_URL: "http://localhost:11434/" })).toBe("http://localhost:11434"));
  it("OLLAMA_BASE_URL ไม่มี http → ผิด", () =>
    expect(() => env("OLLAMA_BASE_URL", { OLLAMA_BASE_URL: "localhost:11434" })).toThrow(new RegExp(`ค่า OLLAMA_BASE_URL ในไฟล์ \\.env ไม่ถูกต้อง.*\\(ดูบท ${ENV_LESSON.OLLAMA_BASE_URL}\\)`)));
  it("LLM_PROVIDER ต้องเป็น ollama หรือ google", () =>
    expect(() => env("LLM_PROVIDER", { LLM_PROVIDER: "openai" })).toThrow(`(ดูบท ${ENV_LESSON.LLM_PROVIDER})`));
  it("OLLAMA_NUM_CTX ต้องเป็นจำนวนเต็มบวก", () => {
    expect(() => env("OLLAMA_NUM_CTX", { OLLAMA_NUM_CTX: "abc" })).toThrow(EnvError);
    expect(env("OLLAMA_NUM_CTX", { OLLAMA_NUM_CTX: "32768" })).toBe("32768");
  });
  it("LANGSMITH_TRACING ต้องเป็น true หรือ false", () =>
    expect(() => env("LANGSMITH_TRACING", { LANGSMITH_TRACING: "yes" })).toThrow(EnvError));
  it("optionalEnv ไม่มีค่า → undefined แต่ค่าผิดยัง throw", () => {
    expect(optionalEnv("OLLAMA_API_KEY", {})).toBeUndefined();
    expect(() => optionalEnv("EMBEDDINGS_PROVIDER", { EMBEDDINGS_PROVIDER: "x" })).toThrow(EnvError);
  });
  it("EnvError มีชื่อ variable lesson", () => {
    expect.assertions(3);
    try { env("GOOGLE_MODEL", {}); } catch (e) {
      expect((e as EnvError).name).toBe("EnvError");
      expect((e as EnvError).variable).toBe("GOOGLE_MODEL");
      expect((e as EnvError).lesson).toBe(ENV_LESSON.GOOGLE_MODEL);
    }
  });
  it("ทุกตัวแปรมีเลขบท", () => expect(Object.keys(ENV_LESSON)).toHaveLength(16));
  it("isOllamaCloudDirect", () => {
    expect(isOllamaCloudDirect("https://ollama.com")).toBe(true);
    expect(isOllamaCloudDirect("http://localhost:11434")).toBe(false);
  });
});
