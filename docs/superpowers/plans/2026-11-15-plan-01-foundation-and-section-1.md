# DN_LANGGRAPH แผนที่ 1: ฐานของ repo และช่วงที่ 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างฐานของ repo (คำสั่ง `pnpm lesson`, `pnpm doctor`, `pnpm check`, `pnpm verify`, CI), ทดลองทุกเรื่องที่ต้องลองก่อนสร้าง, เลือกโมเดลหลัก แล้วสร้างบท 001–006 ให้ครบทั้ง `main` และ `solutions` เป็นตัวอย่างรูปแบบบทให้ผู้ใช้ตรวจ

**Architecture:** package เดียวแบบ DN_PLAYWRIGHT (แบบ A ในเอกสารออกแบบ) · สคริปต์ทุกตัวเป็น TypeScript ที่รันผ่าน tsx · บทเรียนรันเป็น child process ของ Node ที่โหลด `.env` ด้วย `--env-file-if-exists` · ระบบตรวจของผู้สอนรันบทจริงกับโมเดลจริง แล้วตรวจ stdout ด้วยไฟล์ตรวจรายบท และนับ token ด้วย hook ที่ครอบ `fetch`

**Tech Stack:** Node ≥24, pnpm 12, TypeScript ~6.0.3, tsx ~4.23.15, Vitest ~5.1.0, ESLint 10 + typescript-eslint ~8.72.2 · แผนนี้ยังไม่ติดตั้งแพ็กเกจ LangChain (บท 001–006 ใช้แค่ `fetch`) แผนที่ 2 เป็นคนเพิ่ม

**Spec:**
- `docs/superpowers/specs/2026-11-15-dn-langgraph-course-design.md` (เรียกว่า "เอกสารออกแบบ")
- `docs/superpowers/specs/2026-11-15-dn-langgraph-outline-draft.md` (เรียกว่า "ลำดับบทเรียน")

## ขอบเขตและแผนต่อจากนี้

เอกสารออกแบบครอบคลุมทั้งคอร์ส 152 บท และกำหนดให้หยุดให้ผู้ใช้ตรวจทุกครั้งที่จบช่วง แผนจึงแยกเป็นชุด แผนนี้คือแผนที่ 1 ส่วนแผนถัดไปเขียนหลังผู้ใช้ตรวจช่วงก่อนหน้าแล้ว และใช้ผลทดลองใน `internal/spikes.md`

| แผน | ช่วง | ส่วนกลางที่แผนนั้นเพิ่ม |
|---|---|---|
| 1 (แผนนี้) | ฐาน repo + ช่วง 1 (001–006) | `src/lib/env.ts`, สคริปต์ lesson / doctor / check / verify, CI, ผลทดลอง, `.env.example` |
| 2 | ช่วง 2 (007–016) | `@langchain/core`, `@langchain/ollama`, `@langchain/google` · `src/lib/ask.ts` · ส่ง `input` เข้า stdin ใน verify · `scripts/renumber` (เอกสารออกแบบใส่ไว้ในขั้นแรก แต่ย้ายมาแผนนี้ เพราะตอนนี้ยังมีแค่ 6 บท สคริปต์จะเริ่มมีประโยชน์เมื่อมีบทมากขึ้น) |
| 3 | ช่วง 3 (017–022) | `src/shop/` สินค้า ลูกค้า คำสั่งซื้อ และฟังก์ชันข้อมูล · `zod` |
| 4 | ช่วง 4 (023–028) | `langchain` · `src/lib/model.ts`, `src/lib/structured.ts` |
| 5 | ช่วง 5 (029–039) | `@langchain/langgraph` · `src/lib/show.ts` · กฎ check "ไฟล์ที่ export `graph` ห้ามมีโค้ดสั่งรันนอก `main`" |
| 6 | ช่วง 6 (040–046) | `src/shop/tools.ts` · `scripts/studio.ts` + langgraph-cli · README หลักหัวข้อ "เมื่อเรียนจบในห้องแล้ว" |
| 7 | ช่วง 7 (047–060) | ข้อมูลรีวิว |
| 8 | ช่วง 8 (061–067) | – |
| 9 | ช่วง 9 (068–077) | checkpoint-sqlite · `allowBuilds` ของ better-sqlite3 |
| 10–11 | ช่วง 10–11 (078–090) | – |
| 12 | ช่วง 12 (091–101) | เอกสารร้าน · `src/lib/embeddings.ts` · google-genai, classic, textsplitters |
| 13 | ช่วง 13 (102–108) | – |
| 14 | ช่วง 14 (109–115) | `src/lib/fallback.ts` · langgraph-checkpoint |
| 15 | ช่วง 15 (116–119) | – |
| 16 | ช่วง 16 (120–127) | `src/shop/mcp-server.ts` · mcp-adapters, MCP SDK |
| 17 | ช่วง 17 (128–133) | deepagents |
| 18 | ช่วง 18 (134–138) | test ของบทใน Vitest, `pnpm test NNN`, CI ไม่รัน 137–138 · agentevals |
| 19 | ช่วง 19 (139–148) | langgraph-sdk · Next.js (`pnpm web` พอร์ต 3200) · `@langchain/react` · docker-compose + `pnpm db:up` / `db:down` · checkpoint-postgres · ตั้งค่า deploy |
| 20 | ช่วง 20 (149–151) | – |
| 21 | ช่วง 21 (152) + ภาคผนวก A–C | กฎ check ของ README ภาคผนวก |
| 22 | ปล่อย repo | verify ทั้งคอร์ส · ผู้ใช้รันรายการ Windows · ปิด README หลัก · push `main` + `solutions` (ถามผู้ใช้ก่อน push) |

## สิ่งที่ผู้ใช้ต้องเตรียมก่อนเริ่ม Task 6

ก่อนถึง Task 6 ให้ถามผู้ใช้ และรอจนได้ครบ:
- **ไฟล์ `.env`** ที่ root ของ repo มีค่าต่อไปนี้:
  - `GOOGLE_API_KEY` ที่เปิด billing แล้ว
  - `VERIFY_OLLAMA_CLOUD_API_KEY` จากบัญชีที่มีเครดิต Ollama Cloud
  - `LANGSMITH_API_KEY`
- **Ollama ในเครื่อง** ติดตั้งไว้แล้ว (เครื่องนี้มี Ollama 0.40.16)

Task 1–5 ไม่ต้องใช้ key

## Global Constraints

- **เวอร์ชัน:**
  - `engines.node` = `>=24` · `.nvmrc` = `24` · `packageManager` = `pnpm@12.21.0`
  - แพ็กเกจหลักล็อกตามนี้: `@langchain/langgraph` ~1.7.4, `@langchain/core` ~1.4.1, `langchain` ~1.6.6, `@langchain/ollama` ~1.3.0, `@langchain/google` ~0.2.15 · TypeScript ~6.0.3
  - แพ็กเกจอื่นใช้รุ่นล่าสุดตอนติดตั้ง ล็อกด้วย `~` และ commit `pnpm-lock.yaml` เสมอ
- **ชื่อโฟลเดอร์บท:** `NNN-slug` เลข 3 หลัก เช่น `006-raw-fetch` · ภาคผนวกเป็น `appendix-a-more-providers` ฯลฯ · slug ตรงกับลำดับบทเรียน
- **ภาษา:**
  - README ของบท, ข้อความที่สคริปต์พิมพ์ และคอมเมนต์ในโค้ดของบท เป็นภาษาไทย
  - ชื่อตัวแปร ฟังก์ชัน และไฟล์ เป็นภาษาอังกฤษ
  - ข้อความ commit เป็นภาษาอังกฤษ
- **ชื่อโมเดล:** ห้ามฝังในโค้ด อ่านจาก `.env` เท่านั้น
- **ข้ามระบบ:**
  - คำสั่งต้องเหมือนกันบน macOS และ Windows PowerShell
  - สคริปต์เขียนด้วย Node/TypeScript เท่านั้น ไม่ใช้ bash
  - เรียก child process ด้วย `process.execPath` ไม่ผ่าน shell
- **import:** บทเรียก `src/` ด้วย relative import ไม่ใส่นามสกุล เช่น `../../src/lib/env`
- **ความปลอดภัย:** `.env` อยู่ใน gitignore · ห้ามพิมพ์ค่า key ออกหน้าจอ ถ้าต้องแสดงให้ใช้ "ตั้งแล้ว" หรือปิดบังค่า
- **ภาษาไทย:** ห้ามมีสระอำผิดรหัส (U+0E4D ตามด้วย U+0E32)
- **บท 006–027:** ไฟล์ที่รันได้ต้องมาเป็นคู่ `X.ollama.ts` + `X.google.ts`
- **แบบฝึกบน `main`:** มีบรรทัด 👉 และค่าชั่วคราวที่ type ถูก ต้องผ่าน typecheck และรันได้ · เฉลยอยู่บน branch `solutions` เท่านั้น
- **ขั้นที่ 1 ของบท** (กลไกด้วยฟังก์ชันธรรมดา) ต้องได้ผลเหมือนกันทุกครั้ง
- **git:** commit ในเครื่องเท่านั้น ห้าม push จนถึงแผนที่ 22
- **CI:** ห้ามเรียก provider จริง และห้ามใช้ secret

## Review Focus

1. **`.env` ไม่มีตัวแปร หรือมีแต่ช่องว่าง:** ผู้เรียนต้องเห็นข้อความไทยบรรทัดเดียวที่บอกชื่อตัวแปรและบทที่สอนวิธีตั้ง ไม่ใช่ stack trace → ทดสอบใน Task 1 (`env`) และ Task 2 (`run-cli`)
2. **`.env` ถูกบันทึกเป็น UTF-8 แบบมี BOM** (Notepad บน Windows ทำแบบนี้): `pnpm doctor` ต้องบอกและบอกวิธีแก้ · `.env.example` เริ่มด้วยบรรทัดคอมเมนต์ BOM จึงไม่ไปติดชื่อตัวแปร → ทดสอบใน Task 3
3. **พิมพ์เลขบทเป็น `7` หรือ `07` หรือพิมพ์ชื่อไฟล์มี `.ts` ต่อท้าย:** ต้องหาบทและไฟล์เจอ → ทดสอบใน Task 2
4. **`OLLAMA_BASE_URL` มี `/` ต่อท้าย หรือลืม `http://`:** ต้องตัด `/` ให้เอง หรือบอกว่าผิดพร้อมเลขบท → ทดสอบใน Task 1
5. **provider ต่อไม่ได้หรือ key ผิดตอนรัน `pnpm doctor`:** ต้องขึ้น ❌ พร้อมเลขบท ห้ามโปรแกรมพัง และห้ามพิมพ์ค่า key → ทดสอบใน Task 3

