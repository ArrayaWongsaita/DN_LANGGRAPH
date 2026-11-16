// Instructor-only: local Ollama-compatible HTTP server that forwards to opencode (OpenAI-compatible).
import http from "node:http";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { toOllamaResponse, toOllamaStreamChunks, toOpenAIRequest, type OllamaChatRequest } from "./opencode-translate";

const DEFAULT_UPSTREAM = "https://opencode.ai/inference/go/openai/v1/chat/completions";

export interface Shim { baseUrl: string; close(): Promise<void> }

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = [];
    req.on("data", (c: Buffer) => parts.push(c));
    req.on("end", () => resolve(Buffer.concat(parts).toString("utf8")));
    req.on("error", reject);
  });
}

export function startShim(opts: { apiKey: string; model: string; upstreamUrl?: string; port?: number }): Promise<Shim> {
  const { apiKey, model } = opts;
  const upstreamUrl = opts.upstreamUrl ?? DEFAULT_UPSTREAM;
  const session = randomUUID();
  const scrub = (s: string) => s.split(apiKey).join("***");

  const server = http.createServer((req, res) => {
    void (async () => {
      try {
        const path = (req.url ?? "").split("?")[0];
        if (req.method === "GET" && path === "/api/tags") {
          return sendJson(res, 200, { models: [{ name: model, model }] });
        }
        if (req.method === "POST" && path === "/api/chat") {
          let parsed: OllamaChatRequest;
          try { parsed = JSON.parse(await readBody(req)) as OllamaChatRequest; }
          catch { return sendJson(res, 400, { error: "invalid JSON body" }); }
          if (parsed.model !== model) {
            return sendJson(res, 404, { error: `model "${parsed.model}" not found, try pulling it first` });
          }
          const upstream = await fetch(upstreamUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${apiKey}`,
              "x-opencode-session": session,
            },
            body: JSON.stringify(toOpenAIRequest(parsed, model)),
          });
          const text = await upstream.text();
          if (!upstream.ok) {
            return sendJson(res, upstream.status, { error: scrub(`upstream ${upstream.status}: ${text.slice(0, 500)}`) });
          }
          const json: unknown = JSON.parse(text);
          if (parsed.stream === false) return sendJson(res, 200, toOllamaResponse(json, model, { think: parsed.think }));
          res.writeHead(200, { "content-type": "application/x-ndjson" });
          for (const line of toOllamaStreamChunks(json, model, { think: parsed.think })) res.write(line);
          return res.end();
        }
        return sendJson(res, 404, { error: `not found: ${path}` });
      } catch (e) {
        if (!res.headersSent) sendJson(res, 502, { error: scrub(e instanceof Error ? e.message : String(e)) });
        else res.end();
      }
    })();
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(opts.port ?? 0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => { server.close(() => r()); server.closeAllConnections(); }),
      });
    });
  });
}
