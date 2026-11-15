// Instructor-only: translate Ollama /api/chat payloads to and from OpenAI chat completions.
export interface OllamaChatRequest {
  model: string;
  messages: { role: string; content: string; tool_calls?: unknown[]; tool_name?: string }[];
  stream?: boolean;
  format?: unknown;
  tools?: unknown[];
  options?: { temperature?: number; num_predict?: number; [k: string]: unknown };
}

type Json = Record<string, unknown>;

function isObject(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function toOpenAIRequest(req: OllamaChatRequest, model: string): Record<string, unknown> {
  let counter = 0;
  const pending: string[] = [];
  const messages = req.messages.map((m) => {
    if (m.role === "assistant" && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      const tool_calls = m.tool_calls.map((tc) => {
        const fn = isObject(tc) && isObject(tc.function) ? tc.function : {};
        const id = `call_${++counter}`;
        pending.push(id);
        const args = fn.arguments;
        return {
          id,
          type: "function",
          function: { name: fn.name, arguments: typeof args === "string" ? args : JSON.stringify(args ?? {}) },
        };
      });
      return { role: "assistant", content: m.content ?? "", tool_calls };
    }
    if (m.role === "tool") {
      const id = pending.shift() ?? `call_${++counter}`;
      return { role: "tool", tool_call_id: id, content: m.content };
    }
    return { role: m.role, content: m.content };
  });

  const body: Record<string, unknown> = { model, messages, stream: false };
  if (isObject(req.format)) {
    body.response_format = { type: "json_schema", json_schema: { name: "response", schema: req.format, strict: false } };
  } else if (req.format === "json") {
    body.response_format = { type: "json_object" };
  }
  if (req.tools && req.tools.length > 0) body.tools = req.tools;
  if (typeof req.options?.temperature === "number") body.temperature = req.options.temperature;
  if (typeof req.options?.num_predict === "number") body.max_tokens = req.options.num_predict;
  return body;
}

function doneReason(finish: unknown): string {
  return finish === "length" ? "length" : "stop";
}

function buildMessage(upstream: Json): { message: Json; finish: unknown } {
  const choices = Array.isArray(upstream.choices) ? upstream.choices : [];
  const choice = isObject(choices[0]) ? choices[0] : {};
  const msg = isObject(choice.message) ? choice.message : {};
  const message: Json = { role: "assistant", content: typeof msg.content === "string" ? msg.content : "" };
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
    message.tool_calls = msg.tool_calls.map((tc) => {
      const fn = isObject(tc) && isObject(tc.function) ? tc.function : {};
      let args: unknown = fn.arguments;
      if (typeof args === "string") {
        try { args = JSON.parse(args); } catch { args = {}; }
      }
      return { function: { name: fn.name, arguments: isObject(args) ? args : {} } };
    });
  }
  return { message, finish: choice.finish_reason };
}

function usageOf(upstream: Json): { prompt_eval_count: number; eval_count: number } {
  const u = isObject(upstream.usage) ? upstream.usage : {};
  return {
    prompt_eval_count: typeof u.prompt_tokens === "number" ? u.prompt_tokens : 0,
    eval_count: typeof u.completion_tokens === "number" ? u.completion_tokens : 0,
  };
}

export function toOllamaResponse(upstream: unknown, model: string): Record<string, unknown> {
  const up = isObject(upstream) ? upstream : {};
  const { message, finish } = buildMessage(up);
  return {
    model,
    created_at: new Date().toISOString(),
    message,
    done: true,
    done_reason: doneReason(finish),
    ...usageOf(up),
  };
}

// Non-streaming upstream result rendered as NDJSON: one content chunk, then one done chunk.
export function toOllamaStreamChunks(upstream: unknown, model: string): string[] {
  const full = toOllamaResponse(upstream, model);
  const message = full.message as Json;
  const first = { model, created_at: full.created_at, message, done: false };
  const last = {
    model, created_at: full.created_at, message: { role: "assistant", content: "" },
    done: true, done_reason: full.done_reason, prompt_eval_count: full.prompt_eval_count, eval_count: full.eval_count,
  };
  return [JSON.stringify(first) + "\n", JSON.stringify(last) + "\n"];
}
