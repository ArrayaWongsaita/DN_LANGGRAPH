import http from "node:http";
import type { AddressInfo } from "node:net";
import { ChatOllama } from "@langchain/ollama";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startShim, type Shim } from "./opencode-shim";

const KEY = "sk-" + "fake" + "-test-value";
const ANSWER = "น้ำเปล่าเย็นๆ ขวดละสิบห้าบาท ซื้อสองขวดลดเหลือยี่สิบห้าบาท และถ้าซื้อครบสิบขวดแถมฟรีอีกหนึ่งขวดครับ";
let upstream: http.Server;
let shim: Shim;
let seen: { body: Record<string, unknown> }[] = [];

beforeAll(async () => {
  upstream = http.createServer((req, res) => {
    const parts: Buffer[] = [];
    req.on("data", (c: Buffer) => parts.push(c));
    req.on("end", () => {
      seen.push({ body: JSON.parse(Buffer.concat(parts).toString("utf8")) as Record<string, unknown> });
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({
        choices: [{ finish_reason: "stop", message: { content: ANSWER, reasoning_content: "คิดก่อนตอบ" } }],
        usage: { prompt_tokens: 3, completion_tokens: 4 },
      }));
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

describe("ChatOllama กับ opencode shim", () => {
  it("invoke ได้ .text, usage_metadata และ done_reason", async () => {
    const res = await chat().invoke("hi");
    expect(res.text).toBe(ANSWER);
    expect(res.usage_metadata).toMatchObject({ input_tokens: 3, output_tokens: 4, total_tokens: 7 });
    expect(res.response_metadata.done_reason).toBe("stop");
    expect(res.contentBlocks.some((b) => b.type === "reasoning")).toBe(false);
  });
  it("stream ได้ 3 ชิ้นขึ้นไป ต่อกันแล้วเท่าคำตอบเต็ม", async () => {
    const texts: string[] = [];
    for await (const c of await chat().stream("hi")) if (c.text !== "") texts.push(c.text);
    expect(texts.length).toBeGreaterThanOrEqual(3);
    expect(texts.join("")).toBe(ANSWER);
  });
  it("think: true ได้ reasoning block · think: false ส่ง thinking disabled", async () => {
    const on = await chat({ think: true }).invoke("hi");
    expect(on.contentBlocks.find((b) => b.type === "reasoning")).toMatchObject({ reasoning: "คิดก่อนตอบ" });
    expect(on.text).toBe(ANSWER);
    seen = [];
    await chat({ think: false }).invoke("hi");
    expect(seen[0].body.thinking).toEqual({ type: "disabled" });
  });
  it("ชื่อโมเดลผิดได้ ResponseError 404", async () => {
    await expect(chat({ model: "fake-model-not-real" }).invoke("hi")).rejects.toMatchObject({ status_code: 404 });
  });
  it("abort กลาง stream ได้ AbortError", async () => {
    const controller = new AbortController();
    let n = 0;
    const run = async () => {
      for await (const c of await chat().stream("hi", { signal: controller.signal })) {
        if (c.text !== "" && ++n === 2) controller.abort();
      }
    };
    await expect(run()).rejects.toMatchObject({ name: "AbortError" });
  });
  it("numPredict กลายเป็น max_tokens", async () => {
    seen = [];
    await chat({ numPredict: 20 }).invoke("hi");
    expect(seen[0].body.max_tokens).toBe(20);
  });
});
