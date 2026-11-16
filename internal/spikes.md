# ผลทดลองก่อนสร้าง (แผนที่ 1 · Task 6)

ไฟล์นี้บันทึกผลทดลองที่แผนหลังๆ ต้องใช้ ตามภาคผนวกแก้แผน (2026-11-16) งาน 6 แบ่งเป็น 2 ส่วน:

- **6a (ทำแล้ว 2026-11-16):** เรื่องที่ทดลองได้โดยไม่ต้องใช้ Google / Ollama Cloud / Ollama ในเครื่อง · ข้อที่ต้องเรียกโมเดลใช้ `ChatOllama` ชี้ไปที่ opencode shim (`internal/dev/opencode-shim.ts`)
- **6b (เลื่อนไปท้ายสุด):** เรื่องที่ต้องใช้ key จริงของ Google, Ollama Cloud, LangSmith หรือ Ollama ในเครื่อง · checklist อยู่ในหัวข้อ "เลื่อนไปท้ายสุด (6b)" ทำตามได้โดยไม่ต้องเปิดแผนอีก

โค้ดทดลองทั้งหมดอยู่นอก repo (โฟลเดอร์ scratchpad ของเครื่องผู้สร้าง แยกโฟลเดอร์ต่อชุดแพ็กเกจ) และไม่ได้ commit · ไฟล์นี้เก็บแค่ผลและตัวเลขที่วัดได้

## สภาพแวดล้อมของ 6a

| รายการ | ค่า |
|---|---|
| วันที่ | 2026-11-16 |
| เครื่อง | macOS 27.2.1 arm64, RAM 36 GB |
| Node | 26.13.1 (เครื่องนี้) และ 24.22.3 (`npx -y node@24`) |
| pnpm | 12.21.0 (ตาม `packageManager`) และ 12.4.1 (ตัวที่ติดตั้งในเครื่อง ใช้เมื่อโฟลเดอร์ไม่มี `packageManager`) |
| เบราว์เซอร์ | Google Chrome 157 (ทั้งแบบควบคุมผ่าน DevTools และ headless ผ่าน puppeteer-core) |
| โมเดล | opencode Go endpoint ผ่าน shim, `OPENCODE_DEV_MODEL` = `deepseek-v4.1-flash` |

**เวอร์ชันแพ็กเกจที่ใช้ทดลอง** (ตัวที่ไม่ได้ล็อกในเอกสารออกแบบ = รุ่นล่าสุดบน npm ณ วันที่ทดลอง)

| แพ็กเกจ | เวอร์ชัน |
|---|---|
| `@langchain/core` / `@langchain/langgraph` / `langchain` | 1.4.1 / 1.7.4 / 1.6.6 |
| `@langchain/ollama` / `@langchain/google` | 1.3.0 / 0.2.15 |
| `@langchain/langgraph-cli` (มี `@langchain/langgraph-api` 1.7.2 มาด้วย) | 1.7.2 |
| `@langchain/langgraph-checkpoint` | 1.2.2 |
| `@langchain/langgraph-checkpoint-sqlite` (ดึง `better-sqlite3` 12.11.1) | 1.1.0 |
| `@langchain/langgraph-sdk` / `@langchain/react` | 1.16.0 / 1.2.14 |
| `@langchain/mcp-adapters` / `@modelcontextprotocol/sdk` | 2.0.3 / 1.32.2 |
| `@langchain/textsplitters` | 1.0.2 |
| `agentevals` (ดึง `openevals` 0.1.5, `@langchain/openai` 1.8.4) | 0.0.7 |
| `next` / `react` / `react-dom` | 16.4.6 / 19.3.1 / 19.3.1 |
| `typescript` / `tsx` / `zod` | 6.0.3 / 4.23.15 / 4.6.7 |

## สรุปผล

| ข้อ | ผล | สรุป |
|---|---|---|
| Step 2 usage hook กับ `ChatOllama` → shim (invoke + stream) | ✅ PASS | นับ token ได้ทั้ง 2 แบบ ทั้ง Node 26 และ 24 · ไม่ต้องแก้ hook |
| Step 2 `ChatOllama` ในเครื่อง / Cloud และ `ChatGoogle` | ⏸ DEFERRED → 6b | ต้องใช้ key จริง |
| langgraph-cli dev: import แบบไม่ใส่นามสกุล | ✅ PASS | |
| langgraph-cli dev: อ่าน `env` จาก config ในโฟลเดอร์อื่น | ✅ PASS | path ใน config นับจากโฟลเดอร์ของ config |
| langgraph-cli dev: `main` ไม่ถูกรันตอน import | ✅ PASS | |
| langgraph-cli dev: Studio | 🟡 PARTIAL | ⚠️ **ขัดกับเอกสารออกแบบข้อ 3** ที่บอกว่า Studio ต้องมี LangSmith key: ในการทดลองนี้หน้า Studio โหลดและเห็น graph โดยไม่มี key (เงื่อนไขอยู่ในหัวข้อ Studio ข้างล่าง) · **ยังไม่ตัดสิน** ให้ใช้ข้อกำหนดเดิมของเอกสารออกแบบ (บท 046 ต้องมี key) จนกว่าจะทดสอบซ้ำด้วย key จริงในข้อ 6b-6 |
| langgraph-cli dev: repo ที่ใช้ pnpm | ✅ PASS | ชื่อคำสั่งคือ `langgraphjs` ไม่ใช่ `langgraph` |
| Next.js 16.4: re-export หน้า `"use client"` และ route handler | ✅ PASS | ค่า config ของ route (`dynamic`, `runtime`, `maxDuration`) re-export ไม่ได้ ต้องเขียนในไฟล์ `src/app/...` |
| `useStream` ↔ langgraph dev server | ✅ PASS | |
| `useStream` ↔ route handler ตาม Agent Streaming Protocol | ✅ PASS (ในเครื่อง) | ยังไม่ได้ทดสอบบน serverless จริง (ดูข้อเสี่ยงในแผนที่ 19) |
| Agent Chat UI บนเว็บ ↔ `localhost:2024` | ✅ PASS (มีเงื่อนไข) | ต้องกด "อนุญาต" การเข้าถึงเครือข่ายในเครื่องของ Chrome · ถ้าไม่อนุญาตขึ้น `Failed to fetch` |
| MCP stdio ด้วย `process.execPath` + `--import tsx` (macOS) | ✅ PASS | Windows อยู่ใน `internal/windows-checklist.md` |
| better-sqlite3 + pnpm 12 + `allowBuilds` | ✅ PASS | ใช้ prebuilt ไม่ต้อง compile · เปลี่ยนรุ่น Node แล้วต้อง rebuild |
| LangGraph `maxConcurrency` กับ `Send` | 🟡 PARTIAL | จำกัดได้จริงเมื่อค่า ≥ 2 · **ค่า 1 ทำให้งานหายเงียบๆ (bug ของ 1.7.4)** |
| `InMemoryCache` + `cachePolicy` | ✅ PASS (มีเงื่อนไข) | state ที่เป็น messages ต้องใช้ `keyFunc` ไม่งั้นไม่เคยเจอ cache |
| agentevals กับ `langchain` 1.6.6 | ✅ PASS | |
| แบ่ง chunk ภาษาไทย | ✅ PASS | ได้ค่าที่แนะนำ 2 แบบ (ข้างล่าง) |
| Node 24: `--env-file-if-exists` + `--import tsx` | ✅ PASS | |
| Gemini (`getModel` ไม่ส่ง temperature, `GoogleGenerativeAIEmbeddings`) | ⏸ DEFERRED → 6b | ต้องใช้ key จริง |
| hosting บท 147 + Postgres บน cloud | ✅ PASS (ค้นเอกสาร) | Vercel Hobby (สูงสุด 300 วินาที) + Neon Free พอตามเกณฑ์ข้อ 6 · ตัวเลือกอื่นยังประเมินไม่ครบ · ยังไม่ได้ deploy จริง · URL และวันที่ดึงหน้าอยู่ในหัวข้อ hosting ข้างล่าง |
| Step 6 `internal/windows-checklist.md` | ✅ เขียนแล้ว | ผู้ใช้เป็นคนรันบน Windows |

นับรวม 6a: PASS 16 · PARTIAL 2 · FAIL 0 · DEFERRED 2 (ไม่นับ Step 6 ที่เป็นงานเขียน)

- **PASS ที่มีเงื่อนไข 4 ข้อ:**
  1. `useStream` ↔ route handler: ผ่านเฉพาะในเครื่อง ยังไม่ได้ทดสอบบน serverless
  2. Agent Chat UI บนเว็บ: ต้องอนุญาตการเข้าถึงเครือข่ายในเครื่องของ Chrome
  3. `InMemoryCache` + `cachePolicy`: state ที่เป็น messages ต้องใช้ `keyFunc`
  4. hosting: ตัดสินจากเอกสารเท่านั้น ยังไม่ได้ deploy
- **ข้อที่ผลขึ้นกับโมเดล ทดสอบกับ `deepseek-v4.1-flash` ผ่าน opencode shim เท่านั้น ยังไม่ใช่ provider จริง:** usage hook (Step 2), langgraph-cli dev ที่รัน graph ผ่านโมเดล, `useStream` ทั้ง 2 ทาง, Agent Chat UI, `bindTools` กับ tool จาก MCP, `maxConcurrency` แบบเรียกโมเดล, cache, agentevals (`createAgent` และ LLM judge) · shim แปลง `/api/chat` ของ Ollama เป็น OpenAI chat completions และส่งผลแบบไม่ stream แล้วแตกเป็น NDJSON 2 chunk · พฤติกรรมของ tool call, structured output, streaming และตัวเลข token กับ Google / Ollama Cloud / Ollama ในเครื่องอาจต่างไป ต้องยืนยันใน 6b และตอนรัน `pnpm verify` กับ provider จริง
- **shim เลียนของจริงได้แค่ไหน:** (1) stream เป็นของปลอม shim ขอผลแบบไม่ stream จาก upstream แล้วแตกเป็นชิ้นละ 12 grapheme ระยะเวลาระหว่างชิ้นจึงไม่ใช่ของจริง (2) `think: false` ถูกแปลงเป็น `thinking: {type:"disabled"}` ซึ่งใช้ได้กับ deepseek เท่านั้น (3) ชื่อโมเดลที่ไม่ตรงกับ `OPENCODE_DEV_MODEL` ได้ 404 แบบ Ollama (4) ไม่มี 429 และไม่มีลิมิต concurrency จริง