---

### Task 1: โครง repo และ `src/lib/env.ts`

**Files:**
- Create: `.gitignore`, `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `.env.example`
- Create: `src/lib/env.ts`
- Test: `src/lib/env.test.ts`

**Interfaces:**
- Produces:
```ts
export type EnvName =
  | "LLM_PROVIDER" | "OLLAMA_BASE_URL" | "OLLAMA_API_KEY" | "OLLAMA_MODEL" | "OLLAMA_NUM_CTX"
  | "OLLAMA_EMBED_MODEL" | "GOOGLE_API_KEY" | "GOOGLE_MODEL" | "EMBEDDINGS_PROVIDER"
  | "FALLBACK_PROVIDERS" | "LANGSMITH_TRACING" | "LANGSMITH_API_KEY" | "DATABASE_URL"
  | "WEB_PASSWORD" | "WEB_MESSAGE_LIMIT" | "DEPLOY_LESSON";
export type EnvSource = Record<string, string | undefined>;
export const ENV_LESSON: Record<EnvName, string>;
export class EnvError extends Error { readonly name: "EnvError"; readonly variable: EnvName; readonly lesson: string }
export function env(name: EnvName, source?: EnvSource): string;          // default source = process.env
export function optionalEnv(name: EnvName, source?: EnvSource): string | undefined;
export function isOllamaCloudDirect(baseUrl: string): boolean;          // hostname === "ollama.com"
```

- [ ] **Step 1: ตั้ง git และ commit เอกสารที่มีอยู่**

```bash
cd /Users/non/Documents/JOB/TEACHER/LANGGRAPH
git init -b main
git add README.md docs
git commit -m "docs: add course design, outline and plan 1"
```

- [ ] **Step 2: สร้างไฟล์ตั้งค่าตามค่าที่กำหนด**

- **`package.json`:**
  - `name` = `dn-langgraph`, `private` = true, `type` = `module`
  - `description` = `DN_LANGGRAPH: คอร์สสอน LangGraph.js สำหรับคนที่เขียน TypeScript เป็น`
  - `engines` = `{ "node": ">=24" }`, `packageManager` = `pnpm@12.21.0`
  - `scripts`:
    - `lesson` = `tsx scripts/lesson.ts`
    - `doctor` = `tsx scripts/doctor.ts`
    - `check` = `tsx scripts/check.ts && tsc --noEmit && eslint .`
    - `verify` = `node --env-file-if-exists=.env --import tsx scripts/verify.ts`
    - `test` = `vitest run`
    - `typecheck` = `tsc --noEmit`
    - `lint` = `eslint .`
  - `devDependencies`: `tsx` ~4.23.15, `typescript` ~6.0.3, `@types/node` ^24.19.2, `vitest` ~5.1.0, `eslint` ^10.15.0, `typescript-eslint` ~8.72.2
- **`tsconfig.json`:**
  - `target` ES2023, `module` ESNext, `moduleResolution` bundler
  - `strict`, `noEmit`, `isolatedModules`, `skipLibCheck`, `types: ["node"]`
  - `include`: `lessons`, `src`, `scripts`, `internal`
- **`eslint.config.mjs`:**
  - typescript-eslint `recommendedTypeChecked`
  - เปิด `@typescript-eslint/no-floating-promises` เป็น error
  - ตั้ง `@typescript-eslint/no-unused-vars` เป็น warn (แบบฝึกที่มีค่าชั่วคราวต้องไม่ทำให้ lint พัง)
  - ignore `node_modules`, `.langgraph`, `.next`
- **`vitest.config.ts`:** `include` = `["scripts/**/*.test.ts", "src/**/*.test.ts", "internal/**/*.test.ts"]`
- **`pnpm-workspace.yaml`:** `allowBuilds: { esbuild: true }` พร้อมคอมเมนต์แบบ DN_PLAYWRIGHT
- **`.gitignore`:** `node_modules/`, `.env`, `.env.*`, `!.env.example`, `.langgraph/`, `.next/`, `coverage/`, `*.log`, `.DS_Store`
- **`.nvmrc`:** `24`
- **`.env.example`:**
  - บรรทัดแรกเป็นคอมเมนต์ภาษาไทย (กันปัญหา BOM ตาม Review Focus ข้อ 2)
  - มีตัวแปรครบทุกตัวใน `EnvName` เรียงตามบทที่ใช้ เหนือแต่ละตัวมีคอมเมนต์ `# บท NNN: ...`
  - ค่าเริ่มต้น:
    - `LLM_PROVIDER=google`
    - `OLLAMA_BASE_URL=http://localhost:11434`
    - `EMBEDDINGS_PROVIDER=google`
    - `OLLAMA_EMBED_MODEL=embeddinggemma`
    - `FALLBACK_PROVIDERS=google,ollama`
    - `LANGSMITH_TRACING=false`
    - `OLLAMA_MODEL`, `GOOGLE_MODEL`, `OLLAMA_NUM_CTX` ใส่ `CHANGE_ME` ไว้ก่อน Task 6 จะแก้
    - ตัวอื่นเว้นว่าง
  - มีบล็อกคอมเมนต์สำหรับ Ollama Cloud แบบยิงตรง: `# OLLAMA_BASE_URL=https://ollama.com` และ `# OLLAMA_API_KEY=`

- [ ] **Step 3: ติดตั้ง**

Run: `pnpm install`
Expected: ติดตั้งสำเร็จ ไม่มีข้อความ "Ignored build scripts" และมี `pnpm-lock.yaml`

- [ ] **Step 4: เขียน test ที่ยังไม่ผ่าน `src/lib/env.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { env, optionalEnv, isOllamaCloudDirect, EnvError, ENV_LESSON } from "./env";

describe("env", () => {
  it("ตัดช่องว่างหน้าหลัง", () => expect(env("GOOGLE_MODEL", { GOOGLE_MODEL: "  m1  " })).toBe("m1"));
  it("ไม่มีค่า → EnvError บอกชื่อและบท", () => {
    expect(() => env("GOOGLE_API_KEY", {})).toThrow(EnvError);
    expect(() => env("GOOGLE_API_KEY", {})).toThrow("ยังไม่ได้ตั้งค่า GOOGLE_API_KEY ในไฟล์ .env (ดูวิธีตั้งในบท 005)");
  });
  it("มีแต่ช่องว่าง = ไม่มีค่า", () => expect(() => env("OLLAMA_MODEL", { OLLAMA_MODEL: "   " })).toThrow("บท 003"));
  it("ตัด / ท้าย OLLAMA_BASE_URL", () =>
    expect(env("OLLAMA_BASE_URL", { OLLAMA_BASE_URL: "http://localhost:11434/" })).toBe("http://localhost:11434"));
  it("OLLAMA_BASE_URL ไม่มี http → ผิด", () =>
    expect(() => env("OLLAMA_BASE_URL", { OLLAMA_BASE_URL: "localhost:11434" })).toThrow(/ค่า OLLAMA_BASE_URL ในไฟล์ \.env ไม่ถูกต้อง.*\(ดูบท 003\)/));
  it("LLM_PROVIDER ต้องเป็น ollama หรือ google", () =>
    expect(() => env("LLM_PROVIDER", { LLM_PROVIDER: "openai" })).toThrow("(ดูบท 028)"));
  it("OLLAMA_NUM_CTX ต้องเป็นจำนวนเต็มบวก", () => {
    expect(() => env("OLLAMA_NUM_CTX", { OLLAMA_NUM_CTX: "abc" })).toThrow(EnvError);
    expect(env("OLLAMA_NUM_CTX", { OLLAMA_NUM_CTX: "32768" })).toBe("32768");
  });
  it("LANGSMITH_TRACING ต้องเป็น true หรือ false", () =>
    expect(() => env("LANGSMITH_TRACING", { LANGSMITH_TRACING: "yes" })).toThrow(EnvError));
  it("optionalEnv ไม่มีค่า → undefined แต่ค่าผิดยัง throw", () => {
    expect(optionalEnv("OLLAMA_API_KEY", {})).toBeUndefined();
    expect(() => optionalEnv("EMBEDDINGS_PROVIDER", { EMBEDDINGS_PROVIDER: "x" })).toThrow(EnvError);
  });
  it("EnvError มีชื่อ variable lesson", () => {
    try { env("GOOGLE_MODEL", {}); } catch (e) {
      expect((e as EnvError).name).toBe("EnvError");
      expect((e as EnvError).variable).toBe("GOOGLE_MODEL");
      expect((e as EnvError).lesson).toBe("005");
    }
  });
  it("ทุกตัวแปรมีเลขบท", () => expect(Object.keys(ENV_LESSON)).toHaveLength(16));
  it("isOllamaCloudDirect", () => {
    expect(isOllamaCloudDirect("https://ollama.com")).toBe(true);
    expect(isOllamaCloudDirect("http://localhost:11434")).toBe(false);
  });
});
```

- [ ] **Step 5: รัน test ให้เห็นว่ายังไม่ผ่าน**

Run: `pnpm test src/lib/env.test.ts`
Expected: FAIL เพราะ import `./env` ไม่ได้

- [ ] **Step 6: เขียน `src/lib/env.ts`**

`ENV_LESSON` ใช้ค่าตามนี้:

| ตัวแปร | บท |
|---|---|
| `LLM_PROVIDER` | 028 |
| `OLLAMA_BASE_URL` | 003 |
| `OLLAMA_API_KEY` | 004 |
| `OLLAMA_MODEL` | 003 |
| `OLLAMA_NUM_CTX` | 003 |
| `OLLAMA_EMBED_MODEL` | 091 |
| `GOOGLE_API_KEY` | 005 |
| `GOOGLE_MODEL` | 005 |
| `EMBEDDINGS_PROVIDER` | 091 |
| `FALLBACK_PROVIDERS` | 115 |
| `LANGSMITH_TRACING` | 045 |
| `LANGSMITH_API_KEY` | 046 |
| `DATABASE_URL` | 146 |
| `WEB_PASSWORD` | 147 |
| `WEB_MESSAGE_LIMIT` | 147 |
| `DEPLOY_LESSON` | 147 |

