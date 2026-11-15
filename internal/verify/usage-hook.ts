import fs from "node:fs";
import { addUsage, parseGeminiUsage, parseOllamaUsage } from "./usage";
import type { TokenUsage } from "./types";

let total: TokenUsage | null = null;
const originalFetch = globalThis.fetch;

function urlOf(input: Parameters<typeof fetch>[0]): URL | null {
  try {
    const s = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return new URL(s);
  } catch {
    return null;
  }
}

globalThis.fetch = async (input, init) => {
  const response = await originalFetch(input, init);
  const url = urlOf(input);
  if (url) {
    const gemini = url.hostname === "generativelanguage.googleapis.com";
    const ollama = /\/api\/(chat|generate|embed)$/.test(url.pathname);
    if (gemini || ollama) {
      response.clone().text().then(
        (body) => { total = addUsage(total, gemini ? parseGeminiUsage(body) : parseOllamaUsage(body)); },
        () => undefined,
      );
    }
  }
  return response;
};

process.on("exit", () => {
  const file = process.env.DN_USAGE_FILE;
  if (!file || !total) return;
  try { fs.writeFileSync(file, JSON.stringify(total)); } catch { /* ignore */ }
});