## ทำแล้ว (6a)

### Step 2: usage hook กับ LangChain จริง (เฉพาะ `ChatOllama` → shim)

- วิธี: เปิด shim ด้วย `startShim()` ของ repo ในอีก process แล้วรัน `node --import tsx --import <repo>/internal/verify/usage-hook.ts` สคริปต์ที่เรียก `new ChatOllama({ baseUrl: <shim>, model, numCtx: 8192 })` ทั้ง `invoke` และ `stream`
- ผล (`DN_USAGE_FILE` ต้องมีทั้ง input และ output มากกว่า 0):

| Node | แบบ | `DN_USAGE_FILE` | `usage_metadata` ของ LangChain | เวลา |
|---|---|---|---|---|
| 26.13.1 | invoke | `{"input":48,"output":133}` | 48 / 133 | 5.4 วินาที |
| 26.13.1 | stream (3 chunk) | `{"input":48,"output":150}` | 48 / 150 | 5.5 วินาที |
| 24.22.3 | invoke | `{"input":48,"output":143}` | 48 / 143 | 4.9 วินาที |
| 24.22.3 | stream | `{"input":48,"output":93}` | 48 / 93 | 4.7 วินาที |

- ตัวเลขใน `DN_USAGE_FILE` ตรงกับ `usage_metadata` ทุกครั้ง · `ChatOllama` 1.3.0 ส่ง `stream: true` เสมอแม้เรียก `invoke` จึงผ่านทาง NDJSON ของ shim ทั้งคู่
- **ไม่ต้องแก้ hook และไม่ได้เพิ่ม test**

### langgraph-cli dev

ทดลองในโฟลเดอร์ที่จัดเหมือน repo (`lessons/046-studio/example.ts` import `../../src/lib/model` แบบไม่ใส่นามสกุล, `.langgraph/langgraph.json` สร้างแยก, ติดตั้งด้วย pnpm 12.21.0, TypeScript 6.0.3)

- **import ไม่ใส่นามสกุล:** ✅ ลงทะเบียน graph และรันผ่าน `POST /runs/wait` ได้คำตอบไทยใน 6.4 วินาที
- **env จาก config ในโฟลเดอร์อื่น:** ✅ config `.langgraph/langgraph.json` ที่มี `"env": "../.env"` (หรือไฟล์ชื่ออื่น) อ่านค่าได้ ยืนยันด้วย graph ที่คืน `process.env` ตรงๆ ไม่ผ่านโมเดล
  - path ใน `graphs` และ `env` นับจาก**โฟลเดอร์ของ config** เช่น `"../lessons/046-x/example.ts:graph"`
  - `cwd` ของ graph ยังเป็นโฟลเดอร์ที่สั่งรัน (root) ไม่ใช่โฟลเดอร์ config
  - ค่าใน `process.env` ที่มีอยู่แล้วชนะค่าในไฟล์ (cli ใช้ `dotenv.populate` แบบไม่ทับ)
- **`main` ไม่ถูกรัน:** ✅ ไฟล์ที่มี `export async function main()` (ในนั้นเขียนไฟล์ marker และ `process.exit(42)`) ถูก import แล้วไม่มี marker ไม่มีข้อความ และ server ไม่ตาย
- **Studio:** 🟡 เปิด `https://smith.langchain.com/studio?baseUrl=http://localhost:2024` โดยไม่ล็อกอินและไม่มี `LANGSMITH_API_KEY`:
  - หน้า Studio โหลด เห็น graph (`__start__ → callModel → __end__`) และ input schema ขึ้นแถบเตือน "LangSmith API key is missing"
  - ต้องอนุญาตการเข้าถึงเครือข่ายในเครื่องของ Chrome ก่อน ไม่งั้นขึ้น `Failed to initialize Studio … Failed to fetch`
  - `LANGSMITH_TRACING=false` ตลอดการทดลอง
  - ยังไม่ได้ส่งข้อความรันผ่านหน้า Studio และยังไม่ได้ทดสอบแบบมี key → 6b
  - ⚠️ **ผลนี้ขัดกับเอกสารออกแบบข้อ 3** ("`npx @langchain/langgraph-cli dev` ต้องมี LangSmith API key") · เงื่อนไขที่เห็นผลนี้:
    - คำสั่ง `pnpm exec langgraphjs dev --config .langgraph/langgraph.json --port 2024 --no-browser` (`@langchain/langgraph-cli` 1.7.2 + `@langchain/langgraph-api` 1.7.2 ติดตั้งเป็น devDependency ไม่ได้ใช้ `npx`) · Node 26.13.1 · ตั้ง `LANGGRAPH_CLI_NO_ANALYTICS=1`
    - `.env` และ process env ไม่มี `LANGSMITH_API_KEY` / `LANGCHAIN_API_KEY` · `LANGSMITH_TRACING=false`
    - server เปิดได้ (`GET /ok` 200) โดยไม่ขอ key · ใน source ของ `dev.mjs` ไม่มีจุดที่บังคับ key
    - เบราว์เซอร์คือ Chrome 157 headless profile ใหม่ ไม่ได้ล็อกอิน LangSmith · สิทธิ์ local network ให้ผ่าน CDP · URL ถูก redirect ไป `https://smith.langchain.com/studio/thread` แล้วแสดง graph, input schema, ปุ่ม Submit และแถบเตือน "It looks like your LangSmith API key is missing"
    - สิ่งที่**ยังไม่รู้**: รัน graph จากหน้า Studio ได้จริงไหมเมื่อไม่มี key, ฟีเจอร์ไหนใช้ไม่ได้ และ LangSmith จะบังคับล็อกอินในภายหลังหรือไม่
  - **การตัดสิน:** ยังไม่เปลี่ยนเอกสารออกแบบ · บท 046 ยังให้ผู้เรียนสมัครและใส่ `LANGSMITH_API_KEY` ตามเดิม · ต้องทดสอบซ้ำด้วย key จริงในข้อ 6b-6 แล้วค่อยตัดสินว่าจะเขียน README บท 046 ว่า key "จำเป็น" หรือ "แนะนำ"
- **repo ที่ใช้ pnpm:** ✅ ติดตั้งและรันได้ด้วย pnpm strict layout · เปิด server ใช้ราว 2–3 วินาที ทั้ง Node 26 และ 24
- **schema ของ graph กับ TypeScript 6.0.3:** ✅ `/assistants/{id}/schemas` คืน input schema ได้ แม้ langgraph-api ระบุ peer `typescript ^5.5.4`

**ข้อที่แผนที่ 6 (`scripts/studio.ts`) ต้องรู้**
- คำสั่งของแพ็กเกจชื่อ `langgraphjs` (bin → `dist/cli/cli.mjs`) · แพ็กเกจไม่มี `exports` จึงหา path ได้ด้วย `import.meta.resolve("@langchain/langgraph-cli/dist/cli/cli.mjs")` แล้วรัน `process.execPath <cli.mjs> dev --config .langgraph/langgraph.json --port 2024 --no-browser` (ทดลองแล้วใช้ได้ ไม่ผ่าน shell)
- ต้องติดตั้ง `@langchain/langgraph-checkpoint` เป็น dependency ตรง ไม่งั้น server เตือน `Some LangGraph.js dependencies are not up to date … '@langchain/langgraph-checkpoint': { version: '0.0.0', required: '^1.2.0' }` (ใส่แล้วหาย)
- cli เขียน `.gitignore` (บรรทัด `.langgraph_api`) และสร้างโฟลเดอร์ `.langgraph_api/` **ในโฟลเดอร์ของ config** ทุกครั้งที่ไฟล์ `.gitignore` ในโฟลเดอร์นั้นยังไม่มีคำว่า `.langgraph_api`
  - config ใน `.langgraph/` ไม่มีปัญหา เพราะ `.langgraph/` อยู่ใน gitignore แล้ว
  - บท 046 และ 108 ที่มี `langgraph.json` ในโฟลเดอร์บทจะเกิด `lessons/NNN-*/.gitignore` และ `.langgraph_api/` · ให้ commit `.gitignore` ที่มีบรรทัด `.langgraph_api` ไว้ในโฟลเดอร์บทนั้น และเพิ่ม `.langgraph_api/` ใน `.gitignore` ที่ root
- ปิดการส่ง analytics ของ cli ได้ด้วย `LANGGRAPH_CLI_NO_ANALYTICS=1` (cli ส่ง log การใช้งานออกไปภายนอกถ้าไม่ปิด) · แนะนำให้ `scripts/studio.ts` ตั้งค่านี้ให้
- Node 26 พิมพ์ `DeprecationWarning: module.register() is deprecated` ตอนเปิด server · Node 24 ไม่มี
- peer warning ตอนติดตั้ง: `typescript` (ต้องการ ^5.5.4 ได้ 6.0.3) และ `@hono/node-server` ภายใน langgraph-api · ไม่กระทบการทำงาน

### Next.js ~16.4: re-export หน้าเว็บและ route handler