ข้อความ error ใช้ตามนี้ตรงตัว:
- ไม่มีค่า: `ยังไม่ได้ตั้งค่า ${name} ในไฟล์ .env (ดูวิธีตั้งในบท ${lesson})`
- ค่าผิด: `ค่า ${name} ในไฟล์ .env ไม่ถูกต้อง: ${reason} (ดูบท ${lesson})`

กฎตรวจค่าแต่ละตัวเก็บเป็นตารางเล็กๆ ในไฟล์ · ไฟล์ทั้งหมดต้องอ่านจบได้ในหน้าจอเดียว เพราะผู้เรียนจะเปิดอ่านในบท 002

- [ ] **Step 7: รัน test ให้ผ่าน แล้วตรวจ typecheck และ lint**

Run: `pnpm test src/lib/env.test.ts && pnpm typecheck && pnpm lint`
Expected: PASS ทั้งหมด

- [ ] **Step 8: Commit**

```bash
git add .gitignore .nvmrc package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json eslint.config.mjs vitest.config.ts .env.example src/lib
git commit -m "feat: scaffold repo and add env helper"
```

### Task 2: หาบทและรันไฟล์ของบท (`pnpm lesson`)

**Files:**
- Create: `scripts/lib/lessons.ts`, `scripts/run.ts`, `scripts/run-cli.ts`, `scripts/lesson.ts`
- Test: `scripts/lib/lessons.test.ts`, `scripts/run.test.ts`

**Interfaces:**
- Consumes: `EnvError` (ดูจาก `error.name === "EnvError"` ไม่ใช้ instanceof)
- Produces:
```ts
// scripts/lib/lessons.ts
export interface Lesson { number: string; slug: string; dir: string } // number "006", dir เป็น path เต็ม
export function normalizeLessonNumber(input: string): string | null;
export function listLessons(lessonsDir: string): Lesson[];
export function findLesson(lessonsDir: string, input: string): Lesson | null;
export function runnableFiles(lesson: Lesson): string[];   // ชื่อไม่มี .ts เรียงตามตัวอักษร
export type Resolved = { ok: true; file: string } | { ok: false; message: string };
export function resolveLessonFile(lesson: Lesson, name?: string): Resolved;
export function countPointers(source: string): number;
// scripts/run.ts
export async function runModule(file: string): Promise<void>;
```
- `scripts/run-cli.ts <file>` คือจุดเริ่มของ child process: เรียก `runModule` · ถ้าเจอ `EnvError` ให้พิมพ์แค่ `error.message` ลง stderr แล้ว `process.exitCode = 1` · error แบบอื่นให้ปล่อยออกไปตามปกติ (stack trace ช่วยผู้เรียนในบทหลังๆ)
- `scripts/lesson.ts` รับ `NNN [ชื่อไฟล์]`
  - spawn `process.execPath` ด้วย args `["--env-file-if-exists=.env", "--import", "tsx", "scripts/run-cli.ts", file]`
  - ตั้ง `cwd` เป็น root ของ repo และใช้ `stdio: "inherit"`
  - exit ด้วย status ของ child

ข้อความที่ต้องใช้ตรงตัว:
- หาบทไม่เจอ: `ไม่พบบท ${input} ในโฟลเดอร์ lessons/`
- ไม่มีไฟล์เริ่มต้น: `บท ${number} มีไฟล์ให้เลือก: ${choices.join(", ")}` ขึ้นบรรทัดใหม่ แล้ว `ตัวอย่าง: pnpm lesson ${number} ${choices[0]}`
- ไม่มีไฟล์ให้รัน: `บท ${number} ไม่มีไฟล์ให้รัน อ่าน README.md ของบทนี้`
- ไม่มีไฟล์ที่ระบุ: `บท ${number} ไม่มีไฟล์ ${name}.ts มีไฟล์ให้เลือก: ${choices.join(", ")}`
- ไฟล์แบบฝึกยังมี 👉 (พิมพ์ก่อนรัน แต่ยังรันต่อ): `⚠️  ไฟล์นี้ยังมี 👉 อีก ${n} จุด ผลที่ได้อาจยังไม่ครบ`

- [ ] **Step 1: เขียน test ที่ยังไม่ผ่าน**

`scripts/lib/lessons.test.ts` สร้างโฟลเดอร์ชั่วคราวด้วย `fs.mkdtempSync` ให้มี `006-raw-fetch/` (มี `README.md`, `example.ollama.ts`, `example.google.ts`, `exercise-1.ollama.ts`, `exercise-1.google.ts`, `helper.test.ts`), `002-setup-project/` (มี `example.ts`, `exercise-1.ts`), `appendix-a-more-providers/` และไฟล์ `notes.md`

```ts
it("normalizeLessonNumber", () => {
  expect(normalizeLessonNumber("7")).toBe("007");
  expect(normalizeLessonNumber("07")).toBe("007");
  expect(normalizeLessonNumber("152")).toBe("152");
  for (const bad of ["0", "000", "abc", "1000", "", "6a"]) expect(normalizeLessonNumber(bad)).toBeNull();
});
it("listLessons เอาเฉพาะโฟลเดอร์ NNN-slug เรียงตามเลข", () =>
  expect(listLessons(dir).map((l) => l.number)).toEqual(["002", "006"]));
it("ไม่มีโฟลเดอร์ lessons → []", () => expect(listLessons(path.join(dir, "ไม่มี"))).toEqual([]));
it("findLesson รับ 6", () => expect(findLesson(dir, "6")?.slug).toBe("raw-fetch"));
it("runnableFiles ไม่เอา README และ .test.ts", () =>
  expect(runnableFiles(findLesson(dir, "006")!)).toEqual(["example.google", "example.ollama", "exercise-1.google", "exercise-1.ollama"]));
it("ไม่ระบุไฟล์ → example.ts", () =>
  expect(resolveLessonFile(findLesson(dir, "002")!)).toEqual({ ok: true, file: path.join(dir, "002-setup-project", "example.ts") }));
it("ไม่มี example.ts → บอกให้เลือก", () => {
  const r = resolveLessonFile(findLesson(dir, "006")!);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.message).toBe("บท 006 มีไฟล์ให้เลือก: example.google, example.ollama, exercise-1.google, exercise-1.ollama\nตัวอย่าง: pnpm lesson 006 example.google");
});
it("ชื่อไฟล์มี .ts ก็หาเจอ", () => expect(resolveLessonFile(findLesson(dir, "006")!, "exercise-1.google.ts").ok).toBe(true));
it("ชื่อไฟล์ไม่มีจริง", () => {
  const r = resolveLessonFile(findLesson(dir, "002")!, "exercise-9");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.message).toBe("บท 002 ไม่มีไฟล์ exercise-9.ts มีไฟล์ให้เลือก: example, exercise-1");
});
it("countPointers", () => expect(countPointers("// 👉 a\nconst x = 1; // 👉 b\n")).toBe(2));
```

`scripts/run.test.ts` ใช้ไฟล์ fixture ที่สร้างในโฟลเดอร์ชั่วคราว:
```ts
it("เรียก main() ถ้ามี", async () => { await runModule(withMain); expect(globalThis.__dnRan).toBe("main"); });
it("ไม่มี main → รันโค้ดบนสุดของไฟล์", async () => { await runModule(topLevel); expect(globalThis.__dnRan).toBe("top"); });
it("run-cli: EnvError → ข้อความไทยบรรทัดเดียว exit 1", () => {
  // fixture: import { env } from "<repo>/src/lib/env"; env("GOOGLE_API_KEY");
  const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/run-cli.ts", envFixture], { cwd: repoRoot, env: { PATH: process.env.PATH }, encoding: "utf8" });
  expect(r.status).toBe(1);
  expect(r.stderr.trim()).toBe("ยังไม่ได้ตั้งค่า GOOGLE_API_KEY ในไฟล์ .env (ดูวิธีตั้งในบท 005)");
});
it("pnpm lesson 999 → หาบทไม่เจอ exit 1", () => {
  const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/lesson.ts", "999"], { cwd: repoRoot, encoding: "utf8" });
  expect(r.status).toBe(1);
  expect(r.stderr).toContain("ไม่พบบท 999 ในโฟลเดอร์ lessons/");
});
```

- [ ] **Step 2: รัน test ให้เห็นว่ายังไม่ผ่าน**

Run: `pnpm test scripts`
Expected: FAIL เพราะยังไม่มีโมดูล

- [ ] **Step 3: เขียน `scripts/lib/lessons.ts`, `scripts/run.ts`, `scripts/run-cli.ts`, `scripts/lesson.ts` ตาม Interfaces และข้อความข้างบน**

`runModule` ใช้ `await import(pathToFileURL(file).href)` แล้วเรียก `main` ถ้า `typeof mod.main === "function"`

- [ ] **Step 4: รัน test ให้ผ่าน**

Run: `pnpm test scripts && pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts
git commit -m "feat: add pnpm lesson runner"
```

### Task 3: `pnpm doctor`

**Files:**
- Create: `scripts/lib/doctor-checks.ts`, `scripts/doctor.ts`
- Test: `scripts/lib/doctor-checks.test.ts`

**Interfaces:**
- Consumes: `optionalEnv`, `isOllamaCloudDirect`, `ENV_LESSON` จาก `src/lib/env`
- Produces:
```ts
export interface CheckResult { ok: boolean; label: string; detail?: string; lesson?: string }
export interface DoctorDeps {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
  nodeVersion: string;            // process.version
  userAgent: string | undefined;  // process.env.npm_config_user_agent
  readEnvFile: () => string | null; // เนื้อหา .env หรือ null ถ้าไม่มีไฟล์
}
export async function runDoctor(deps: DoctorDeps): Promise<CheckResult[]>;
export function formatResults(results: CheckResult[]): string;
```
- `scripts/doctor.ts` โหลด `.env` ด้วย `process.loadEnvFile` ถ้ามีไฟล์ แล้วเรียก `runDoctor` กับค่าจริง พิมพ์ `formatResults` · ถ้ามีข้อไหน ❌ ให้ `process.exitCode = 1`

ลำดับการตรวจ (ทุกข้อเป็นการเรียกที่ไม่ใช้ token):

