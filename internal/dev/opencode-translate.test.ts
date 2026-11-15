import { describe, expect, it } from "vitest";
import { toOllamaResponse, toOllamaStreamChunks, toOpenAIRequest } from "./opencode-translate";

describe("toOpenAIRequest", () => {
  it("แปลง format schema เป็น response_format และ options", () => {
    const schema = { type: "object", properties: { a: { type: "string" } } };
    const out = toOpenAIRequest({
      model: "x", messages: [{ role: "user", content: "hi" }], format: schema,
      options: { temperature: 0.2, num_predict: 50, num_ctx: 8192 },
    }, "m");
    expect(out.model).toBe("m");
    expect(out.response_format).toEqual({ type: "json_schema", json_schema: { name: "response", schema, strict: false } });
    expect(out.temperature).toBe(0.2);
    expect(out.max_tokens).toBe(50);
    expect(JSON.stringify(out)).not.toContain("num_ctx");
  });
  it("format json", () => {
    expect(toOpenAIRequest({ model: "x", messages: [], format: "json" }, "m").response_format).toEqual({ type: "json_object" });
  });
  it("ส่งต่อ tools และจับคู่ tool_call_id", () => {
    const tools = [{ type: "function", function: { name: "f", parameters: {} } }];
    const out = toOpenAIRequest({
      model: "x", tools,
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