- โครงที่ทดลอง: `lessons/142-use-stream/page.tsx` (`"use client"`) · `src/app/lessons/142/page.tsx` มีบรรทัดเดียว `export { default } from "../../../../lessons/142-use-stream/page";` · route ของบท 147 อยู่ใน `lessons/147-deploy/*.ts` และ `src/app/api/lessons/147/threads/[threadId]/{commands,stream,state}/route.ts` re-export `POST`/`GET`
- `next build` (Turbopack) ✅ ผ่าน ใช้เวลาราว 3 วินาที · typecheck ด้วย TypeScript 6.0.3 ผ่าน
- ❗ ถ้า re-export ค่า config ของ route จะ build ไม่ผ่าน: `Next.js can't recognize the exported 'dynamic' field in route. It mustn't be reexported.` (เช่นเดียวกับ `runtime`) · ทางแก้: ไฟล์ใน `src/app/` re-export เฉพาะ handler แล้วเขียน `export const dynamic = "force-dynamic"`, `export const runtime = "nodejs"`, `export const maxDuration = 300` ในไฟล์นั้นเอง (ทดลองแล้ว build ผ่าน)
- `next build` ครั้งแรกแก้ `tsconfig.json` เอง (เพิ่ม `.next/dev/types/**/*.ts` ใน `include`) และสร้าง `next-env.d.ts` · แผนที่ 19 ควรใส่ค่านี้ไว้ล่วงหน้าเพื่อไม่ให้ไฟล์ที่ commit เปลี่ยนตอนผู้เรียนรัน

### `useStream` จาก `@langchain/react`

ทดสอบในเบราว์เซอร์จริง (Chrome 157) กับ `next start -p 3200`

- **↔ langgraph dev server (บท 142–145):** ✅ `useStream({ apiUrl: "http://localhost:2024", assistantId: "example" })` ส่งข้อความแล้วได้คำตอบไทยใน 7.3 วินาที · ข้าม origin จาก `localhost:3200` ไป `localhost:2024` ได้โดยไม่ต้องตั้ง CORS · request ที่เห็น: `POST /threads/{id}/commands` แล้ว `POST /threads/{id}/stream/events` 2 ครั้ง
- **↔ route handler ของ Next.js ตาม Agent Streaming Protocol (บท 147):** ✅ ใช้ `new HttpAgentServerAdapter({ apiUrl, threadId, paths: { commands, stream, state } })` + `useStream({ transport })`
  - ฝั่ง server ทำตามตัวอย่าง `js-next` ของ `langchain-ai/deployment-cookbook`: `/commands` รับ `run.start` แล้วเริ่ม `graph.streamEvents(input, { version: "v3", configurable: { thread_id, run_id } })` · เก็บ event ลง `StreamChannel` · `/stream` ส่ง event ที่ `matchesSubscription()` เป็น SSE (`id:`/`event: message`/`data:`) · `/state` คืน 404 เมื่อยังไม่มี checkpoint · ทั้งหมด import จาก `@langchain/langgraph/stream` และ `@langchain/core/messages` (โค้ด server ราว 60 บรรทัด)
  - ได้คำตอบไทยใน 4.5–8.5 วินาที · รอบที่ 2 ใน thread เดียวกันจำข้อความแรกได้ (`MemorySaver`)
- ข้อสังเกตสำหรับหน้าเว็บ: `stream.messages` เป็น `BaseMessage[]` และ `content` ของข้อความ AI มาเป็น array ของ content block (`[{"type":"text","text":"…"}]`) · ให้แสดงด้วย `m.text` (ทดลองแล้วได้ข้อความล้วน)

### Agent Chat UI (บท 141)

- เปิด `https://agentchat.vercel.app/?apiUrl=http://localhost:2024&assistantId=example`:
  - ถ้าไม่อนุญาต: request ไป `localhost:2024` ค้าง (Chrome ถามสิทธิ์ `local-network-access`) หรือขึ้น `Error: Unable to connect to LangGraph server … Failed to fetch` (headless ปฏิเสธเอง)
  - อนุญาตสิทธิ์ local network ให้ origin นั้นแล้ว: ✅ ส่งข้อความไทยได้คำตอบใน 7.1 วินาที
  - ทดสอบการอนุญาตด้วย CDP (`Browser.setPermission`) แทนการกดปุ่มจริง · ยังไม่ได้ทดสอบ Safari/Firefox/Edge
- **ทางเลือก (ถ้าเบราว์เซอร์ของผู้เรียนต่อไม่ได้):** รันเองในเครื่องตาม README ของ `langchain-ai/agent-chat-ui`: `npx create-agent-chat-app` หรือ `git clone https://github.com/langchain-ai/agent-chat-ui.git` → `pnpm install` → `pnpm dev` แล้วเปิด `http://localhost:3000` · ตั้ง `NEXT_PUBLIC_API_URL=http://localhost:2024` และ `NEXT_PUBLIC_ASSISTANT_ID=<ชื่อ graph>` ใน `.env` ของแอปนั้นเพื่อข้ามหน้าตั้งค่า · localhost → localhost จึงไม่ติดเรื่องสิทธิ์ (ยังไม่ได้รันทางนี้จริง)
- **ทางที่เลือกสำหรับบท 141:** ใช้ตัวบนเว็บ · README บอกให้กด "อนุญาต" เมื่อเบราว์เซอร์ถามเรื่องเข้าถึงอุปกรณ์ในเครือข่าย และให้วิธีรันเองเป็นทางสำรอง

### MCP แบบ stdio (macOS)

- server ใช้ `McpServer` + `StdioServerTransport` จาก `@modelcontextprotocol/sdk` 1.32.2 · client ใช้ `MultiServerMCPClient` จาก `@langchain/mcp-adapters` 2.0.3 ด้วย `{ transport: "stdio", command: process.execPath, args: ["--import", "tsx", "src/shop/mcp-server.ts"] }`
- ✅ `getTools()` 418 มิลลิวินาที (Node 26) / 300 มิลลิวินาที (Node 24) · เรียก tool ตรงได้ผลภาษาไทย · `ChatOllama.bindTools(tools)` ผ่าน shim เลือก tool และ args ถูก
- ข้อควรรู้: ชื่อ tool ถูกเติมชื่อ server นำหน้า (`searchProducts` → `shop_searchProducts`) · `mcp-adapters` 2.x ใช้ `@modelcontextprotocol/client` 2.4.0 ภายใน แต่ต่อกับ server ที่เขียนด้วย SDK 1.32.2 ได้ · ฝั่ง server ห้ามพิมพ์ลง stdout (เป็นช่องของ protocol) ให้ใช้ `console.error`

### better-sqlite3 + pnpm 12 + `allowBuilds`

| pnpm | Node | ผล |
|---|---|---|
| 12.21.0 + `allowBuilds: { better-sqlite3: true }` | 26.13.1 | ✅ ติดตั้ง 4.9 วินาที ไม่มี "Ignored build scripts" · `SqliteSaver` จำ thread ข้ามการ invoke ได้ |
| 12.21.0 + `allowBuilds` | 24.22.3 | ✅ ติดตั้ง 1.6 วินาที · `SqliteSaver` ทำงาน |
| 12.4.1 + `allowBuilds` | 26.13.1 | ✅ โหลด `better-sqlite3` ได้ (SQLite 3.53.2) |
| 12.21.0 ไม่มี `allowBuilds` | 26.13.1 | ❌ `ERR_PNPM_IGNORED_BUILDS … Ignored build scripts: better-sqlite3@12.11.1` (ยืนยันว่าต้องใส่) |

- ใช้ไฟล์ prebuilt ไม่ได้ compile (มีแค่ `better_sqlite3.node`) · release 12.11.1 มี prebuilt ของ `node-v137` (Node 24) และ `node-v147` (Node 26) ครบ darwin/linux/win32 ทั้ง x64 และ arm64
- ❗ ไฟล์ `.node` ผูกกับรุ่น Node: ติดตั้งด้วย Node 26 แล้วรันด้วย Node 24 ได้ error `NODE_MODULE_VERSION 147. This version of Node.js requires …` (และกลับกัน) · ทางแก้ `pnpm rebuild better-sqlite3` · README บท 073 ควรมีข้อนี้
- `@langchain/langgraph-checkpoint-sqlite` 1.1.0 ล็อก `better-sqlite3 ^12.10.0` (ไม่ใช่ 13.x ที่เป็นรุ่นล่าสุด)

### LangGraph: `maxConcurrency` กับ `Send`

นับจำนวน node ที่รันพร้อมกันสูงสุด (peak) ด้วยตัวนับใน node

| งาน | `maxConcurrency` | peak | ผลครบ | เวลา |
|---|---|---|---|---|
| 10 งาน หน่วง 200 ms | ไม่ตั้ง | 10 | 10/10 | 222 ms |
| 10 งาน หน่วง 200 ms | 3 | 3 | 10/10 | 841 ms |
| 20 งาน หน่วง 200 ms | 5 | 5 | 20/20 | 839 ms |
| 6 งาน เรียกโมเดลจริงผ่าน shim | 2 | 2 | 6/6 | 10.9 วินาที |
| 6 งาน หน่วง 100 ms | 2 / 3 | 2 / 3 | 6/6 | 325 / 226 ms |
| **6 งาน หน่วง 100 ms** | **1** | 1 | **0/6 (รันแค่งานแรก)** | 116 ms |

- ❗ **bug ของ `@langchain/langgraph` 1.7.4 (รุ่นล่าสุดตอนทดลอง):** `maxConcurrency: 1` เมื่อ superstep มีงานมากกว่า 1 งาน → รันงานแรกงานเดียวแล้วจบ ไม่มี error · กับ graph ที่มี 2 กิ่งขนานแบบ edge ธรรมดา `invoke` คืน `undefined` · เป็นเหมือนกันทั้ง Node 24 และ 26
  - สาเหตุ: ลูปใน `_executeTasksWithRetry` ของ `pregel/runner.js` จบเมื่อ `executingTasksMap` ว่าง ซึ่งเกิดทันทีหลังงานแรกเสร็จเมื่อจำกัดไว้ที่ 1
  - `Runnable.batch([...], { maxConcurrency: 1 })` ของ `@langchain/core` ไม่มีปัญหานี้ (peak 1 ผลครบ 6/6)
- ทางที่เลือก: บทที่ใช้ `maxConcurrency` กับ graph (055, 059, 117) ใช้ค่า 2 ขึ้นไปเสมอ และไม่ยกตัวอย่างค่า 1 · ใส่ไว้ใน "จุดที่มักพลาด" ของบท 055 · ก่อนสร้างบทเหล่านั้นให้ลองซ้ำว่ารุ่นใหม่แก้แล้วหรือยัง
- ไม่ต้องใช้ทางสำรองของเอกสารออกแบบ เพราะค่า ≥ 2 ทำงานตรงตามที่สอน

