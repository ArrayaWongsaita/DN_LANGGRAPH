import { describe, expect, it } from "vitest";
import { addUsage, parseGeminiUsage, parseOllamaUsage } from "./usage";

describe("usage", () => {
  it("Ollama JSON", () => expect(parseOllamaUsage('{"done":true,"prompt_eval_count":10,"eval_count":5}')).toEqual({ input: 10, output: 5 }));
  it("Ollama NDJSON stream", () =>
    expect(parseOllamaUsage('{"message":{"content":"ก"},"done":false}\n{"done":true,"prompt_eval_count":10,"eval_count":5}\n')).toEqual({ input: 10, output: 5 }));
  it("Ollama embed", () => expect(parseOllamaUsage('{"embeddings":[[0.1]],"prompt_eval_count":4}')).toEqual({ input: 4, output: 0 }));
  it("ไม่มีตัวเลข → null", () => expect(parseOllamaUsage("not json")).toBeNull());
  it("Gemini JSON", () =>
    expect(parseGeminiUsage('{"usageMetadata":{"promptTokenCount":7,"candidatesTokenCount":3,"thoughtsTokenCount":2}}')).toEqual({ input: 7, output: 5 }));
  it("Gemini SSE ใช้ตัวสุดท้าย", () =>
    expect(parseGeminiUsage('data: {"usageMetadata":{"promptTokenCount":7,"candidatesTokenCount":1}}\n\ndata: {"usageMetadata":{"promptTokenCount":7,"candidatesTokenCount":9}}\n\n')).toEqual({ input: 7, output: 9 }));
  it("Gemini JSON array", () =>
    expect(parseGeminiUsage('[{"usageMetadata":{"promptTokenCount":1,"candidatesTokenCount":1}},{"usageMetadata":{"promptTokenCount":2,"candidatesTokenCount":3}}]')).toEqual({ input: 2, output: 3 }));
  it("Gemini ไม่มี usageMetadata → null", () => expect(parseGeminiUsage('{"a":1}')).toBeNull());
  it("addUsage", () => {
    expect(addUsage({ input: 1, output: 2 }, null)).toEqual({ input: 1, output: 2 });
    expect(addUsage(null, null)).toBeNull();
    expect(addUsage({ input: 1, output: 2 }, { input: 3, output: 4 })).toEqual({ input: 4, output: 6 });
  });
});
