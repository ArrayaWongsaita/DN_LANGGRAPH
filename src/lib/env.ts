// อ่านค่าจากไฟล์ .env ผ่านฟังก์ชันนี้เท่านั้น: ตัดช่องว่าง ตรวจรูปแบบ และบอกเลขบทเมื่อผิด
export type EnvName =
  | "LLM_PROVIDER" | "OLLAMA_BASE_URL" | "OLLAMA_API_KEY" | "OLLAMA_MODEL" | "OLLAMA_NUM_CTX"
  | "OLLAMA_EMBED_MODEL" | "GOOGLE_API_KEY" | "GOOGLE_MODEL" | "EMBEDDINGS_PROVIDER"
  | "FALLBACK_PROVIDERS" | "LANGSMITH_TRACING" | "LANGSMITH_API_KEY" | "DATABASE_URL"
  | "WEB_PASSWORD" | "WEB_MESSAGE_LIMIT" | "DEPLOY_LESSON";

export type EnvSource = Record<string, string | undefined>;

// บทที่อธิบายการตั้งค่าตัวแปรนั้น
export const ENV_LESSON: Record<EnvName, string> = {
  LLM_PROVIDER: "028",
  OLLAMA_BASE_URL: "003",
  OLLAMA_API_KEY: "004",
  OLLAMA_MODEL: "003",
  OLLAMA_NUM_CTX: "003",
  OLLAMA_EMBED_MODEL: "091",
  GOOGLE_API_KEY: "005",
  GOOGLE_MODEL: "005",
  EMBEDDINGS_PROVIDER: "091",
  FALLBACK_PROVIDERS: "115",
  LANGSMITH_TRACING: "045",
  LANGSMITH_API_KEY: "046",
  DATABASE_URL: "146",
  WEB_PASSWORD: "147",
  WEB_MESSAGE_LIMIT: "147",
  DEPLOY_LESSON: "147",
};

export class EnvError extends Error {
  override readonly name = "EnvError";
  constructor(readonly variable: EnvName, readonly lesson: string, message: string) {
    super(message);
  }
}

// กฎตรวจค่า: คืนข้อความเหตุผลเมื่อผิด หรือ undefined เมื่อถูก (ตัวที่ไม่อยู่ในตารางไม่ตรวจ)
type Rule = (value: string) => string | undefined;
const oneOf = (...allowed: string[]): Rule => (v) =>
  allowed.includes(v) ? undefined : `ต้องเป็น ${allowed.join(" หรือ ")}`;
const positiveInt: Rule = (v) => (/^[1-9]\d*$/.test(v) ? undefined : "ต้องเป็นจำนวนเต็มบวก");

const RULES: Partial<Record<EnvName, Rule>> = {
  LLM_PROVIDER: oneOf("ollama", "google"),
  EMBEDDINGS_PROVIDER: oneOf("ollama", "google"),
  LANGSMITH_TRACING: oneOf("true", "false"),
  OLLAMA_BASE_URL: (v) => (/^https?:\/\/\S+$/.test(v) ? undefined : "ต้องขึ้นต้นด้วย http:// หรือ https://"),
  OLLAMA_NUM_CTX: positiveInt,
  WEB_MESSAGE_LIMIT: positiveInt,
};

export function optionalEnv(name: EnvName, source: EnvSource = process.env): string | undefined {
  let value = source[name]?.trim();
  if (!value) return undefined;
  if (name === "OLLAMA_BASE_URL") value = value.replace(/\/+$/, "");
  const reason = RULES[name]?.(value);
  if (reason) {
    const lesson = ENV_LESSON[name];
    throw new EnvError(name, lesson, `ค่า ${name} ในไฟล์ .env ไม่ถูกต้อง: ${reason} (ดูบท ${lesson})`);
  }
  return value;
}

export function env(name: EnvName, source: EnvSource = process.env): string {
  const value = optionalEnv(name, source);
  if (value === undefined) {
    const lesson = ENV_LESSON[name];
    throw new EnvError(name, lesson, `ยังไม่ได้ตั้งค่า ${name} ในไฟล์ .env (ดูวิธีตั้งในบท ${lesson})`);
  }
  return value;
}

export function isOllamaCloudDirect(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).hostname === "ollama.com";
  } catch {
    return false;
  }
}