### LangGraph: `InMemoryCache` + `cachePolicy`

- `InMemoryCache` ต้อง import จาก `@langchain/langgraph-checkpoint` (`@langchain/langgraph` 1.7.4 ไม่ได้ re-export) · ลำดับบทเรียนบท 114 เขียนไว้ถูกแล้ว · pnpm ต้องติดตั้งแพ็กเกจนี้เป็น dependency ตรง

| state | รอบ 1 | รอบ 2 (input เดิม) | รอบ 3 (input ใหม่) |
|---|---|---|---|
| `{ question: string }` + `cachePolicy: { ttl: 120 }` | 3,472 ms เรียกโมเดล 1 ครั้ง | **3 ms ไม่เรียกโมเดล** | 3,012 ms เรียก 1 ครั้ง |
| `MessagesAnnotation` + `cachePolicy: { ttl: 120 }` (key ปกติ) | 3,063 ms เรียก 1 ครั้ง | ❌ 2,946 ms เรียกซ้ำ | – |
| `MessagesAnnotation` + `keyFunc` ที่ใช้แค่ `type` กับ `text` ของข้อความ | 3,012 ms เรียก 1 ครั้ง | **3 ms ไม่เรียกโมเดล** | – |

- สาเหตุที่ messages ไม่เจอ cache: reducer ใส่ `id` สุ่มให้ข้อความทุกครั้ง key ปกติจึงไม่ซ้ำ (ยืนยันด้วย node ที่ไม่เรียกโมเดล: ไม่ใส่ id → node รัน 2 ครั้ง · ใส่ id คงที่ → รัน 1 ครั้ง)
- `keyFunc` ได้รับ argument เป็น array (`[input, ...]`) ไม่ใช่ input ตรงๆ
- ทางที่เลือกสำหรับบท 114: ตัวอย่างหลักใช้ state ที่เป็นข้อความธรรมดา (`question`) · ถ้าใช้ messages ให้สอน `keyFunc` และอธิบายเรื่อง id

### agentevals กับ `langchain` 1.6.6

- ✅ ติดตั้ง `agentevals` 0.0.7 แล้ว pnpm ใช้ `langchain` 1.6.6 ตัวเดียวกัน (เป็นรุ่นล่าสุดอยู่แล้ว) · `pnpm peers check` ไม่มีปัญหา
- `createAgent` ของ `langchain` 1.6.6 + `ChatOllama` (ผ่าน shim) + tool `getOrder`: ได้ข้อความ `human,ai,tool,ai` ใน 9.4 วินาที
- `createTrajectoryMatchEvaluator` แบบ `strict` และ `superset` (`toolArgsMatchMode: "ignore"`) ได้ `score: true` · `createTrajectoryLLMAsJudge({ prompt: TRAJECTORY_ACCURACY_PROMPT, judge: <ChatOllama> })` ได้ `score: true` พร้อมเหตุผลใน 7.0 วินาที
- ข้อสังเกต: agentevals ดึง `@langchain/openai` และ `openai` มาด้วย ทำให้ใน store มี `@langchain/core` 1.4.1 กับ `@langchain/langgraph` 1.7.4 สองชุด (ต่างกันที่ peer context) · ทดลองแล้วยังทำงานร่วมกันได้
- judge เรียก structured output ของโมเดล · Ollama Cloud ไม่รองรับ JSON schema → ต้องลองใน 6b ว่า judge ใช้กับ Cloud ได้ไหม

### แบ่ง chunk ภาษาไทย (`@langchain/textsplitters`)

ทดลองกับเอกสารนโยบายคืนสินค้าสมมติ 1 หน้า (Markdown 2,150 ตัวอักษร มีหัวข้อ `#`/`##`/`###` ข้อความไทยเว้นวรรคระหว่างวลี วลีที่ยาวที่สุดไม่มีช่องว่าง 109 ตัวอักษร) · ตรวจว่าขอบ chunk ตรงกับขอบคำของ `Intl.Segmenter("th", { granularity: "word" })` หรือไม่

| chunkSize / overlap | separators | chunk | ยาวสุด | ตัดกลางคำ |
|---|---|---|---|---|
| 100 / 20 | ค่าปกติ, markdown, หัวข้อก่อน (มีและไม่มี `""`) | 36 | 99 | 2 |
| 200 / 40 | ค่าปกติ `["\n\n","\n"," ",""]` | 20 | 187 | 0 |
| 200 / 40 | `["\n## ", "\n### ", "\n\n", "\n", " ", ""]` | 22 | 187 | 0 |
| 300 / 50 | หัวข้อก่อน | 10 | 259 | 0 |
| 500 / 80 | หัวข้อก่อน | 6 | 464 | 0 |
| 60, 100, 200 | หัวข้อก่อน + subclass ที่ตัดคำด้วย `Intl.Segmenter` | 54 / 36 / 22 | 59 / 97 / 187 | 0 |

- การตัดกลางคำเกิดเมื่อวลีที่ไม่มีช่องว่างยาวกว่า `chunkSize` เท่านั้น
- ❗ เอา `""` ออกจาก separators **ไม่ช่วย**: เมื่อตัดด้วย `" "` แล้วยังยาวเกิน splitter เรียกตัวเองด้วย separators ว่าง แล้วตกไปตัดทีละตัวอักษรอยู่ดี (`splitOnSeparator(undefined)` → `split("")`)
- **ค่าที่แนะนำสำหรับบท 094:**
  1. separators `["\n## ", "\n### ", "\n\n", "\n", " ", ""]` ให้ chunk เริ่มที่หัวข้อ + `chunkSize` ≥ 200 (`chunkOverlap` ราว 20%) · เอกสารร้านใน `src/shop/` ต้องเว้นวรรคระหว่างวลีไม่ให้วลีใดยาวเกิน 150 ตัวอักษร
  2. (ส่วนเสริมของบท) subclass ที่ override `splitOnSeparator` ให้ separator ว่างตัดด้วย `Intl.Segmenter("th", { granularity: "word" })` แทนตัวอักษร ไม่ตัดกลางคำแม้ chunk เล็กถึง 60 ตัวอักษร · ไม่ต้องติดตั้งแพ็กเกจเพิ่ม (ใช้ ICU ที่มากับ Node)

### Node 24: `--env-file-if-exists` + `--import tsx`

- ✅ `npx -y node@24 --env-file-if-exists=.env --import tsx scripts/run-cli.ts <fixture>` (Node 24.22.3 ที่ root ของ repo): ไฟล์ทดลองที่ import แบบไม่ใส่นามสกุลและ import `src/lib/env.ts` รันได้ · พิมพ์ภาษาไทย (รวมสระอำ) ถูก · อ่านค่าจาก `.env` ได้ (พิมพ์แค่ "ตั้งแล้ว") · `EnvError` ทำงาน
- ไม่มี `.env`: ยังรันได้ แต่ Node (ทั้ง 24 และ 26) พิมพ์ `.env not found. Continuing without it.` ลง stderr · README บท 002 ควรบอกว่าข้อความนี้ไม่ใช่ error
- `pnpm test` ของ repo ทั้งชุดผ่านบน Node 24.22.3 (10 ไฟล์ 109 test)
- `.env` แบบ CRLF อ่านค่าได้ถูกทั้ง `--env-file` และ `process.loadEnvFile` · `.env` ที่มี BOM ทำให้ชื่อตัวแปรตัวแรกกลายเป็น `﻿FOO` (ยืนยันเหตุผลที่ `.env.example` ขึ้นต้นด้วยคอมเมนต์ และที่ `pnpm preflight` ตรวจ BOM)

### hosting ของบท 147 และ Postgres บน cloud (อ่านจากเอกสารทางการ ดึงหน้าเมื่อ 2026-11-16)

**ข้อสรุป:** Vercel Hobby + Neon Free พอสำหรับบท 146–147 ตามเกณฑ์ข้อ 6 · **ตัวเลือกอื่น (Netlify, Render, Supabase) ยังประเมินไม่ครบ** เพราะหน้าทางการบางหน้าไม่ได้ระบุตัวเลขที่ต้องใช้ (ช่อง "หน้าไม่ระบุ" ในตาราง) · ยังไม่ได้ deploy จริง

แหล่งข้อมูล (ทุกหน้าดึงเมื่อ 2026-11-16 · "อัปเดต" คือวันที่หน้านั้นแสดงเอง):

| รหัส | หน้า | URL | อัปเดต |
|---|---|---|---|
| V1 | Vercel Functions Limits | https://vercel.com/docs/functions/limitations | 2026-08-24 |
| V2 | Vercel Hobby Plan | https://vercel.com/docs/plans/hobby | 2026-11-12 |
| N1 | Netlify Functions configuration | https://docs.netlify.com/build/functions/configuration/ | ไม่ได้บันทึก |
| N2 | Netlify Functions overview | https://docs.netlify.com/build/functions/overview/ | 2026-11-10 |
| N3 | Netlify pricing | https://www.netlify.com/pricing/ | หน้าไม่แสดงวันที่ |
| R1 | Render Deploy for Free | https://render.com/docs/free | หน้าไม่แสดงวันที่ |
| R2 | Render Web Services | https://render.com/docs/web-services | หน้าไม่แสดงวันที่ |
| P1 | Neon Plans | https://neon.com/docs/introduction/plans | 2026-11-12 |
| P2 | Supabase pricing | https://supabase.com/pricing | ไม่ได้บันทึก |