1. **Node:** ต้องเป็นรุ่น 24 ขึ้นไป (บท 002)
2. **pnpm:** `userAgent` ต้องขึ้นต้นด้วย `pnpm/12.` (บท 002)
3. **`.env`:** ต้องมีไฟล์ (บท 002) · ถ้าไฟล์ขึ้นต้นด้วย `﻿` ให้ ❌ พร้อมวิธีแก้ "บันทึกใหม่เป็น UTF-8 แบบไม่มี BOM" (บท 002)
4. **Google:**
   - `GET https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000` ส่ง header `x-goog-api-key`
   - ได้ 200 และ `models[].name` มี `models/${GOOGLE_MODEL}` → ✅
   - ได้ 400 หรือ 403 → ❌ "key ไม่ถูกต้อง" (บท 005)
   - ไม่มี `GOOGLE_MODEL` ในรายการ → ❌ (บท 005)
   - ต่อไม่ได้ → ❌ (บท 005)
5. **Ollama:**
   - ไม่ได้ตั้ง `OLLAMA_BASE_URL` → ❌ (บท 003)
   - ถ้า `isOllamaCloudDirect` เป็นจริง:
     - `GET ${base}/api/tags` ส่ง `Authorization: Bearer ${OLLAMA_API_KEY}`
     - ได้ 401 → ❌ (บท 004)
     - ไม่มีโมเดลในรายการ → ❌ (บท 004)
   - ถ้าไม่ใช่ (ในเครื่อง):
     - `GET ${base}/api/tags` แล้ว fetch throw → ❌ "เปิดโปรแกรม Ollama ก่อน" (บท 003)
     - ไม่มีโมเดลในรายการ → ❌ พร้อมคำสั่ง `ollama pull ${OLLAMA_MODEL}` (บท 003)

`formatResults` พิมพ์บรรทัดละข้อ:
- ผ่าน: `✅ ${label}`
- ไม่ผ่าน: `❌ ${label} — ${detail} (ดูบท ${lesson})`

บรรทัดสุดท้ายเป็น `พร้อมเรียนแล้ว` หรือ `ยังมี ${n} เรื่องต้องแก้`

- [ ] **Step 1: เขียน test ที่ยังไม่ผ่าน**

ใช้ fake `fetch` ที่ตอบตาม URL

```ts
const KEY = "AIzaFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE123";
it("ครบทุกอย่าง → ผ่านหมด", async () => expect((await runDoctor(okDeps())).every((r) => r.ok)).toBe(true));
it("Node 22 → ❌ บท 002", async () =>
  expect((await runDoctor(okDeps({ nodeVersion: "v22.12.0" })))[0]).toMatchObject({ ok: false, lesson: "002" }));
it(".env มี BOM → ❌ บท 002", async () => {
  const r = await runDoctor(okDeps({ readEnvFile: () => "﻿# x\nGOOGLE_API_KEY=k" }));
  expect(r.find((x) => x.lesson === "002" && !x.ok)?.detail).toContain("BOM");
});
it("Google ตอบ 400 → ❌ บท 005 และไม่พิมพ์ key", async () => {
  const r = await runDoctor(okDeps({ fetch: fakeFetch({ google: 400 }) }));
  const g = r.find((x) => x.lesson === "005")!;
  expect(g.ok).toBe(false);
  expect(formatResults(r)).not.toContain(KEY);
});
it("Ollama ในเครื่องไม่ได้เปิด → ❌ บท 003", async () => {
  const r = await runDoctor(okDeps({ fetch: fakeFetch({ ollamaThrows: true }) }));
  expect(r.find((x) => x.lesson === "003")?.detail).toContain("เปิดโปรแกรม Ollama");
});
it("ยังไม่ pull โมเดล → บอกคำสั่ง", async () => {
  const r = await runDoctor(okDeps({ fetch: fakeFetch({ ollamaModels: [] }) }));
  expect(r.find((x) => x.lesson === "003")?.detail).toContain("ollama pull");
});
it("Ollama Cloud key ผิด → ❌ บท 004", async () => {
  const r = await runDoctor(okDeps({ env: { ...okEnv, OLLAMA_BASE_URL: "https://ollama.com", OLLAMA_API_KEY: "bad" }, fetch: fakeFetch({ cloud: 401 }) }));
  expect(r.find((x) => x.lesson === "004")?.ok).toBe(false);
});
it("formatResults", () =>
  expect(formatResults([{ ok: true, label: "Node v24.1.0" }, { ok: false, label: "Google", detail: "key ไม่ถูกต้อง", lesson: "005" }]))
    .toBe("✅ Node v24.1.0\n❌ Google — key ไม่ถูกต้อง (ดูบท 005)\nยังมี 1 เรื่องต้องแก้"));
```

- [ ] **Step 2: รัน test ให้เห็นว่ายังไม่ผ่าน**

Run: `pnpm test scripts/lib/doctor-checks.test.ts`
Expected: FAIL

- [ ] **Step 3: เขียน `scripts/lib/doctor-checks.ts` และ `scripts/doctor.ts`**

ห่อการเรียก `fetch` ทุกครั้งด้วย try/catch · `runDoctor` ต้องไม่ throw ไม่ว่าเจออะไร

- [ ] **Step 4: รัน test ให้ผ่าน แล้วลองรันจริงโดยยังไม่มี `.env`**

Run: `pnpm test scripts/lib/doctor-checks.test.ts && pnpm doctor`
Expected:
- test ผ่าน
- `pnpm doctor` ได้ ✅ ที่ Node และ pnpm
- ❌ ที่ `.env` พร้อม "(ดูบท 002)"
- exit 1 และไม่มี stack trace

- [ ] **Step 5: Commit**

```bash
git add scripts
git commit -m "feat: add pnpm doctor"
```

### Task 4: `pnpm check` และ CI

**Files:**
- Create: `scripts/lib/course-rules.ts`, `scripts/check.ts`, `.github/workflows/ci.yml`
- Test: `scripts/lib/course-rules.test.ts`

**Interfaces:**
- Consumes: `listLessons`, `runnableFiles` จาก Task 2
- Produces:
```ts
export interface Problem { file: string; line?: number; message: string } // file เป็น path relative กับ root
export const README_HEADINGS: readonly string[];
export function checkLessonFolders(root: string): Problem[];
export function checkReadmeHeadings(root: string): Problem[];
export function checkProviderPairs(root: string): Problem[];
export function checkNoHardcodedModels(root: string): Problem[];
export function checkNoSecrets(root: string): Problem[];
export function checkThaiSaraAm(root: string): Problem[];
export function checkVerifyCoverage(root: string): Problem[];
```

**กฎแต่ละข้อ**

- **`README_HEADINGS`** มี 9 หัวข้อตามลำดับนี้ (เป็นหัวข้อ `## `):
  1. `จบบทนี้แล้วทำอะไรได้`
  2. `เชื่อมกับที่รู้แล้ว`
  3. `เนื้อหา`
  4. `จุดที่มักพลาด`
  5. `วิธีรัน`
  6. `ผลที่ควรเห็น`
  7. `เปิดดูใน Studio`
  8. `แบบฝึกหัด`
  9. `อ่านเพิ่ม`
- **`checkLessonFolders`:**
  - ชื่อโฟลเดอร์ใน `lessons/` ต้องตรง `^\d{3}-[a-z0-9]+(-[a-z0-9]+)*$` หรือ `^appendix-[a-c]-[a-z0-9]+(-[a-z0-9]+)*$`
  - เลขบทเริ่มที่ 001 และต่อกันไม่ขาด ถ้าขาดขึ้น `เลขบทขาด: ไม่มีบท ${n}`
  - ชื่อผิดรูปแบบขึ้น `ชื่อโฟลเดอร์ไม่ถูกรูปแบบ NNN-slug`
- **`checkReadmeHeadings`:**
  - ทุกบทต้องมี `README.md` และมีหัวข้อครบตามลำดับ · มีหัวข้อ `## ` อื่นแทรกได้
  - บทเลขน้อยกว่า 046 ไม่ต้องมี `เปิดดูใน Studio` · บท 046 ขึ้นไปต้องมี
  - ข้ามโฟลเดอร์ภาคผนวกไปก่อน (แผนที่ 21 เป็นคนกำหนดกฎ)
- **`checkProviderPairs`:**
  - บท 006–027 ทุก `X.ollama.ts` ต้องมี `X.google.ts` และกลับกัน
  - ห้ามมี `example.ts` หรือ `exercise-N.ts` แบบไม่มีชื่อ provider
