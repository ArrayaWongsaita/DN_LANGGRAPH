import { describe, expect, it } from "vitest";
import { STREAM_CHUNK_GRAPHEMES, splitGraphemes, toOllamaResponse, toOllamaStreamChunks, toOpenAIRequest } from "./opencode-translate";

describe("toOpenAIRequest", () => {
  it("แปลง format schema เป็น response_format และ options", () => {
    const schema = { type: "object", properties: { a: { type: "string" } } };
    const out = toOpenAIRequest({
      model: "fake-model", messages: [{ role: "user", content: "hi" }], format: schema,
      options: { temperature: 0.2, num_predict: 50, num_ctx: 8192 },
    }, "m");
    expect(out.model).toBe("m");
    expect(out.response_format).toEqual({ type: "json_schema", json_schema: { name: "response", schema, strict: false } });
    expect(out.temperature).toBe(0.2);
    expect(out.max_tokens).toBe(50);
    expect(JSON.stringify(out)).not.toContain("num_ctx");
  });
  it("format json", () => {
    expect(toOpenAIRequest({ model: "fake-model", messages: [], format: "json" }, "m").response_format).toEqual({ type: "json_object" });
  });
  it("ส่งต่อ tools และจับคู่ tool_call_id", () => {
    const tools = [{ type: "function", function: { name: "f", parameters: {} } }];
    const out = toOpenAIRequest({
      model: "fake-model", tools,
      messages: [
        { role: "user", content: "q" },
        { role: "assistant", content: "", tool_calls: [{ function: { name: "f", arguments: { n: 1 } } }] },
        { role: "tool", content: "42", tool_name: "f" },
      ],
    }, "m");
    expect(out.tools).toEqual(tools);
    const msgs = out.messages as { role: string; tool_call_id?: string; tool_calls?: { id: string; function: { arguments: string } }[] }[];
    expect(msgs[1].tool_calls?.[0].function.arguments).toBe('{"n":1}');
    expect(msgs[2].tool_call_id).toBe(msgs[1].tool_calls?.[0].id);
  });
});

describe("toOllamaResponse", () => {
  const upstream = {
    choices: [{ finish_reason: "tool_calls", message: { content: "ok", reasoning_content: "think", tool_calls: [{ id: "c", type: "function", function: { name: "f", arguments: '{"n":1}' } }] } }],
    usage: { prompt_tokens: 7, completion_tokens: 9 },
  };
  it("คืน token, done_reason และ tool_calls เป็น object", () => {
    const r = toOllamaResponse(upstream, "m") as { message: { content: string; tool_calls: unknown[] } };
    expect(r).toMatchObject({ model: "m", done: true, done_reason: "stop", prompt_eval_count: 7, eval_count: 9 });
    expect(r.message.content).toBe("ok");
    expect(r.message.tool_calls).toEqual([{ function: { name: "f", arguments: { n: 1 } } }]);
    expect(JSON.stringify(r)).not.toContain("think");
  });
  it("length", () => {
    expect(toOllamaResponse({ choices: [{ finish_reason: "length", message: { content: "" } }] }, "m").done_reason).toBe("length");
  });
  it("stream chunks", () => {
    const lines = toOllamaStreamChunks(upstream, "m").map((l) => JSON.parse(l) as Record<string, unknown>);
    expect(lines).toHaveLength(2);
    expect(lines[0].done).toBe(false);
    expect(lines[1]).toMatchObject({ done: true, prompt_eval_count: 7, eval_count: 9 });
  });
});

const LONG = "น้ำเปล่าเย็นๆ ขวดละสิบห้าบาท ซื้อสองขวดลดเหลือยี่สิบห้าบาทครับ";
type Line = { done: boolean; message: { content: string; thinking?: string; tool_calls?: unknown[] }; eval_count?: number };
const parse = (ls: string[]) => ls.map((l) => JSON.parse(l) as Line);

describe("think / stream chunks", () => {
  it("think: false ส่ง thinking disabled ไป upstream", () => {
    expect(toOpenAIRequest({ model: "m", messages: [], think: false }, "m").thinking).toEqual({ type: "disabled" });
    expect(toOpenAIRequest({ model: "m", messages: [], think: true }, "m")).not.toHaveProperty("thinking");
    expect(toOpenAIRequest({ model: "m", messages: [] }, "m")).not.toHaveProperty("thinking");
  });
  it("think: true คืน message.thinking", () => {
    const up = { choices: [{ finish_reason: "stop", message: { content: "ตอบ", reasoning_content: "คิด" } }] };
    expect((toOllamaResponse(up, "m", { think: true }).message as Record<string, unknown>).thinking).toBe("คิด");
    expect(toOllamaResponse(up, "m").message).not.toHaveProperty("thinking");
  });
  it("stream แตกเป็นหลายชิ้นตาม grapheme และไม่ตัดกลางสระ", () => {
    const lines = parse(toOllamaStreamChunks({ choices: [{ message: { content: LONG } }], usage: { prompt_tokens: 3, completion_tokens: 4 } }, "m"));
    const pieces = lines.filter((l) => !l.done).map((l) => l.message.content);
    expect(pieces.length).toBe(Math.ceil(splitGraphemes(LONG, 1).length / STREAM_CHUNK_GRAPHEMES));
    expect(pieces.join("")).toBe(LONG);
    for (const p of pieces) expect(p).not.toMatch(/^[ัิ-ฺ็-๎]/);
    expect(lines.at(-1)).toMatchObject({ done: true, eval_count: 4 });
    expect(lines.slice(0, -1).every((l) => l.eval_count === undefined)).toBe(true);
  });
  it("ชิ้น thinking มาก่อน content เมื่อ think: true", () => {
    const up = { choices: [{ message: { content: "ตอบ", reasoning_content: "คิด" } }] };
    const on = parse(toOllamaStreamChunks(up, "m", { think: true }));
    expect(on[0]).toMatchObject({ done: false, message: { content: "", thinking: "คิด" } });
    expect(on[1]).toMatchObject({ message: { content: "ตอบ" } });
    const off = parse(toOllamaStreamChunks(up, "m"));
    expect(off.some((l) => l.message.thinking !== undefined)).toBe(false);
  });
  it("tool_calls อยู่ในชิ้น content สุดท้าย", () => {
    const up = { choices: [{ message: { content: "", tool_calls: [{ function: { name: "f", arguments: "{}" } }] } }] };
    const lines = parse(toOllamaStreamChunks(up, "m"));
    const open = lines.filter((l) => !l.done);
    expect(open).toHaveLength(1);
    expect(open[0].message.tool_calls).toHaveLength(1);
    expect(lines.at(-1)?.done).toBe(true);
  });
});