| ตัวเลือก | แผนฟรี | Node runtime | streaming | เวลาสูงสุดต่อ request | env / Postgres | ผล |
|---|---|---|---|---|---|---|
| **Vercel Hobby** | ฟรี [V2] | Node เต็มรูป (Fluid compute) [V1] | ได้ เวลา stream นับรวมใน max duration [V1] | **300 วินาที** ทั้งค่าเริ่มต้นและสูงสุดของ Hobby [V1] | ตั้ง env ได้ · ต่อ Postgres ภายนอก (Neon) ด้วย `DATABASE_URL` | **เลือก** |
| Netlify Functions | "$0 forever" · "300 credit limit" · compute คิด 10 credits ต่อ GB-ชั่วโมง [N3] | หน้าไม่ระบุ [N2, N3] | streamed response payload สูงสุด 20 MB · หน้าไม่ระบุเวลาสูงสุดของ stream [N1] | synchronous 60 วินาที ปรับไม่ได้ · scheduled 30 วินาที · background 15 นาที (background ไม่ใช่ response ที่ stream) [N1] · หน้าไม่ได้บอกว่าแผนฟรีต่างจากนี้ไหม [N1] | หน้า pricing ไม่พูดถึง env ของแผนฟรี [N3] · Next.js หน้าไม่ระบุ [N2, N3] | ไม่เลือก (เวลาสั้นกว่า Vercel 5 เท่า) · ประเมินไม่ครบ |
| Render Free web service | 750 ชั่วโมงต่อ workspace ต่อเดือน [R1] | รองรับ Node.js (มีตัวอย่าง Express) [R2] | หน้าไม่ระบุ SSE/streaming [R1, R2] · มีรายการ "WebSocket connections" [R2] | หน้าไม่ระบุ [R1, R2] | Postgres ฟรี 1 GB หมดอายุ 30 วันหลังสร้าง แล้วมีช่วงผ่อนผัน 14 วันก่อนลบ [R1] | สำรอง ถ้า 300 วินาทีไม่พอ (หลับหลังไม่มี traffic 15 นาที ตื่นราว 1 นาที [R1]) · ประเมินไม่ครบ ต้องทดสอบเองก่อนใช้ |

- ตัวเลขของ Vercel Hobby: RAM 2 GB / 1 vCPU [V1] · Active CPU 4 CPU-ชั่วโมงต่อเดือน · Provisioned Memory 360 GB-ชั่วโมงต่อเดือน · Function Invocations 1,000,000 ต่อเดือน · ใช้เกินโควต้าต้องรอ 30 วัน [V2] · route ต้องประกาศ `export const maxDuration = 300` ในไฟล์ `src/app/...` เอง (ผลการทดลอง Next.js ข้างบน ไม่ใช่จากเอกสาร)
- Postgres ที่เลือก: **Neon Free** [P1]: $0 ต่อเดือน · 1 GB ต่อโปรเจกต์ (รวม 20 GB ทั้งบัญชี) · 100 CU-ชั่วโมงต่อโปรเจกต์ต่อเดือน · 100 โปรเจกต์ · compute หลับหลังไม่มีการใช้ 5 นาทีและปิดไม่ได้ (request แรกหลังหลับช้าลง) · หน้านั้นไม่ได้พูดถึง connection pooling, การต้องใช้บัตรเครดิต หรือการลบฐานข้อมูลที่ไม่ได้ใช้
- ตัวเทียบ Postgres: Supabase Free [P2] 500 MB ต่อโปรเจกต์, active ได้ 2 โปรเจกต์, **หยุดโปรเจกต์หลังไม่มีการใช้ 1 สัปดาห์**, egress 5 GB · หน้าไม่ได้บอกว่าแผนฟรีมี connection pooler ไหมและต้องใช้บัตรไหม · Render Postgres ฟรีหมดอายุ 30 วัน [R1] → ทั้งสองไม่เหมาะกับผู้เรียนที่ทำบท 146–147 ห่างกันหลายสัปดาห์
- ยังไม่ได้ deploy จริง (ต้องใช้บัญชีของผู้ใช้) → แผนที่ 19 ต้องทดสอบตามหัวข้อ "ข้อเสี่ยงที่แผนที่ 19 ต้องทดสอบ" ข้างล่าง

## ผลที่กระทบแผนหลัง

- **แผนที่ 2:** usage hook ใช้กับ `ChatOllama` ได้ไม่ต้องแก้
- **แผนที่ 6 (`scripts/studio.ts`):** รัน `process.execPath <@langchain/langgraph-cli/dist/cli/cli.mjs> dev --config .langgraph/langgraph.json --no-browser` · ตั้ง `LANGGRAPH_CLI_NO_ANALYTICS=1` · ติดตั้ง `@langchain/langgraph-checkpoint` เป็น dependency ตรง · path ใน config นับจาก `.langgraph/` · บท 046/108 ที่มี `langgraph.json` ของตัวเองต้อง commit `.gitignore` (บรรทัด `.langgraph_api`) ในโฟลเดอร์บท และเพิ่ม `.langgraph_api/` ที่ root · README บอกให้กด "อนุญาต" เมื่อ Chrome ถามเรื่องเครือข่ายในเครื่องตอนเปิด Studio
- **แผนที่ 7 (บท 055, 059):** `maxConcurrency` บน graph ใช้ ≥ 2 เสมอ (bug ค่า 1) · ลองซ้ำก่อนสร้างว่ารุ่นใหม่แก้แล้วหรือยัง
- **แผนที่ 9 (บท 073):** `allowBuilds` ของ `better-sqlite3` ใช้ได้ · README บอกวิธี `pnpm rebuild better-sqlite3` เมื่อเปลี่ยนรุ่น Node
- **แผนที่ 12 (บท 094):** ใช้ separators และ `chunkSize` ตามค่าที่แนะนำ · เขียนเอกสารร้านให้มีช่องว่างระหว่างวลี
- **แผนที่ 14 (บท 114):** ตัวอย่าง cache ใช้ state ข้อความธรรมดา หรือสอน `keyFunc` กับ messages
- **แผนที่ 16 (บท 127):** ใช้ `@modelcontextprotocol/sdk` 1.x ฝั่ง server ได้ · ชื่อ tool มีชื่อ server นำหน้า · server ห้ามพิมพ์ลง stdout
- **แผนที่ 18 (บท 138):** agentevals 0.0.7 ใช้ได้ · ต้องลอง judge กับ Gemini/Ollama Cloud ใน 6b
- **แผนที่ 19:**
  - ค่า config ของ route ต้องเขียนในไฟล์ `src/app/...` ไม่ re-export · ใส่ `.next/dev/types/**/*.ts` ใน `tsconfig.json` ล่วงหน้า
  - หน้าเว็บแสดงข้อความด้วย `m.text`
  - บท 141 ใช้ Agent Chat UI บนเว็บ + ขั้นตอนกดอนุญาต · มีวิธีรันเองเป็นทางสำรอง
  - บท 147 ใช้ Vercel Hobby + Neon Free · โค้ด protocol ฝั่ง server ราว 60 บรรทัด ควรอยู่ใน `src/lib/` ให้ผู้เรียนเขียนแค่ graph
  - ทดสอบ deploy จริงตามหัวข้อถัดไปก่อนเขียนบท 147

### ข้อเสี่ยงที่แผนที่ 19 ต้องทดสอบ (deploy จริง)

`useStream` + `HttpAgentServerAdapter` ส่ง `/commands` แล้วเปิด `/stream` เป็น request แยก (ในเครื่องเห็น `/stream` 2 ครั้งต่อ 1 ข้อความ) · โค้ดแบบ cookbook เริ่ม run ใน `/commands` แล้วเก็บ event ไว้ในหน่วยความจำของ process · บน serverless request ทั้งสองอาจไปคนละ instance และ run อาจหยุดหลัง `/commands` ตอบกลับ · cookbook เองบอกว่าบน serverless ต้องมีที่เก็บ session/replay ร่วม (เช่น Redis) ซึ่งเกินแผนฟรีที่เลือก

ขั้นทดสอบในแผนที่ 19:
1. deploy ตัวอย่างบท 147 ขึ้น Vercel Hobby + Neon (checkpointer เป็น Postgres)
2. ส่งข้อความ 10 รอบจากเบราว์เซอร์ และ agent ที่วนหลายรอบ (ราว 60–120 วินาที) ดูว่าได้คำตอบครบทุกครั้ง
3. ถ้าไม่ครบ ลองให้ `/commands` แค่บันทึก input ลง Postgres แล้วให้ `/stream` เป็นตัวรัน graph ใน request ของตัวเอง
4. ถ้ายังไม่ได้ ใช้ทางสำรองของเอกสารออกแบบข้อ 5.8: เปลี่ยนเฉพาะฝั่ง client ของบท 147 และ 152 เป็น client SSE สั้นๆ บน `graph.stream` (request เดียว) โดยยังใช้ hosting ฟรี, Next.js ใน repo และไม่ใช้ LangSmith Cloud · บท 142–145 ไม่กระทบ · ถ้า 300 วินาทีไม่พอ ให้จำกัดจำนวนรอบของ agent

---

## เลื่อนไปท้ายสุด (6b)

ทำหลังสร้างบทครบตามภาคผนวกแก้แผน แล้วตามด้วยการตรวจบท 001–006 กับ provider จริง (`pnpm verify … --provider google --repeat 3`, `--provider ollama-cloud --repeat 3`, `--provider ollama` 1 รอบ) · ผลทุกข้อเขียนต่อท้ายไฟล์นี้ในหัวข้อ "ผล 6b" พร้อมวันที่ เวอร์ชัน ตัวเลขที่วัด และ PASS/FAIL

**กติกาเดิม:** ไม่ผ่านแล้วเอกสารออกแบบมีทางสำรอง (ข้อ 5.8) → ใช้ทางสำรองและบันทึก · ไม่มีทางสำรอง → หยุดแล้วรายงานผู้ใช้ ห้ามเดาทางแก้ · โค้ดทดลองอยู่นอก repo · ห้ามพิมพ์ค่า key

### ก่อนเริ่มแผน 2

- [ ] ผู้สอนรัน `internal/windows-checklist.md` ข้อ 1-5 บนเครื่อง Windows จริงก่อนเริ่มส่วนที่ 2 (ข้อ 1-5 ไม่ต้องใช้ key ของโมเดล) เพราะแผน 2 เพิ่ม `ask()` ที่อ่าน stdin ภาษาไทย ซึ่งเสี่ยงบน Windows ที่สุด · CI ยังไม่เคยรันเพราะยังไม่ได้ push

### 6b-0: ทดสอบครึ่ง Google ก่อนบท 007 (ถ้าผู้สอนให้ key เร็วกว่าท้ายสุด)