- **`checkNoHardcodedModels`:**
  - ใช้กับไฟล์ `.ts` และ `.tsx` ใน `lessons/` และ `src/`
  - ห้ามมี regex `/\bmodel\s*:\s*["'`]/` หรือ `/initChatModel\(\s*["'`]/`
  - ข้อความที่แสดง: `ห้ามใส่ชื่อโมเดลในโค้ด ให้อ่านจาก .env`
- **`checkNoSecrets`:**
  - ไล่ทุกไฟล์ข้อความ ยกเว้น `node_modules`, `.git`, `.env` และ `.env.*` (แต่ไล่ `.env.example`)
  - หา `/AIza[0-9A-Za-z_-]{35}/` และ `/lsv2_[a-z]{2}_[0-9a-f]{20,}/`
  - และ `.gitignore` ต้องมีบรรทัด `.env`
- **`checkThaiSaraAm`:**
  - ไล่ใน `lessons`, `src`, `scripts`, `internal`, `docs`, `README.md`
  - หา `"ํา"` แล้วรายงานเลขบรรทัด พร้อมข้อความแบบ DN_PLAYWRIGHT
- **`checkVerifyCoverage`:** บทที่มีไฟล์ให้รันต้องมี `internal/checks/${number}.ts`

**`scripts/check.ts`** รันทุกกฎ แล้วพิมพ์ปัญหาเป็น `${file}:${line}: ${message}` · ถ้ามีปัญหาให้ exit 1 · ถ้าไม่มีให้พิมพ์ `โครงคอร์สถูกต้อง`

**CI** (`.github/workflows/ci.yml`):
- matrix ระบบ `ubuntu-latest` และ `windows-latest`, Node 24
- ติดตั้ง pnpm ด้วย `pnpm/action-setup` (อ่านรุ่นจาก `packageManager`)
- ขั้นตอน: `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm test`
- ไม่มี secret

- [ ] **Step 1: เขียน test ที่ยังไม่ผ่าน**

สร้าง root ชั่วคราวที่ผ่านทุกกฎไว้ 1 ชุด แล้วทำให้แต่ละกฎพังทีละข้อ ใน `scripts/lib/course-rules.test.ts`

```ts
it("โครงที่ถูกต้อง → ไม่มีปัญหา", () => expect(allRules(goodRoot())).toEqual([]));
it("เลขบทขาด", () => expect(checkLessonFolders(rootWith(["001-a", "003-c"]))).toContainEqual(expect.objectContaining({ message: "เลขบทขาด: ไม่มีบท 002" })));
it("ชื่อโฟลเดอร์ผิด", () => expect(checkLessonFolders(rootWith(["001-a", "2-b"]))).toHaveLength(1));
it("README ขาดหัวข้อ", () => expect(checkReadmeHeadings(rootWithReadme("001-a", README_HEADINGS.filter((h) => h !== "จุดที่มักพลาด")))).toHaveLength(1));
it("บท 001 ไม่ต้องมี Studio แต่ 046 ต้องมี", () => { /* 001 ไม่มี Studio → [] · 046 ไม่มี Studio → 1 ปัญหา */ });
it("006 มี ollama แต่ไม่มี google", () => expect(checkProviderPairs(rootWithFiles("006-raw-fetch", ["example.ollama.ts"]))).toHaveLength(1));
it("006 มี example.ts เปล่า", () => expect(checkProviderPairs(rootWithFiles("006-raw-fetch", ["example.ts"]))).toHaveLength(1));
it("ชื่อโมเดลในโค้ด", () => expect(checkNoHardcodedModels(rootWithSource(`const m = { model: "gemma3" }`))).toHaveLength(1));
it("อ่านชื่อโมเดลจาก env ได้", () => expect(checkNoHardcodedModels(rootWithSource(`const m = { model: env("OLLAMA_MODEL") }`))).toEqual([]));
it("เจอ key ของ Google", () => expect(checkNoSecrets(rootWithSource("const k = 'AIza" + "A".repeat(35) + "'"))).toHaveLength(1));
it("สระอำผิดรหัส บอกเลขบรรทัด", () => expect(checkThaiSaraAm(rootWithReadmeText("บรรทัดแรก\nทํา"))[0].line).toBe(2));
it("บทที่มีไฟล์ให้รันแต่ไม่มีไฟล์ตรวจ", () => expect(checkVerifyCoverage(rootWithFiles("002-setup-project", ["example.ts"]))).toHaveLength(1));
```

- [ ] **Step 2: รัน test ให้เห็นว่ายังไม่ผ่าน**

Run: `pnpm test scripts/lib/course-rules.test.ts`
Expected: FAIL

- [ ] **Step 3: เขียน `scripts/lib/course-rules.ts`, `scripts/check.ts` และ `.github/workflows/ci.yml`**

- [ ] **Step 4: รัน test และ `pnpm check` ของ repo จริง**

Run: `pnpm test && pnpm check`
Expected:
- test ผ่าน
- `pnpm check` พิมพ์ `โครงคอร์สถูกต้อง` เพราะยังไม่มีโฟลเดอร์ `lessons/` (ถือว่าว่าง) ตามด้วย tsc และ eslint ผ่าน

- [ ] **Step 5: Commit**

```bash
git add scripts .github
git commit -m "feat: add course structure checks and CI"
```

### Task 5: ระบบตรวจของผู้สอน (`pnpm verify`)

**Files:**
- Create: `internal/verify/types.ts`, `internal/verify/expect.ts`, `internal/verify/usage.ts`, `internal/verify/usage-hook.ts`, `internal/verify/runner.ts`, `scripts/verify.ts`
- Test: `internal/verify/usage.test.ts`, `internal/verify/runner.test.ts`, `internal/verify/expect.test.ts`

**Interfaces:**
- Consumes: `Lesson`, `listLessons`, `findLesson`, `runnableFiles` จาก Task 2 · `scripts/run-cli.ts`
- Produces:
```ts
// types.ts
export type VerifyProvider = "google" | "ollama-cloud" | "ollama";
export interface TokenUsage { input: number; output: number }
export interface RunResult {
  lesson: string; file: string; provider: VerifyProvider; attempt: number;
  env: Record<string, string | undefined>;  // env ที่ child ใช้จริง (ต่อจาก .env)
  stdout: string; stderr: string; exitCode: number | null; timedOut: boolean; durationMs: number;
  usage: TokenUsage | null;
}
export interface FileCheck { input?: string[]; timeoutMs?: number; check: (run: RunResult) => void }
export type LessonChecks = Record<string, FileCheck>;  // key = ชื่อไฟล์ไม่มี .ts เช่น "example.google"
// expect.ts
export class CheckFailure extends Error {}
export function expectSuccess(run: RunResult): void;          // exitCode 0 และไม่ timeout · ไม่ผ่าน → แนบ stderr 20 บรรทัดสุดท้าย
export function expectIncludes(text: string, needle: string, label: string): void;
export function expectNotIncludes(text: string, needle: string | undefined, label: string): void; // needle ว่างหรือ undefined → ผ่าน
export function expectMatches(text: string, pattern: RegExp, label: string): RegExpMatchArray;
export function expectThai(text: string, label: string): void; // มีอักษร [฀-๿]
// usage.ts
export function parseOllamaUsage(body: string): TokenUsage | null;
export function parseGeminiUsage(body: string): TokenUsage | null;
export function addUsage(a: TokenUsage | null, b: TokenUsage | null): TokenUsage | null;
// runner.ts
export function providerEnv(provider: VerifyProvider, base: Record<string, string | undefined>): Record<string, string>;
export function filesForProvider(files: string[], provider: VerifyProvider): string[];
export async function runOnce(opts: {
  root: string; lesson: Lesson; file: string; provider: VerifyProvider; attempt: number;
  check: FileCheck; env: Record<string, string>;
}): Promise<RunResult>;
```

**`providerEnv`** อ่านตัวแปรของผู้สอนจาก `.env`

| provider | env ที่ส่งให้ child |
|---|---|
| `google` | `{ LLM_PROVIDER: "google" }` |
| `ollama-cloud` | `{ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "https://ollama.com", OLLAMA_API_KEY: VERIFY_OLLAMA_CLOUD_API_KEY, OLLAMA_MODEL: VERIFY_OLLAMA_CLOUD_MODEL }` |
| `ollama` | `{ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://localhost:11434", OLLAMA_API_KEY: "", OLLAMA_MODEL: VERIFY_OLLAMA_LOCAL_MODEL, OLLAMA_NUM_CTX: VERIFY_OLLAMA_LOCAL_NUM_CTX }` |

ถ้าไม่มีตัวแปร `VERIFY_*` ที่ต้องใช้ ให้ throw `ยังไม่ได้ตั้งค่า ${name} ในไฟล์ .env ของผู้สอน (ดู internal/README.md)` · env ที่ส่งให้ child ชนะค่าใน `.env` เพราะ Node ให้ env ที่ตั้งไว้แล้วชนะไฟล์

**`filesForProvider`**
- `ollama` และ `ollama-cloud` รันไฟล์ `.ollama`
- `google` รันไฟล์ `.google`
- ไฟล์ที่ไม่มีชื่อ provider รันทุก provider

**`runOnce`**
- spawn `process.execPath` ด้วย `["--env-file-if-exists=.env", "--import", "tsx", "--import", "./internal/verify/usage-hook.ts", "scripts/run-cli.ts", file]`
- env ของ child = `{ ...process.env, ...opts.env, DN_USAGE_FILE: <ไฟล์ชั่วคราว> }`
- ส่ง `check.input` ต่อกันด้วย `\n` เข้า stdin แล้วปิด stdin
- timeout เริ่มต้น 300000 ms · ครบเวลาให้ kill แล้วตั้ง `timedOut: true`
- รอจบแล้วอ่าน usage จากไฟล์ชั่วคราว

**`usage-hook.ts`**
- ครอบ `globalThis.fetch`
- response จาก `generativelanguage.googleapis.com` → `parseGeminiUsage`
- response ที่ path ลงท้ายด้วย `/api/chat`, `/api/generate` หรือ `/api/embed` → `parseOllamaUsage`
- อ่านจาก `response.clone().text()` ไม่ต้องรอ แล้วสะสมยอด
- ตอน `process.on("exit")` เขียน JSON `{ input, output }` แบบ sync ลง `DN_USAGE_FILE`

**`parseGeminiUsage`**
- รับได้ทั้ง JSON object, JSON array และ SSE ที่มีบรรทัด `data: `
- ใช้ `usageMetadata` ตัวสุดท้าย
- `input` = `promptTokenCount`
- `output` = `candidatesTokenCount + (thoughtsTokenCount ?? 0)`

**`parseOllamaUsage`**
- รับได้ทั้ง JSON object และ NDJSON
- รวม `prompt_eval_count` และ `eval_count` จากทุกบรรทัดที่มีค่า
- บรรทัดที่ parse ไม่ได้ให้ข้าม

**`scripts/verify.ts`**
- รูปแบบคำสั่ง: `pnpm verify [NNN | NNN-NNN] --provider <google|ollama-cloud|ollama> [--repeat N] [--examples-only]`
  - ไม่ระบุช่วง = ทุกบท
  - `--repeat` เริ่มต้น 1
  - `--examples-only` รันเฉพาะไฟล์ `example*` ใช้บน `main` ระหว่างเขียนบท
- โหลด `internal/checks/${number}.ts` (default export เป็น `LessonChecks`)
- รันทุกไฟล์ตาม `filesForProvider` ครบ `--repeat` รอบ
- พิมพ์ผลบรรทัดละรอบ:
  - ผ่าน: `✅ ${number} ${file} #${attempt} (${วินาที}s, ${input}→${output} token)`
  - ไม่ผ่าน: `❌ ... — ${เหตุผล}`
- กรณีพิเศษ:
  - บทที่ไม่มีไฟล์ให้รัน → พิมพ์ `– ${number} ไม่มีไฟล์ให้รัน`
  - ไม่มีไฟล์ตรวจ → ❌ `ไม่มี internal/checks/${number}.ts`
  - ไม่มีเกณฑ์ของไฟล์ → ❌ `ไม่มีเกณฑ์ตรวจของไฟล์ ${file}`
- ท้ายสุดพิมพ์สรุป: จำนวนผ่าน/ไม่ผ่าน และ token รวม (`token ที่ใช้: ขาเข้า N ขาออก M`) · มีรอบไหนไม่ผ่านให้ exit 1

- [ ] **Step 1: เขียน test ที่ยังไม่ผ่าน**

```ts
// usage.test.ts
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
it("addUsage", () => expect(addUsage({ input: 1, output: 2 }, null)).toEqual({ input: 1, output: 2 }));

// runner.test.ts
it("providerEnv ollama-cloud", () =>
  expect(providerEnv("ollama-cloud", { VERIFY_OLLAMA_CLOUD_API_KEY: "k", VERIFY_OLLAMA_CLOUD_MODEL: "m" }))
    .toEqual({ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "https://ollama.com", OLLAMA_API_KEY: "k", OLLAMA_MODEL: "m" }));
it("providerEnv ขาดตัวแปร", () => expect(() => providerEnv("ollama", {})).toThrow("VERIFY_OLLAMA_LOCAL_MODEL"));
it("filesForProvider", () =>
  expect(filesForProvider(["example.google", "example.ollama", "exercise-1"], "ollama-cloud")).toEqual(["example.ollama", "exercise-1"]));
it("runOnce เก็บ stdout และส่ง input เข้า stdin", async () => { /* fixture: อ่าน stdin 1 บรรทัด แล้วพิมพ์ `ได้รับ: ${line}` · input: ["สวัสดี"] → stdout มี "ได้รับ: สวัสดี" และ exitCode 0 */ });
it("runOnce ตัดเมื่อเกินเวลา", async () => { /* fixture: setInterval ไม่จบ · timeoutMs 500 → timedOut true */ });
it("runOnce นับ token ผ่าน hook", async () => {
  /* เปิด node:http server ที่ตอบ /api/chat ด้วย {"done":true,"prompt_eval_count":10,"eval_count":5}
     fixture: await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, { method: "POST", body: "{}" }).then(r => r.json())
     env: { OLLAMA_BASE_URL: server url } → usage = { input: 10, output: 5 } */
});

// expect.test.ts
it("expectSuccess แนบ stderr", () => expect(() => expectSuccess(fakeRun({ exitCode: 1, stderr: "พัง" }))).toThrow(/พัง/));
it("expectThai", () => { expect(() => expectThai("hello", "คำตอบ")).toThrow(CheckFailure); expectThai("สวัสดี", "คำตอบ"); });
```

- [ ] **Step 2: รัน test ให้เห็นว่ายังไม่ผ่าน**

Run: `pnpm test internal`
Expected: FAIL

- [ ] **Step 3: เขียนไฟล์ทั้งหมดตาม Interfaces และกติกาข้างบน**

- [ ] **Step 4: รัน test ให้ผ่าน และลองคำสั่งจริงตอนยังไม่มีบท**

Run: `pnpm test && pnpm verify --provider google`
Expected: test ผ่าน · `pnpm verify` พิมพ์สรุป 0 รอบ และ exit 0 (ยังไม่มีบทให้รัน และ provider `google` ไม่ต้องใช้ตัวแปร `VERIFY_*`)

- [ ] **Step 5: Commit**

```bash
git add internal scripts
git commit -m "feat: add instructor verify harness with token usage"
```

### Task 6: ทดลองก่อนสร้าง และเลือกโมเดลหลัก

ต้องมีของที่ระบุใน "สิ่งที่ผู้ใช้ต้องเตรียมก่อนเริ่ม Task 6" ก่อน · ทุกข้อเป็นโค้ดทิ้ง ให้ทำในโฟลเดอร์ใหม่ใต้ scratchpad ห้ามเพิ่มลง repo · ใน repo เพิ่มแค่บันทึกผล

**Files:**
- Create: `internal/spikes.md` (ผลทดลองทุกข้อ: วันที่, เวอร์ชัน, ผ่าน/ไม่ผ่าน, ตัวเลขที่วัด, ทางที่เลือก)
- Create: `internal/windows-checklist.md`
- Modify: `.env.example` (แทนค่า `CHANGE_ME` ของ `OLLAMA_MODEL`, `GOOGLE_MODEL`, `OLLAMA_NUM_CTX`) · ใส่ชื่อโมเดล Cloud ที่แนะนำในบล็อกคอมเมนต์ Cloud

**กติกาเมื่อทดลองไม่ผ่าน:**
- เอกสารออกแบบมีทางสำรองไว้ (ข้อ 5.8 ทางสำรองของ deploy) → ใช้ทางสำรองและบันทึกไว้
- ไม่มีทางสำรอง → หยุดแล้วรายงานผู้ใช้ ห้ามเดาทางแก้เอง

- [ ] **Step 1: ทดสอบ endpoint ของ provider (ใช้ fetch อย่างเดียว)**
  - Google: เรียก `GET .../v1beta/models` และ `POST .../models/{model}:generateContent`
  - Ollama Cloud: เรียก `GET https://ollama.com/api/tags` และ `POST https://ollama.com/api/chat` ด้วย Bearer key (ยืนยันว่า `/api/tags` ใช้กับ Cloud ได้จริง เพราะ `pnpm doctor` ต้องใช้)
  - Ollama ในเครื่อง: เรียก `/api/tags` และ `/api/chat`
  - Ollama Cloud ผ่าน `ollama signin`: โมเดลชื่อ `:cloud` ต้องขึ้นใน `/api/tags` ของเครื่อง หลัง `ollama pull` (ใช้ยืนยันข้อความ "ollama pull" ของ `pnpm doctor`)
  - เกณฑ์ผ่าน: ได้คำตอบภาษาไทยทั้ง 3 ทาง · ถ้า `/api/tags` ของ Cloud ใช้ไม่ได้ ให้แก้ Task 3 ไปใช้ endpoint ที่ใช้ได้และไม่เสีย token แล้วบันทึกไว้

- [ ] **Step 2: ทดสอบ usage hook กับ LangChain จริง**
  - ในโฟลเดอร์ทดลอง ติดตั้ง `@langchain/core@1.4.1`, `@langchain/ollama@1.3.0`, `@langchain/google@0.2.15`
  - รัน `invoke` และ `stream` ของ `ChatOllama` (ทั้งในเครื่องและ Cloud) และ `ChatGoogle` โดยใส่ `--import <repo>/internal/verify/usage-hook.ts`
  - เกณฑ์ผ่าน: `DN_USAGE_FILE` มี token มากกว่า 0 ทุกกรณี · ถ้าไม่ผ่านให้แก้ hook ให้รองรับรูปแบบที่ได้จริง แล้วเพิ่ม test ใน `usage.test.ts`

- [ ] **Step 3: เลือกโมเดล**
  - เลือกผู้สมัครจากรายการโมเดลที่มีตอนนี้:
    - Gemini 2–3 รุ่นที่อยู่ในแผนฟรีและตั้ง `thinkingLevel` ต่ำได้
    - Ollama Cloud 2–3 รุ่น
    - Ollama ในเครื่อง 2–3 รุ่นที่ขนาดพอสำหรับ RAM 16 GB และเรียก tool ได้
  - สคริปต์ทดสอบทำ 5 รอบต่อรุ่น:
    1. ตอบคำถามภาษาไทยเรื่องร้านค้า
    2. `bindTools` 2 tool (`searchProducts`, `getOrder`) ต้องเลือกถูก
    3. `withStructuredOutput` ด้วย zod schema 3 field (Ollama Cloud ใช้ `method: "functionCalling"`)
    4. จับเวลาต่อรอบ
  - บันทึกตารางผลใน `internal/spikes.md`
  - เกณฑ์เลือก: tool ถูก 5/5 และ structured output ถูก 5/5 · ถ้าผ่านหลายรุ่นเลือกรุ่นที่เร็วกว่า · Cloud ดูราคาต่อ token ประกอบ
  - เกณฑ์ผ่าน: มีรุ่นที่ผ่านอย่างน้อย 1 รุ่นในแต่ละทาง · ทางที่ไม่มีรุ่นผ่านเลย ให้หยุดรายงานผู้ใช้

- [ ] **Step 4: หาค่า `OLLAMA_NUM_CTX`**
  - ทดลองโมเดลในเครื่องที่เลือก ที่ 8192, 16384 และ 32768
  - ดู RAM จาก `ollama ps` และความเร็ว
  - เลือกค่าสูงสุดที่โมเดลกับ context รวมกันใช้ RAM ไม่เกิน 10 GB (เหลือที่ให้ระบบบนเครื่อง 16 GB)

- [ ] **Step 5: ทดลองเรื่องของบทหลังๆ (เอกสารออกแบบข้อ 7 และ "สิ่งที่ต้องทดสอบจริง" ในลำดับบทเรียน)**
  ทำทีละข้อ บันทึกผลทุกข้อ:
  - **langgraph-cli dev:**
    - โหลดไฟล์ `.ts` ที่ import แบบ relative ไม่ใส่นามสกุลได้
    - อ่าน `env` จาก config ที่สร้างไว้ในโฟลเดอร์อื่นได้
    - ไฟล์ที่ `export async function main()` ถูก import แล้ว `main` ไม่ถูกรัน
    - Studio เชื่อมต่อได้ด้วย LangSmith key และไม่ต้องเปิด tracing
    - repo ที่ใช้ pnpm ใช้ได้
  - **Next.js ~16.4:** หน้าเว็บ re-export ไฟล์นอก `src/app/` ที่มี `"use client"` และ route handler ที่ re-export ต้อง `next build` ผ่าน
  - **`useStream` จาก `@langchain/react`:**
    - ต่อกับ langgraph dev server ได้
    - ต่อกับ route handler ของ Next.js ตาม Agent Streaming Protocol ได้ · ถ้าไม่ได้ ใช้ทางสำรองในข้อ 5.8
  - **Agent Chat UI:** ตัวที่เปิดไว้บนเว็บต่อ `http://localhost:2024` ได้ไหม · ถ้าไม่ได้ ให้บันทึกวิธีรันเองในเครื่อง
  - **MCP:** MCP server แบบ stdio ที่เปิดด้วย `process.execPath` + `--import tsx` ใช้กับ `@langchain/mcp-adapters` บน macOS ได้
  - **better-sqlite3:** ติดตั้งผ่านด้วย pnpm 12 + `allowBuilds`
  - **LangGraph:**
    - `maxConcurrency` จำกัดงานจาก `Send` ได้จริง (นับจำนวนที่รันพร้อมกันสูงสุด)
    - `InMemoryCache` + `cachePolicy` ทำให้รอบที่สองไม่เรียกโมเดล
  - **agentevals:** ใช้กับ `langchain` 1.6.6 ได้
  - **ภาษาไทย:** หา separators ของ `@langchain/textsplitters` ที่แบ่งเอกสารภาษาไทยแล้ว chunk ไม่ขาดกลางคำ · ใช้เอกสารนโยบายสมมติ 1 หน้า
  - **Node 24:** `--env-file-if-exists` + `--import tsx` ใช้ได้ (ทดสอบด้วย `npx -y node@24 --env-file-if-exists=.env --import tsx scripts/run-cli.ts <fixture>`)
  - **Gemini:** `getModel` ที่ไม่ส่ง `temperature` ให้ Gemini ต้องไม่มี warning · `GoogleGenerativeAIEmbeddings` จาก `@langchain/google-genai` ใช้กับ key จาก AI Studio ได้
  - **hosting:** เลือก hosting ของบท 147 ตามเกณฑ์ในเอกสารออกแบบข้อ 6 และ Postgres บน cloud ที่มีแผนฟรี · บันทึกเวลาทำงานสูงสุดของ function

- [ ] **Step 6: เขียน `internal/windows-checklist.md`**
  ขั้นตอนให้ผู้ใช้รันบน Windows PowerShell ทีละข้อ พร้อมผลที่ควรเห็น:
  - ตั้ง UTF-8 แล้วพิมพ์และแสดงภาษาไทยได้
  - `pnpm install`
  - `pnpm doctor`
  - `pnpm lesson 002` และ `pnpm lesson 006 example.google`
  - `.env` ที่บันทึกจาก Notepad
  - ข้อที่รอแผนหลัง (`ask()` ภาษาไทย, better-sqlite3, MCP stdio) ใส่ไว้เป็นหัวข้อ "ทดสอบเมื่อถึงแผนที่ N"

- [ ] **Step 7: ใส่ค่าที่เลือกลง `.env.example` แล้วตรวจ**

Run: `pnpm check`
Expected: ผ่าน · `.env.example` ไม่มี `CHANGE_ME` เหลือ

- [ ] **Step 8: Commit**

```bash
git add internal/spikes.md internal/windows-checklist.md .env.example
git commit -m "docs: record spike results and chosen models"
```

### Task 7: บท 001–005 (บทอ่านและตั้งค่า) และบท 002

**Files:**
- Create: `lessons/001-what-is-llm/README.md`
- Create: `lessons/002-setup-project/README.md`, `lessons/002-setup-project/example.ts`, `lessons/002-setup-project/exercise-1.ts`, `lessons/002-setup-project/exercise-2.ts`
- Create: `lessons/003-setup-ollama-local/README.md`, `lessons/004-setup-ollama-cloud/README.md`, `lessons/005-setup-google/README.md`
- Create: `internal/checks/002.ts`

**Interfaces:**
- Consumes: `env`, `optionalEnv` จาก `src/lib/env` · `pnpm doctor` · `LessonChecks`, `expectSuccess`, `expectMatches`, `expectThai` จาก Task 5

**เนื้อหาแต่ละบท** มาจากแถวของบทนั้นในลำดับบทเรียน · README ใช้หัวข้อตาม `README_HEADINGS` (ไม่มี "เปิดดูใน Studio") · บทที่ไม่มีโค้ดให้หัวข้อ "วิธีรัน" บอกว่าทำที่ไหน และหัวข้อ "แบบฝึกหัด" เป็นงานที่ทำนอกโค้ด · ทุก README ใช้คำสั่งที่ใช้ได้ทั้ง macOS และ PowerShell (ถ้าต่างกันให้แสดงทั้ง 2 แบบ)

- **001:**
  - แบบฝึกหัด:
    1. ถามคำถามเดิม 3 รอบใน AI Studio แล้วจดว่าคำตอบต่างกันตรงไหน
    2. ดูจำนวน token ของคำถามภาษาไทยเทียบกับภาษาอังกฤษใน AI Studio
    3. เขียนสิ่งที่ผู้ช่วย DN Shop ต้องทำได้ตอนจบคอร์ส (เทียบกับ "ผลงานสุดท้าย" ในภาพรวม)
  - ผลที่ควรเห็นเป็น checklist
- **002:**
  - **README** ครอบคลุม:
    - ติดตั้ง: Node 24, pnpm 12, Git และ VS Code
    - วิธีแก้ Execution Policy บน PowerShell แบบ DN_PLAYWRIGHT
    - `git clone`, `pnpm install`, คัด `.env.example` เป็น `.env` (`cp` / `Copy-Item`)
    - `pnpm lesson 002` และ `pnpm doctor` (ตอนนี้ยังมี ❌ ได้ จะแก้ในบท 003–005)
    - ตั้ง UTF-8 ใน PowerShell (`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` และวิธีตั้งถาวรใน profile)
    - เตือนเรื่องบันทึก `.env` ด้วย Notepad แล้วมี BOM
    - อธิบายเครื่องหมาย 👉
    - เปิดอ่าน `src/lib/env.ts`
  - **`example.ts`:**
    - พิมพ์ `สวัสดีจาก DN_LANGGRAPH`
    - พิมพ์ `Node ${process.version}`
    - พิมพ์บรรทัดละตัวแปรของช่วง 1 (`OLLAMA_BASE_URL`, `OLLAMA_API_KEY`, `OLLAMA_MODEL`, `GOOGLE_API_KEY`, `GOOGLE_MODEL`) เป็น `${name}: ตั้งแล้ว` / `ยังไม่ได้ตั้ง` / `ค่าไม่ถูกต้อง` ด้วย `optionalEnv` ใน try/catch · ห้ามพิมพ์ค่าจริง
  - **`exercise-1.ts`:** แก้ข้อความให้พิมพ์ `สวัสดี ${ชื่อของคุณ}` (👉 ค่าชั่วคราวเป็น `"ชื่อของคุณ"`)
  - **`exercise-2.ts`:**
    - อ่าน `GOOGLE_MODEL` ด้วย `env()` แล้วพิมพ์ `GOOGLE_MODEL = ${ค่า}`
    - โจทย์ให้ลองลบค่าใน `.env` ชั่วคราวแล้วรันใหม่ ดูข้อความ error ที่บอกบท
- **003:** ตามแถวบท 003 ในลำดับบทเรียน ใส่ค่าที่เลือกใน Task 6:
  - ชื่อโมเดลที่แนะนำ
  - ตารางเลือกขนาดโมเดลตาม RAM
  - ค่า context
  - บนสุดบอกว่า "ทำบท 003 หรือ 004 อย่างน้อย 1 บท ตามที่ผู้สอนบอกในรอบนั้น" · เครื่องช้าให้ไปบท 004
  - จบด้วยแถว Ollama ของ `pnpm doctor` เป็น ✅
- **004:**
  - บอก 2 วิธี:
    - `ollama signin` แล้วใช้ชื่อโมเดล `:cloud` โดย base URL ยังเป็น localhost
    - ยิงตรงด้วย `OLLAMA_BASE_URL=https://ollama.com` + `OLLAMA_API_KEY`
  - ข้อจำกัดของ Cloud: รับพร้อมกัน 3 request, ไม่รองรับ structured output แบบ JSON schema, ไม่มีโมเดล embedding
  - เรื่องราคา: ให้ลิงก์หน้าราคา ไม่ใส่ตัวเลขที่จะเก่า
  - จบด้วย `pnpm doctor` เป็น ✅
- **005:** ตามแถวบท 005 ในลำดับบทเรียน · จบด้วยแถว Google ของ `pnpm doctor` เป็น ✅

**เกณฑ์ใน `internal/checks/002.ts`:**

| ไฟล์ | เกณฑ์ |
|---|---|
| `example` | `expectSuccess` · `expectIncludes(stdout, "สวัสดีจาก DN_LANGGRAPH")` · `expectMatches(stdout, /Node v\d+/)` · `expectNotIncludes(stdout, run.env.GOOGLE_API_KEY)` |
| `exercise-1` | `expectSuccess` · `expectMatches(stdout, /สวัสดี \S+/)` · `expectNotIncludes(stdout, "ชื่อของคุณ")` |
| `exercise-2` | `expectSuccess` · `expectIncludes(stdout, \`GOOGLE_MODEL = ${run.env.GOOGLE_MODEL}\`)` |

- [ ] **Step 1: เขียน README ของบท 001, 003, 004 และ 005**
- [ ] **Step 2: เขียนบท 002 (README, `example.ts`, แบบฝึก) และ `internal/checks/002.ts`**
- [ ] **Step 3: ตรวจโครง**

Run: `pnpm check`
Expected: `โครงคอร์สถูกต้อง` และ tsc กับ eslint ผ่าน

- [ ] **Step 4: รันตัวอย่างจริง**

Run: `pnpm lesson 002 && pnpm lesson 2 exercise-1 && pnpm verify 002 --provider google --examples-only`
Expected:
- `pnpm lesson 002` พิมพ์สถานะตัวแปรครบ 5 บรรทัด ไม่มีค่า key
- `exercise-1` ขึ้นคำเตือน 👉 ก่อนรัน
- `verify` ได้ ✅ ที่ `example`

- [ ] **Step 5: Commit**

```bash
git add lessons internal/checks
git commit -m "feat: add lessons 001-005"
```

### Task 8: บท 006 ⭐ เรียก LLM ด้วย `fetch`

**Files:**
- Create: `lessons/006-raw-fetch/README.md`
- Create: `lessons/006-raw-fetch/example.ollama.ts`, `lessons/006-raw-fetch/example.google.ts`
- Create: `lessons/006-raw-fetch/exercise-{1,2,3}.ollama.ts`, `lessons/006-raw-fetch/exercise-{1,2,3}.google.ts`
- Create: `internal/checks/006.ts`

**Interfaces:**
- Consumes: `env`, `optionalEnv` จาก `src/lib/env` · helper ของ Task 5

**ตัวอย่าง (2 ขั้นตามหลักข้อ 3)**

- **ขั้นที่ 1:** ฟังก์ชัน `buildRequest(question: string): { url: string; headers: Record<string, string>; body: unknown }`
  - พิมพ์ URL, headers (ปิดค่า key เป็น `***`) และ body (`JSON.stringify(body, null, 2)`)
  - ผลเหมือนกันทุกครั้ง · README แสดงผลแบบตรงทุกตัว โดยใส่ชื่อโมเดลเป็น `<ค่า OLLAMA_MODEL ของคุณ>` / `<ค่า GOOGLE_MODEL ของคุณ>`
- **ขั้นที่ 2:** ส่งด้วย `fetch` → ถ้า `!res.ok` ให้ throw พร้อม status และ body → พิมพ์ข้อความคำตอบอย่างเดียว ขึ้นต้นด้วย `คำตอบ: `
- **Ollama:**
  - `POST ${OLLAMA_BASE_URL}/api/chat`
  - body `{ model, messages: [{ role: "user", content }], stream: false }`
  - ถ้ามี `OLLAMA_API_KEY` ให้ใส่ `Authorization: Bearer ...`
  - คำตอบอยู่ที่ `message.content`
- **Google:**
  - `POST https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent`
  - header `x-goog-api-key`
  - body `{ contents: [{ role: "user", parts: [{ text }] }] }`
  - คำตอบคือ `candidates[0].content.parts` ที่ `thought !== true` เอา `text` มาต่อกัน
- **type ของ response:** ประกาศ interface เล็กๆ ในไฟล์ ไม่ใช้ `any`
- **คำถามในตัวอย่าง:** `แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง`

**แบบฝึก (คู่ `.ollama` / `.google` ทุกข้อ)**

| ข้อ | โจทย์ | รูปแบบผลที่ต้องพิมพ์ |
|---|---|---|
| 1 | เติม body และดึงคำตอบเอง (👉 ที่ body และบรรทัดดึงข้อความ) | `คำตอบ: ...` |
| 2 | พิมพ์จำนวน token จาก response ดิบ (Ollama `prompt_eval_count` / `eval_count` · Gemini `usageMetadata.promptTokenCount` / `candidatesTokenCount`) | `token ขาเข้า: N` และ `token ขาออก: N` |
| 3 ⭐ | เขียน `ask(question: string): Promise<{ text: string; inputTokens: number; outputTokens: number }>` แล้วถามคำถามเดิม 3 รอบต่อกัน (ไม่ขนาน) เชื่อมกับบท 001 ว่าคำตอบเปลี่ยนได้ | ครั้งละ 2 บรรทัด: `ครั้งที่ ${i}: ${text}` และ `(token ${inputTokens}→${outputTokens})` |

**README**
- มีครบทุกหัวข้อ
- "จุดที่มักพลาด":
  - ลืม `await res.json()`
  - URL มี `/` ซ้ำ
  - ใส่ key ใน URL แล้วเผลอ commit
  - ลืมเปิด Ollama
  - ชื่อโมเดลไม่ตรงกับ `ollama list`
  - เจอ 429
- "อ่านเพิ่ม" ลิงก์ไปหน้า API `/api/chat` ของ Ollama และหน้า `generateContent` ของ Gemini (ตรวจว่า URL ยังใช้ได้)

**เกณฑ์ใน `internal/checks/006.ts`** (ทุกไฟล์ต้อง `expectSuccess` และ `expectNotIncludes(stdout, ค่า key จริงใน run.env)` ด้วย)

| ไฟล์ | เกณฑ์เพิ่ม |
|---|---|
| `example.ollama` | `expectIncludes(stdout, "/api/chat")` · `expectIncludes(stdout, '"stream": false')` · คำตอบหลัง `คำตอบ: ` เป็นภาษาไทยและยาว 20 ตัวอักษรขึ้นไป |
| `example.google` | `expectIncludes(stdout, ":generateContent")` · คำตอบหลัง `คำตอบ: ` เป็นภาษาไทยและยาว 20 ตัวอักษรขึ้นไป |
| `exercise-1.*` | คำตอบหลัง `คำตอบ: ` เป็นภาษาไทยและยาว 20 ตัวอักษรขึ้นไป |
| `exercise-2.*` | `expectMatches(stdout, /token ขาเข้า: ([1-9]\d*)/)` · `expectMatches(stdout, /token ขาออก: ([1-9]\d*)/)` |
| `exercise-3.*` | มี `ครั้งที่ 1:` `ครั้งที่ 2:` `ครั้งที่ 3:` ตามลำดับ แต่ละครั้งเป็นภาษาไทยไม่ว่าง · มี `(token N→M)` 3 ครั้ง N, M > 0 · ไม่ตรวจว่าคำตอบต้องต่างกัน |

- [ ] **Step 1: เขียน `example.ollama.ts` และ `example.google.ts`**
- [ ] **Step 2: เขียน `internal/checks/006.ts`**
- [ ] **Step 3: รันตัวอย่างกับทั้ง 3 ทาง**

Run:
```bash
pnpm verify 006 --provider google --examples-only --repeat 3
pnpm verify 006 --provider ollama-cloud --examples-only --repeat 3
pnpm verify 006 --provider ollama --examples-only
```
Expected: ✅ ทุกรอบ และขึ้นยอด token มากกว่า 0

- [ ] **Step 4: เขียนแบบฝึก 3 คู่ (มี 👉 และค่าชั่วคราวที่ type ถูก) และ README**

README ใช้ผลจริงจาก Step 3: ขั้นที่ 1 แบบตรงทุกตัว ขั้นที่ 2 เป็น checklist ตรงกับเกณฑ์ใน `internal/checks/006.ts`

- [ ] **Step 5: ตรวจโครง**

Run: `pnpm check`
Expected: ผ่าน

- [ ] **Step 6: Commit**

```bash
git add lessons/006-raw-fetch internal/checks/006.ts
git commit -m "feat: add lesson 006 raw fetch"
```

### Task 9: branch `solutions` และผลตรวจของช่วงที่ 1

**Files:**
- Create บน `solutions`: เฉลยของ `lessons/002-setup-project/exercise-{1,2}.ts` และ `lessons/006-raw-fetch/exercise-{1,2,3}.{ollama,google}.ts`
- Create บน `main`: `internal/README.md`

**ขั้นตอน**

- [ ] **Step 1: สร้าง worktree ของ `solutions`**

```bash
git worktree add ../LANGGRAPH-solutions -b solutions
cd ../LANGGRAPH-solutions && pnpm install && cp ../LANGGRAPH/.env .env
```

- [ ] **Step 2: เขียนเฉลย**
  - เขียนใน `../LANGGRAPH-solutions` แทนที่บรรทัด 👉 ด้วยโค้ดจริง
  - ใส่คอมเมนต์ภาษาไทยอธิบายว่า "ทำไม" ทุกจุดที่เติม
  - ห้ามเหลือ 👉 ในไฟล์เฉลย

- [ ] **Step 3: ตรวจเฉลยกับโมเดลจริง (ใน `../LANGGRAPH-solutions`)**

Run:
```bash
pnpm check
pnpm verify 001-006 --provider google --repeat 3
pnpm verify 001-006 --provider ollama-cloud --repeat 3
pnpm verify 001-006 --provider ollama
```
Expected: ✅ ทุกรอบ · บท 001, 003, 004, 005 ขึ้น `– ไม่มีไฟล์ให้รัน` · จดยอด token รวมของแต่ละ provider ไว้รายงานผู้ใช้
ถ้ารอบไหนไม่ผ่าน ให้ดูว่าแก้ที่โค้ดบทหรือที่เกณฑ์ (เกณฑ์ต้องตรวจโครง ไม่ตรวจถ้อยคำ) แล้วแก้ไฟล์บทบน `main` ก่อน merge มา `solutions`

- [ ] **Step 4: Commit บน `solutions`**

```bash
git add lessons
git commit -m "feat: add solutions for section 1"
```

- [ ] **Step 5: เขียน `internal/README.md` บน `main`**
  - ตัวแปรของผู้สอนใน `.env`: `VERIFY_OLLAMA_CLOUD_API_KEY`, `VERIFY_OLLAMA_CLOUD_MODEL`, `VERIFY_OLLAMA_LOCAL_MODEL`, `VERIFY_OLLAMA_LOCAL_NUM_CTX`
  - วิธีใช้ worktree ของ `solutions` และลำดับการแก้: แก้บน `main` → `git -C ../LANGGRAPH-solutions merge main` → แก้ conflict โดยเก็บโค้ดเฉลยไว้
  - วิธีใช้ `pnpm verify` และเกณฑ์ผ่านตามข้อ 5.10 ของเอกสารออกแบบ
  - ขั้นตอน "ก่อนสอนแต่ละรอบ" ตามข้อ 5.14
  - ลิงก์ไป `spikes.md` และ `windows-checklist.md`

- [ ] **Step 6: Commit บน `main` แล้ว merge ไป `solutions`**

```bash
git add internal/README.md && git commit -m "docs: add instructor guide"
git -C ../LANGGRAPH-solutions merge main
```

### Task 10: README หลัก และหยุดให้ผู้ใช้ตรวจ

**Files:**
- Modify: `README.md` (เขียนใหม่ทั้งไฟล์)

**เนื้อหา** ใช้หัวข้อตามเอกสารออกแบบข้อ 5.11 ข้อ 1–8 · หัวข้อ 9 "เมื่อเรียนจบในห้องแล้ว" ใส่ในแผนที่ 6

- **ส่วนต้น:** บรรทัดแนะนำคอร์สแบบ DN_PLAYWRIGHT (จำนวนบท ช่วง และ DN Shop)
- **ก่อนเริ่ม:** ใช้ตารางสิ่งที่ต้องมีจากลำดับบทเรียน
- **วิธีรัน:** ใส่เฉพาะคำสั่งที่มีแล้ว (`pnpm lesson`, `pnpm doctor`)
- **สารบัญ:**
  - ตารางช่วงที่ 1 มีคอลัมน์ บท, โฟลเดอร์, ฝึก
  - บท 001–006 ติด 🏫 ตามข้อเสนอ 001–046
- **เฉลย:** ลิงก์ `https://github.com/ArrayaWongsaita/DN_LANGGRAPH/tree/solutions/lessons` (ชื่อ repo บน GitHub ยืนยันกับผู้ใช้อีกครั้งในแผนที่ 22)

- [ ] **Step 1: เขียน `README.md`**
- [ ] **Step 2: ตรวจโครงทั้ง 2 branch**

Run: `pnpm check && git -C ../LANGGRAPH-solutions merge main && (cd ../LANGGRAPH-solutions && pnpm check)`
Expected: ผ่านทั้ง 2 ที่

- [ ] **Step 3: Commit**

```bash
git add README.md && git commit -m "docs: add main README for section 1"
```

- [ ] **Step 4: หยุดให้ผู้ใช้ตรวจ (ห้ามเริ่มแผนที่ 2 เอง)**

รายงานผู้ใช้เป็นภาษาไทย:
- โมเดลที่เลือกพร้อมเหตุผลจาก `internal/spikes.md`
- ข้อทดลองที่ไม่ผ่านและทางที่ใช้แทน
- ผล `verify` และยอด token ของแต่ละ provider
- ไฟล์ที่ควรเปิดดู: `README.md`, `lessons/002-setup-project/README.md`, `lessons/006-raw-fetch/README.md`
- `internal/windows-checklist.md` ที่ผู้ใช้ต้องรันบน Windows

จากนั้นถามว่ารูปแบบบทใช้ได้ไหม ก่อนเขียนแผนที่ 2
