import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startShim, type Shim } from "./opencode-shim";

const KEY = "sk-" + "fake" + "-test-value";
let upstream: http.Server;
let shim: Shim;
let seen: { headers: http.IncomingHttpHeaders; body: Record<string, unknown> }[] = [];

beforeAll(async () => {
  upstream = http.createServer((req, res) => {
    const parts: Buffer[] = [];
    req.on("data", (c: Buffer) => parts.push(c));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(parts).toString("utf8")) as Record<string, unknown>;
      seen.push({ headers: req.headers, body });
      res.setHeader("content-type", "application/json");
      if (JSON.stringify(body).includes("BAD")) {
        res.statusCode = 400;
        return res.end(`bad request for ${KEY}`);
      }
      res.end(JSON.stringify({
        choices: [{ finish_reason: "stop", message: { content: "สวัสดี", reasoning_content: "r" } }],
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

const post = (body: unknown) => fetch(`${shim.baseUrl}/api/chat`, { method: "POST", body: JSON.stringify(body) });

describe("opencode shim", () => {
  it("/api/tags", async () => {
    expect(await (await fetch(`${shim.baseUrl}/api/tags`)).json()).toEqual({ models: [{ name: "fake-model", model: "fake-model" }] });
  });
  it("stream:false ส่งหัวไป upstream", async () => {
    seen = [];
    const r = await (await post({ model: "x", stream: false, messages: [{ role: "user", content: "hi" }] })).json() as Record<string, unknown>;
    expect(r).toMatchObject({ done: true, prompt_eval_count: 3, eval_count: 4, message: { content: "สวัสดี" } });
    expect(seen[0].headers.authorization).toBe(`Bearer ${KEY}`);
    expect(seen[0].headers["x-opencode-session"]).toBeTruthy();
    expect(seen[0].body.model).toBe("fake-model");
  });
  it("stream เป็นค่าเริ่มต้น (NDJSON)", async () => {
    const text = await (await post({ model: "x", messages: [{ role: "user", content: "hi" }] })).text();
    const lines = text.trim().split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);
    expect(lines.at(-1)).toMatchObject({ done: true, eval_count: 4 });
    expect(lines[0]).toMatchObject({ done: false, message: { content: "สวัสดี" } });
  });
  it("upstream 400 ส่งต่อโดยไม่มี key", async () => {
    const res = await post({ model: "x", stream: false, messages: [{ role: "user", content: "BAD" }] });
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).not.toContain(KEY);
    expect(JSON.parse(text)).toHaveProperty("error");
  });
  it("path อื่น 404", async () => {
    const res = await fetch(`${shim.baseUrl}/nope`);
    expect(res.status).toBe(404);
    expect(await res.json()).toHaveProperty("error");
  });
});