- [ ] ถ้ามี key ฟรีจาก AI Studio ก่อนถึงท้ายคอร์ส ให้รันครึ่ง Google ของ 6b-1 และ 6b-2 ก่อนเริ่มบท 007 (บทแรกที่ใช้ `ChatGoogle`) เพื่อไม่ให้ความเสี่ยงของ `@langchain/google` และการนับ usage ของ Gemini ไปค้างจนท้ายสุด · ผลเขียนต่อท้าย "ผล 6b" ตามปกติ

### ก่อนเริ่ม 6b: ของที่ต้องมี

- [ ] `.env` ที่ root มี (ถามผู้ใช้และรอจนได้ครบ):
  - `GOOGLE_API_KEY` ที่เปิด billing แล้ว (จาก Google AI Studio)
  - `VERIFY_OLLAMA_CLOUD_API_KEY` จากบัญชีที่มีเครดิต Ollama Cloud
  - `LANGSMITH_API_KEY`
- [ ] Ollama ในเครื่องเปิดอยู่ (เครื่องนี้ Ollama 0.40.16) และ `ollama signin` ได้
- [ ] หลังเลือกโมเดลใน Step 3–4 แล้ว เพิ่มใน `.env` ของผู้สอน: `VERIFY_OLLAMA_CLOUD_MODEL`, `VERIFY_OLLAMA_LOCAL_MODEL`, `VERIFY_OLLAMA_LOCAL_NUM_CTX` (ตัวแปรที่ `internal/verify/runner.ts` ต้องใช้) และ `GOOGLE_MODEL`
- [ ] โฟลเดอร์ทดลองใหม่นอก repo ติดตั้ง `@langchain/core@1.4.1`, `@langchain/ollama@1.3.0`, `@langchain/google@0.2.15`, `@langchain/google-genai` (รุ่นล่าสุด), `langchain@1.6.6`, `zod`, `tsx@4.23.15`

### 6b-1 (Step 1): ทดสอบ endpoint ของ provider ด้วย `fetch` อย่างเดียว

- [ ] **Google:**
  - `GET https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000` หัว `x-goog-api-key: <GOOGLE_API_KEY>` → 200 และมีโมเดลที่จะเลือกในรูป `models/<ชื่อ>`
  - `POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent` body `{ "contents": [{ "role": "user", "parts": [{ "text": "ตอบภาษาไทยสั้นๆ ร้านค้าออนไลน์คืออะไร" }] }] }` → ข้อความไทยใน `candidates[0].content.parts[].text` (ข้าม part ที่ `thought: true`) และมี `usageMetadata`
- [ ] **Ollama Cloud (ยิงตรง):**
  - `GET https://ollama.com/api/tags` หัว `Authorization: Bearer <VERIFY_OLLAMA_CLOUD_API_KEY>` → 200 และมีรายการ `models[].name` · **ต้องยืนยันว่าใช้กับ Cloud ได้จริง เพราะ `pnpm preflight` (`scripts/lib/doctor-checks.ts`) ใช้ endpoint นี้** และดูว่า key ผิดได้ 401 จริงไหม
  - `POST https://ollama.com/api/chat` body `{ "model": "<ชื่อ>", "messages": [{ "role": "user", "content": "…" }], "stream": false }` → ภาษาไทยใน `message.content` และมี `prompt_eval_count`/`eval_count`
  - ถ้า `/api/tags` ของ Cloud ใช้ไม่ได้: แก้ `checkOllama` ใน `scripts/lib/doctor-checks.ts` ไปใช้ endpoint ที่ใช้ได้และ**ไม่เสีย token** แก้ test ใน `doctor-checks.test.ts` ให้ตรง แล้วบันทึก
- [ ] **Ollama ในเครื่อง:** `GET http://localhost:11434/api/tags` และ `POST http://localhost:11434/api/chat` (body เดียวกัน ใส่ `"options": { "num_ctx": 8192 }`) → ภาษาไทย
- [ ] **Ollama Cloud ผ่าน `ollama signin`:** `ollama signin` → `ollama pull <ชื่อ>:cloud` → `GET http://localhost:11434/api/tags` ต้องมี `<ชื่อ>:cloud` (ยืนยันข้อความ "ให้รัน ollama pull …" ของ `pnpm preflight`) → `POST http://localhost:11434/api/chat` ด้วยชื่อ `:cloud` ได้ภาษาไทย
- เกณฑ์ผ่าน: ได้คำตอบภาษาไทยครบ 3 ทาง (Google, Ollama Cloud, Ollama ในเครื่อง)

### 6b-2 (ส่วนที่เหลือของ Step 2): usage hook กับ provider จริง

- [ ] ในโฟลเดอร์ทดลอง รันสคริปต์ที่เรียก `invoke` และ `stream` ของแต่ละแบบ โดยใส่ `--import <repo>/internal/verify/usage-hook.ts` และตั้ง `DN_USAGE_FILE=<ไฟล์ชั่วคราว>`:
  - `ChatOllama` ในเครื่อง (`baseUrl: "http://localhost:11434"`, `numCtx`)
  - `ChatOllama` ไป Cloud (`baseUrl: "https://ollama.com"`, `headers: { Authorization: "Bearer …" }`)
  - `ChatGoogle` จาก `@langchain/google` (ไม่ส่ง `temperature`)
- [ ] (ไม่บังคับ) `embedQuery` ของ Ollama (`/api/embed`) และ Google เพื่อดูว่า hook นับ token ขาเข้าได้ไหม
- เกณฑ์ผ่าน: `DN_USAGE_FILE` มี token มากกว่า 0 ทุกกรณี (ตัวอย่างรูปแบบผลจาก 6a: `{"input":48,"output":133}`)
- ถ้าไม่ผ่าน: แก้ `internal/verify/usage-hook.ts` / `usage.ts` ให้รองรับรูปแบบที่ได้จริง (เช่น host ของ Google ที่ `@langchain/google` เรียกอาจไม่ใช่ `generativelanguage.googleapis.com` หรือ body เป็น SSE รูปแบบอื่น) แล้วเพิ่ม test ใน `internal/verify/usage.test.ts` ด้วยตัวอย่าง body จริง (ลบข้อมูลส่วนตัวออก) · รัน `pnpm test` และ `pnpm check`

### 6b-3 (Step 3): เลือกโมเดล

- [ ] เลือกผู้สมัครจากรายการที่มีตอนนั้น (ดูจาก `/v1beta/models` และ `https://ollama.com/api/tags`):
  - Gemini 2–3 รุ่นที่อยู่ในแผนฟรีและตั้ง `thinkingLevel` ต่ำได้
  - Ollama Cloud 2–3 รุ่น
  - Ollama ในเครื่อง 2–3 รุ่นที่ขนาดพอสำหรับเครื่อง RAM 16 GB และเรียก tool ได้ (ปิดหรือลดการคิดได้)
- [ ] สคริปต์ทดสอบ 5 รอบต่อรุ่น แต่ละรอบทำ:
  1. ถามคำถามภาษาไทยเรื่องร้านค้า → คำตอบเป็นภาษาไทย
  2. `bindTools` 2 tool: `searchProducts({ query })` และ `getOrder({ orderId })` · ถามเรื่องสินค้า 1 ครั้งและเรื่องคำสั่งซื้อ 1 ครั้ง → ต้องเลือก tool ถูก (`ChatOllama` ไม่รองรับ `tool_choice` จึงวัดจากคำถามล้วน)
  3. `withStructuredOutput` ด้วย zod schema 3 field (เช่น `{ name: string, price: number, inStock: boolean }`) · **Ollama Cloud ใช้ `{ method: "functionCalling" }`** (ยืนยันข้อในลำดับบทเรียนว่า method นี้ใช้ได้จริง) → ผ่าน `schema.parse`
  4. จับเวลาแต่ละรอบ
- [ ] บันทึกตารางในไฟล์นี้: รุ่น · tool ถูก x/5 · structured ถูก x/5 · ภาษาไทย x/5 · เวลาเฉลี่ยต่อรอบ · ราคา/token (Cloud) · thinking ที่ตั้ง
- เกณฑ์เลือก: tool 5/5 และ structured 5/5 · ผ่านหลายรุ่นเลือกรุ่นที่เร็วกว่า · Cloud ดูราคาต่อ token ประกอบ
- เกณฑ์ผ่าน: มีรุ่นที่ผ่านอย่างน้อย 1 รุ่นในแต่ละทาง (Google, Ollama Cloud, ในเครื่อง) · **ทางไหนไม่มีรุ่นผ่านเลย ให้หยุดแล้วรายงานผู้ใช้**

### 6b-4 (Step 4): หาค่า `OLLAMA_NUM_CTX`

- [ ] รันโมเดลในเครื่องที่เลือกด้วย `num_ctx` 8192, 16384 และ 32768 (ส่ง prompt ยาวพอให้ใช้ context จริง เช่น เอกสารร้าน + ประวัติแชท)
- [ ] ดู RAM จาก `ollama ps` (คอลัมน์ SIZE) และความเร็ว (token/วินาที จาก `eval_count / eval_duration`)
- เลือกค่าสูงสุดที่โมเดลรวม context ใช้ RAM ไม่เกิน 10 GB (เหลือที่ให้ระบบบนเครื่อง 16 GB) · บันทึกตาราง num_ctx · RAM · token/วินาที

### 6b-5 (ข้อ Gemini ของ Step 5)

- [ ] `getModel` ที่ไม่ส่ง `temperature` ให้ Gemini ต้องไม่มี warning: `src/lib/model.ts` ยังไม่มีจนถึงแผนที่ 4 · ตอน 6b ถ้ายังไม่มีให้ทดสอบ `initChatModel` ของ `langchain` 1.6.6 กับ provider google และ `new ChatGoogle({ model })` โดยไม่ส่ง `temperature` · ดู stderr ว่าไม่มี warning/error ทั้ง `invoke` และ `stream` · ถ้ามี `model.ts` แล้วให้ทดสอบ `getModel()` ตรงๆ
- [ ] `GoogleGenerativeAIEmbeddings` จาก `@langchain/google-genai` ใช้กับ key จาก AI Studio ได้: `embedQuery("นโยบายคืนสินค้า")` และ `embedDocuments([...])` ได้ vector ความยาวมากกว่า 0 · จดชื่อโมเดล embedding ที่ใช้และขนาด vector

