import http from "node:http";
import type { AddressInfo } from "node:net";
import type { AIMessage } from "@langchain/core/messages";
import { OutputParserException } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { startShim, type Shim } from "./opencode-shim";

const KEY = "sk-" + "fake" + "-test-value";
type Body = { tools: { function: { name: string } }[]; response_format?: unknown };
let upstream: http.Server;
let shim: Shim;
let seen: { body: Body }[] = [];
let reply: unknown = {};

beforeAll(async () => {
  upstream = http.createServer((req, res) => {
    const parts: Buffer[] = [];
    req.on("data", (c: Buffer) => parts.push(c));
    req.on("end", () => {
      seen.push({ body: JSON.parse(Buffer.concat(parts).toString("utf8")) as Body });
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(reply));
    });
  });
  await new Promise<void>((r) => upstream.listen(0, "127.0.0.1", r));
  shim = await startShim({ apiKey: KEY, model: "fake-model", upstreamUrl: `http://127.0.0.1:${(upstream.address() as AddressInfo).port}/v1/chat/completions` });
});
afterAll(async () => {
  await shim.close();
  upstream.close();
});

const chat = (extra: Record<string, unknown> = {}) => new ChatOllama({ model: "fake-model", baseUrl: shim.baseUrl, ...extra });

const Filter = z.object({ keyword: z.string().optional(), category: z.enum(["beans", "gifts"]).optional(), maxPrice: z.number().optional() });
const usage = { prompt_tokens: 5, completion_tokens: 6 };
const toolReply = (args: unknown) => ({ choices: [{ finish_reason: "tool_calls", message: { content: "", tool_calls: [
  { id: "call_1", type: "function", function: { name: "search_filter", arguments: JSON.stringify(args) } },
] } }], usage });
const textReply = (content: string) => ({ choices: [{ finish_reason: "stop", message: { content } }], usage });
const fc = { name: "search_filter", method: "functionCalling" } as const;

describe("structured output: ChatOllama กับ opencode shim", () => {
  it("functionCalling ได้ object และส่ง tools โดยไม่มี tool_choice", async () => {
    seen = [];
    reply = toolReply({ keyword: "แก้ว", maxPrice: 300 });
    expect(await chat().withStructuredOutput(Filter, fc).invoke("q")).toEqual({ keyword: "แก้ว", maxPrice: 300 });
    expect(seen[0].body.tools[0].function.name).toBe("search_filter");
    expect(seen[0].body).not.toHaveProperty("tool_choice");
  });
  it("ตอบเป็นข้อความ: ได้ undefined ไม่ throw · includeRaw ได้ parsed undefined และ raw.text", async () => {
    reply = textReply("ขอโทษครับ");
    expect(await chat().withStructuredOutput(Filter, fc).invoke("q")).toBeUndefined();
    const r = await chat().withStructuredOutput(Filter, { ...fc, includeRaw: true }).invoke("q");
    expect(r.parsed).toBeUndefined();
    expect(r.raw.text).toBe("ขอโทษครับ");
  });
  it("args ไม่ตรง schema: throw OutputParserException · includeRaw ได้ parsed null", async () => {
    reply = toolReply({ category: "shoes" });
    await expect(chat().withStructuredOutput(Filter, fc).invoke("q")).rejects.toBeInstanceOf(OutputParserException);
    const r = await chat().withStructuredOutput(Filter, { ...fc, includeRaw: true }).invoke("q");
    expect(r.parsed).toBeNull();
    expect((r.raw as AIMessage).tool_calls?.[0]?.args).toEqual({ category: "shoes" });
  });
  it("format: json ส่ง response_format json_object", async () => {
    seen = [];
    reply = textReply('{"keyword":"แก้ว"}');
    await chat({ format: "json" }).invoke("ขอ JSON");
    expect(seen[0].body.response_format).toEqual({ type: "json_object" });
  });
  it("method ค่าเริ่มต้น (jsonSchema) ส่ง response_format json_schema", async () => {
    seen = [];
    reply = textReply('{"keyword":"แก้ว"}');
    expect(await chat().withStructuredOutput(Filter).invoke("q")).toEqual({ keyword: "แก้ว" });
    expect((seen[0].body.response_format as { type: string }).type).toBe("json_schema");
  });
});