### 6b-6 ข้อที่ 6a ทำได้ไม่ครบ

- [ ] **Studio แบบมี key (ตัดสินข้อขัดกับเอกสารออกแบบข้อ 3 ที่นี่):** 6a เห็นหน้า Studio โหลดได้โดยไม่มี key (ดูหัวข้อ Studio ใน 6a) ซึ่งขัดกับเอกสารออกแบบ → **ต้องทดสอบซ้ำด้วย key จริงก่อนตัดสิน** · ใส่ `LANGSMITH_API_KEY` ใน `.env` และ `LANGSMITH_TRACING=false` → เปิด langgraph dev ตามวิธีใน 6a → เปิดลิงก์ Studio ในเบราว์เซอร์ที่ล็อกอิน LangSmith แล้ว กดอนุญาตเครือข่ายในเครื่อง → แถบเตือน "API key is missing" ต้องหาย · ส่งข้อความผ่าน Studio แล้วได้คำตอบ · ใน LangSmith ไม่มี trace ใหม่ (เพราะไม่เปิด tracing) · ทดสอบแบบไม่มี key ซ้ำด้วยว่าส่งข้อความผ่าน Studio ได้ไหม · บันทึกการตัดสิน: ถ้าแบบไม่มี key รัน graph ได้ครบ README บท 046 เขียนว่า key "แนะนำ" และแก้เอกสารออกแบบข้อ 3 · ถ้าไม่ได้ ให้คง "ต้องมี key" ตามเอกสารออกแบบ
- [ ] **agentevals judge กับ provider จริง:** `createTrajectoryLLMAsJudge({ judge: <ChatGoogle> })` และ `judge: <ChatOllama ไป Cloud>` · ถ้า Cloud ใช้ไม่ได้เพราะไม่รองรับ JSON schema ให้บันทึก และให้บท 138 ใช้ judge เป็น Google (หรือ `functionCalling` ถ้า openevals เปิดให้ตั้งได้)
- [ ] **`maxConcurrency` กับ Ollama Cloud:** graph ที่ `Send` 6 งานด้วย `maxConcurrency: 3` ไป Cloud (รับพร้อมกัน 3 request) ต้องไม่เจอ 429 · peak = 3

### 6b-7 (Step 7): ใส่ค่าที่เลือกลง `.env.example`

- [ ] แทน `CHANGE_ME` ของ `OLLAMA_MODEL` (รุ่นในเครื่องที่เลือก), `GOOGLE_MODEL`, `OLLAMA_NUM_CTX` (ค่าจาก 6b-4)
- [ ] ใส่ชื่อโมเดล Cloud ที่แนะนำ (ต่อท้าย `:cloud` สำหรับทาง `ollama signin` และชื่อเปล่าสำหรับทางยิงตรง) ในบล็อกคอมเมนต์ Ollama Cloud
- [ ] ใส่ชื่อโมเดลที่เลือกใน `lessons/003-setup-ollama-local/README.md`, `lessons/004-setup-ollama-cloud/README.md` และ `lessons/005-setup-google/README.md` (ถ้าไฟล์ยังไม่มี ให้ใส่ตอนสร้างไฟล์เหล่านั้น)
- [ ] Run: `pnpm check` → ผ่าน และ `.env.example` ไม่มี `CHANGE_ME` เหลือ (`grep CHANGE_ME .env.example` ไม่เจอ)
- [ ] Commit (ในเครื่องเท่านั้น ห้าม push): `git add internal/spikes.md .env.example` (+ ไฟล์ hook/test/doctor ถ้าแก้) แล้ว `git commit -m "docs: record spike results and chosen models"`

### 6b-8: เติมค่าที่ README ของบท 003-005 เว้นไว้ (marker `TODO(6b):`)

- [ ] หาจุดทั้งหมดด้วย `grep -rn "TODO(6b)" lessons` แล้วแทนด้วยค่าที่วัดได้ใน 6b-3 และ 6b-4 (ลบข้อความ `TODO(6b): ...` ทั้งก้อน เหลือแต่ค่า) จุดที่ต้องเติม:
  - `lessons/003-setup-ollama-local/README.md`: ตารางขนาดโมเดลตาม RAM (16 / 32 / 64 GB: ขนาดและชื่อตัวอย่าง), ชื่อโมเดลที่คอร์สแนะนำ, ค่า `OLLAMA_NUM_CTX` พร้อม RAM ที่ใช้เพิ่ม
  - `lessons/004-setup-ollama-cloud/README.md`: ชื่อโมเดล Cloud ที่แนะนำ (รูป `ชื่อ:cloud` และชื่อเปล่า)
  - `lessons/005-setup-google/README.md`: ชื่อโมเดล Google ที่แนะนำ (ให้ตรงกับ `GOOGLE_MODEL`)
- [ ] ตรวจว่า `grep -rn "TODO(6b)" lessons` ไม่เจออะไรเหลือ แล้ว `pnpm check`
- [ ] **ตรวจคำสั่งและขั้นตอนที่ README เขียนโดยยังไม่ได้ทดสอบจริง** (แก้ README ให้ตรงกับที่เห็น แล้วลบหมายเหตุ "ยังไม่ได้ทดสอบ" / "ยังไม่ได้ตรวจกับบัญชีจริง" ออก):
  - บท 003: slider "Context length" ใน Settings ของแอป Ollama, `launchctl setenv OLLAMA_CONTEXT_LENGTH` (macOS ไม่คงอยู่หลังรีสตาร์ต), `setx OLLAMA_CONTEXT_LENGTH` (Windows ต้อง Quit แล้วเปิด Ollama และ terminal ใหม่), ว่าตัวแปรสภาพแวดล้อมของ Ollama ตั้งผ่าน Settings บน Windows ได้หรือไม่ (เอกสาร FAQ)
  - บท 004: ขั้นตอน `ollama signin` (เปิดเบราว์เซอร์?), `ollama pull <ชื่อ>:cloud` โหลดแค่ข้อมูลอ้างอิง, ตำแหน่งหน้าสร้าง API key และปุ่มเติมเครดิต, ข้อความว่าไม่มีโควต้าฟรีและต้องเติมเงินก่อน (ตรวจกับบัญชีจริงและหน้า pricing)
  - บท 002: `corepack enable` บน Windows (EPERM, ทางเลือก `npm i -g pnpm@12`), `pnpm -v` นอกโฟลเดอร์โปรเจกต์ได้เลขอะไร
  - บท 005: ที่อยู่หน้า rate limit/usage ที่แน่นอนใน AI Studio (ใส่ลิงก์ตรง)
- [ ] **บท 003 `OLLAMA_NUM_CTX`:** README (บรรทัด ~93, ~149) บอกว่าโค้ดคอร์สส่งค่านี้ให้ Ollama ทุกครั้ง และแบบฝึกข้อ 3 ให้ลองลด/เพิ่ม `OLLAMA_NUM_CTX` แล้วดู RAM แต่ไม่มีโค้ดบท 001-027 ที่ส่ง `num_ctx` เลย (บท 006 ไม่มี `options`) ทำให้ลองแล้วไม่เห็นผล · แก้ README/แบบฝึกให้ตรง (เช่น "ตั้งแต่บท 028 ..." และเปลี่ยนข้อ 3 เป็น slider ในแอป หรือ `OLLAMA_CONTEXT_LENGTH` แล้วดู `ollama ps`) หรือเพิ่มโค้ดส่ง `num_ctx` เมื่อ model helper (แผน 4 `src/lib/model.ts`) พร้อมแล้ว

### 6b-9: รันบท 006 กับ provider จริง (Task 8 ทำได้แค่ opencode-dev)

- [ ] ไฟล์ `lessons/006-raw-fetch/*.google.ts` **ยังไม่เคยรัน** (เขียนตามเอกสาร Gemini REST: `POST /v1beta/models/{model}:generateContent`, header `x-goog-api-key`, body `contents/parts`, ข้าม part ที่ `thought: true`, token จาก `usageMetadata`) · ตรวจกับ Gemini จริงว่า `candidatesTokenCount + thoughtsTokenCount` เท่ากับ token ขาออกที่ถูกคิดเงิน (ดูที่หน้า usage/pricing) และตรงกับตัวเลขของ usage hook (`parseGeminiUsage`) · ถ้าไม่ตรง ปรับ example/exercise-2/3 และ README
- [ ] ตรวจว่า example.google ที่ไม่มีข้อความ (บล็อก/MAX_TOKENS) throw พร้อม finishReason/promptFeedback จริง และว่า `thought: true` โผล่เมื่อไหร่ (README เขียนว่า "ถ้ามี")
- [ ] ตรวจกับ Ollama ในเครื่อง: ex3 ถามซ้ำ 3 รอบ `prompt_eval_count` ของรอบ 2-3 ยังมากกว่า 0 (prompt cache ในบางรุ่นอาจทำให้ขาดหรือเล็กมาก)
- [ ] ตรวจว่า branch `solutions` มีจริงก่อนเผยแพร่ (README/ex ชี้ไป)
- [ ] Run: `pnpm verify 006 --provider google --repeat 3` → ผ่านครบ (ต้องตั้ง `GOOGLE_API_KEY` และ `GOOGLE_MODEL`)
- [ ] Run: `pnpm verify 006 --provider ollama-cloud --repeat 3` → ผ่านครบ
- [ ] Run: `pnpm verify 006 --provider ollama` → ผ่าน 1 รอบ (ตามเกณฑ์ข้อ 5.10)
- [ ] ตรวจว่า exercise-1.ollama และ exercise-1.google ฉบับ 👉 ที่ยังไม่แก้ พิมพ์ข้อความ 👉 แล้วจบด้วย exit 0 โดยไม่ยิง API (guard ก่อน fetch) กับ provider จริง
- [ ] ลบหมายเหตุ "ผลของไฟล์ `.google.ts` ในบทนี้ยังไม่ได้ทดสอบ" ใน `lessons/006-raw-fetch/README.md` และเทียบผลขั้นที่ 2 ตัวอย่างใน README กับที่ได้จริง
- [ ] เขียนผล (วันที่ ตัวเลข token PASS/FAIL) ต่อท้ายหัวข้อ "ผล 6b"


### 6b-10: ตรวจเฉลยของบท 001-006 บน branch `solutions` กับ provider จริง (Task 9 ทำได้แค่ opencode-dev)

- Task 9 รัน `pnpm verify 001-006 --provider opencode-dev --repeat 3` ผ่านใน worktree `../LANGGRAPH-solutions` แล้วเท่านั้น (ใช้ไฟล์ `.ollama`) · เฉลย `exercise-*.google.ts` ของบท 006 ผ่าน typecheck แต่ **ยังไม่เคยรัน**
- [ ] ลบหมายเหตุ `// หมายเหตุ: ไฟล์ .google.ts ของเฉลยยังไม่เคยรันกับ Gemini จริง` ออกจากเฉลย **ทั้ง 3 ไฟล์** บน branch `solutions`: `lessons/006-raw-fetch/exercise-1.google.ts`, `exercise-2.google.ts`, `exercise-3.google.ts` (ข้อ 6b-9 ครอบคลุมแค่หมายเหตุใน README) หลังรันผ่านแล้วเท่านั้น
- [ ] ใน worktree `../LANGGRAPH-solutions` (branch `solutions`) ที่ `.env` มีค่าครบตาม "ก่อนเริ่ม 6b" รัน:
  - `pnpm check`
  - `pnpm verify 001-006 --provider google --repeat 3`
  - `pnpm verify 001-006 --provider ollama-cloud --repeat 3`
  - `pnpm verify 001-006 --provider ollama`
- ผลที่คาดหวัง: ✅ ทุกรอบ · บท 001, 003, 004, 005 ขึ้น `– ไม่มีไฟล์ให้รัน` · **จดยอด token รวมของแต่ละ provider** (ขาเข้า/ขาออก) ต่อท้ายหัวข้อ "ผล 6b"
- ถ้ารอบไหนไม่ผ่าน ให้ดูว่าแก้ที่โค้ดบทหรือที่เกณฑ์ (เกณฑ์ตรวจโครง ไม่ตรวจถ้อยคำ) แก้บน `main` ก่อน แล้ว `git -C ../LANGGRAPH-solutions merge main` · ถ้าเฉลย `.google.ts` ผิด ให้แก้บน `solutions` โดยตรง


### 6b-11: บท 007–016 กับ provider จริง (แผน 2 ตรวจได้แค่ opencode-dev)

- [ ] main: `pnpm verify 007-016 --provider google --examples-only --repeat 3` · `--provider ollama-cloud --examples-only --repeat 3` · `--provider ollama --examples-only`
- [ ] solutions (`../LANGGRAPH-solutions`): `pnpm verify 007-016 --provider google --repeat 3` · `--provider ollama-cloud --repeat 3` · `--provider ollama`
- [ ] รันผ่านแล้วลบหมายเหตุ ".google.ts ยังไม่ได้ทดสอบ" ใน README 007–016 และคอมเมนต์หมายเหตุในเฉลย `.google.ts`
- [ ] `grep -rn "TODO(6b)" lessons` ไม่เหลือ
- เรื่องที่ต้องดูเป็นรายบท:
  - 007: `ChatGoogle` คืน `content` เป็น array หรือ string · usage hook นับ token ของ `ChatGoogle` ได้ (ผ่าน `fetch(Request)`) · `model.model` ของ `ChatGoogle` คืนชื่อเดียวกับ `GOOGLE_MODEL`
  - 008: `ChatGoogle` เก็บเหตุที่หยุดไว้ที่ `finish_reason` หรือ `finishReason` (example.google.ts อ่านทั้งสองชื่อและ throw ถ้าไม่มี) และค่าจริงคืออะไร · `usage_metadata.output_tokens` ของ Gemini รวม thinking หรือไม่ เทียบกับ usage hook · `contentBlocks` ของ Gemini
  - 009: Gemini รับ `{ role: "system" }` และ few-shot ที่มี ai message
  - 010:
    - `ChatGoogle` ที่ไม่ส่ง temperature ไม่มี warning
    - `maxOutputTokens` 20 ได้ `MAX_TOKENS` และข้อความอาจว่างเพราะความคิดใช้ token ไป
    - Ollama ในเครื่อง `numPredict` 20 ได้ `length`
  - 011:
    - `thinkingLevel` ใช้ได้กับ `GOOGLE_MODEL` ที่เลือกไหม (บางรุ่นใช้ `thinkingBudget`) และได้ block reasoning จริงไหม
    - รุ่น Ollama ที่เลือกรองรับ `think: true/false` ไหม และ error ของรุ่นที่ไม่รองรับ (`TODO(6b)` ใน README)
  - 012:
    - field status ของ error จาก `ChatGoogle` (`status` หรือ `status_code`) และเลขจริงเมื่อชื่อโมเดลผิดหรือ key ผิด แล้วล็อกในเกณฑ์ `example.google`
    - Ollama Cloud key ผิดได้ 401
    - `fetch failed` บน Windows ใช้เวลาเท่าไร
    - error เมื่อโมเดลไม่รองรับ tools
  - 013:
    - `ChatGoogle` `.stream(q, { timeout: 1 })` ได้ `TimeoutError` และ `maxRetries` ลองใหม่จริงเมื่อเจอ 429
    - ข้อความเมื่อเครดิต Ollama Cloud หมด และลิงก์ dashboard (`TODO(6b)` ใน README)
  - 014:
    - ลิมิตของแผนฟรี Gemini และของ Ollama Cloud (`TODO(6b)` ใน README)
    - `handleChatModelStart` ทำงานกับ `ChatGoogle`
    - batch แบบไม่จำกัดกับแผนฟรีได้ 429 ไหม (จดผล ห้ามใส่เป็นเกณฑ์)
  - 015:
    - `ChatGoogle` stream ได้หลายชิ้น (เกณฑ์ `example.google` ต้องการชิ้นที่มีข้อความอย่างน้อย 2 ชิ้น) และ `model.stream(q, { signal })` ที่ abort แล้วได้ `AbortError` (ชื่อ error ตรงกับที่ `example.google` และ `exercise-2.google` เช็ก) หรือ loop จบเอง ไม่ค้าง
    - Ollama จริงได้กี่ชิ้นต่อคำตอบ (README บอกว่าส่งทีละ token) และ abort กลาง stream ได้ `AbortError` เหมือนที่เห็นผ่าน shim
  - 016:
    - `ChatGoogle` stream แล้ว `concat` ทุกชิ้นได้ `usage_metadata` ที่ `input_tokens` และ `output_tokens` มากกว่า 0 (`exercise-3.google`) และ token ขาเข้าตาที่ 2 มากกว่าตาที่ 1
    - Gemini รับประวัติที่ตัดแล้วซึ่งขึ้นต้นด้วย system ตามด้วย human (`exercise-2.google`) และรับประวัติที่มี `AIMessage` ที่สร้างจากข้อความ stream
    - Gemini ไม่ error กับ system message ที่เป็นตัวแรกของ `history` เมื่อเรียก `model.stream(history)` (`example.google`)
    - Ollama จริงอาจรายงานเฉพาะ token ที่ไม่ได้อยู่ใน cache ทำให้ N ตาที่ 2 ไม่มากกว่าตาที่ 1
    - ChatGoogle อาจใส่ usage_metadata สะสมมาทุกชิ้น ทำให้ concat รวมซ้ำ
    - ลองแชทด้วยมือกับ provider จริง (แผนนี้ไม่มีขั้นลองแชทด้วยมือ เพราะ shim เปิดได้ผ่าน `pnpm verify` เท่านั้น): `pnpm lesson 016 example.ollama` พิมพ์ไทย ลบตัวอักษรไทยด้วย Backspace กด Enter เปล่า แล้วพิมพ์ `จบ` โปรแกรมต้องจบเองและพิมพ์ `ลาก่อนครับ` · ลองซ้ำด้วย Ctrl+D (macOS) และ Ctrl+C
    - รายการ `ask()` ใน `internal/windows-checklist.md` (หัวข้อ "ทดสอบเมื่อถึงแผนที่ 2") ครอบคลุมข้อที่เกี่ยวกับบท 016 บน Windows: Ctrl+D ใน PowerShell ไม่จบ, Ctrl+Z แล้ว Enter จบ, และ pipe ไทยจาก PowerShell 5.1
    - ค่าที่ส่งต่อจากการรีวิว `ask()` (บท 016 บน Windows): pipe ภาษาไทยจาก PowerShell 5.1 (`"สวัสดี" | pnpm lesson 016 ...`) อาจเพี้ยนตาม `$OutputEncoding` และอาจมี BOM นำหน้า (พิมพ์เองใน terminal ไม่มีปัญหา) · Ctrl+D ใน PowerShell ไม่ใช่ EOF ต้องกด Ctrl+Z แล้ว Enter · จดผลไว้ใน "ผล 6b" · ผู้เรียนควรออกด้วยการพิมพ์ `จบ` หรือ Ctrl+C
- เฉลย `exercise-*.google.ts` ของบท 007–016 บน `solutions` ทั้ง 22 ไฟล์ (007: 3 ไฟล์, 008–015: บทละ 2 ไฟล์ รวม 16, 016: 3) ยังไม่เคยรันกับ Gemini จริง ต้องรันตามข้อบน (solutions) ให้ผ่านก่อนลบหมายเหตุ
- ไม่ต้องบันทึกอะไรของแผน 2 ใน `.superpowers/` ตอนทำ 6b: รายงานและ ledger ชั่วคราวอยู่ใน `.superpowers/sdd/` ไม่ commit · ผลจริงเขียนต่อท้าย "ผล 6b" ในไฟล์นี้เท่านั้น
