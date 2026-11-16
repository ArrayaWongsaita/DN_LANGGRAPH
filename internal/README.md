# คู่มือผู้สอน (DN_LANGGRAPH)

ไฟล์นี้สำหรับผู้สอนเท่านั้น: วิธีตรวจบทด้วยโมเดลจริง ดูแล branch `solutions` และเตรียมตัวก่อนสอนแต่ละรอบ ผู้เรียนไม่ต้องอ่าน ผู้เรียนใช้ `pnpm preflight` ตรวจเครื่องตัวเอง (README ของบท 002)

เอกสารที่เกี่ยวข้อง:

- [`spikes.md`](./spikes.md): ผลทดลองก่อนสร้าง และ checklist 6b ที่ต้องทำกับ provider จริงก่อนปล่อย repo
- [`windows-checklist.md`](./windows-checklist.md): รายการทดสอบบน Windows
- เอกสารออกแบบ: `docs/superpowers/specs/2026-11-15-dn-langgraph-course-design.md` (ข้อ 5.9 เฉลย, 5.10 การตรวจ, 5.14 การปล่อย repo)

## 1. ตัวแปรใน `.env` ของผู้สอน

`.env` ไม่ถูก commit (อยู่ใน `.gitignore`) ห้ามใส่ค่าจริงใน `.env.example` และห้ามพิมพ์ค่า key ลงหน้าจอหรือ log

| ตัวแปร | ใช้กับ | ความหมาย |
|---|---|---|
| `GOOGLE_API_KEY`, `GOOGLE_MODEL` | `--provider google` | key จาก Google AI Studio (ควรเปิด billing เพื่อไม่ชนโควต้าฟรี) และชื่อโมเดล (ชื่อเปล่า ไม่มี `models/`) |
| `VERIFY_OLLAMA_CLOUD_API_KEY` | `--provider ollama-cloud` | key ของ Ollama Cloud (บัญชีที่มีเครดิต) ยิงตรงที่ `https://ollama.com` |
| `VERIFY_OLLAMA_CLOUD_MODEL` | `--provider ollama-cloud` | ชื่อโมเดลบน Cloud (ชื่อเปล่า) |
| `VERIFY_OLLAMA_LOCAL_MODEL` | `--provider ollama` | ชื่อโมเดลในเครื่องตาม `ollama list` |
| `VERIFY_OLLAMA_LOCAL_NUM_CTX` | `--provider ollama` | ค่า `OLLAMA_NUM_CTX` สำหรับโมเดลในเครื่อง |
| `OPENCODE_API_KEY`, `OPENCODE_DEV_MODEL` | `--provider opencode-dev` | ใช้ตอนพัฒนาคอร์สเท่านั้น ดูหัวข้อถัดไป |

ชื่อตัวแปรที่ `pnpm verify` ต้องใช้อยู่ใน `internal/verify/runner.ts` ถ้าขาดตัวไหน verify จะหยุดพร้อมบอกชื่อที่ขาด

## 2. `opencode-dev`: provider สำหรับพัฒนา

`opencode-dev` ไม่ใช่ทางที่ผู้เรียนใช้ และ **ไม่นับเป็นผลตรวจก่อนปล่อย** เป็นทางให้ผู้สร้างคอร์สรันบทที่เรียกโมเดลได้ระหว่างพัฒนา โดยยังไม่ต้องมี key ของ Google/Ollama Cloud:

- `internal/dev/opencode-shim.ts` เปิดเซิร์ฟเวอร์ HTTP ในเครื่องที่ **พูดภาษา Ollama (`/api/chat`)** แล้วแปลงคำขอไปเรียก API ของ opencode (รูปแบบ OpenAI-compatible) แล้วแปลงคำตอบกลับเป็นรูปแบบ Ollama (`message.content`, `prompt_eval_count`, `eval_count`) ตัวแปลอยู่ใน `internal/dev/opencode-translate.ts`
- บทต่างๆ จึงยิงมาที่ shim เหมือนยิง Ollama จริง ใช้ได้เฉพาะไฟล์ `.ollama` (ไม่มีทางทดสอบไฟล์ `.google` ผ่าน shim)
- **shim เลียนได้:** `/api/chat` แบบข้อความธรรมดา, จำนวน token (`prompt_eval_count`, `eval_count`), การ stream (ส่งเป็น NDJSON ชิ้นเดียวหลายก้อนจากคำตอบที่ได้ครบแล้ว), `think: false` (ส่ง `thinking: {type:"disabled"}` ซึ่งใช้ได้กับโมเดลตระกูล deepseek เท่านั้น) และ reasoning ที่แปลงเป็น field `thinking`
- **shim เลียนไม่ได้ หรือไม่ตรงของจริง:** ไฟล์ `.google`, tool call และ structured output ที่ตรงกับ provider จริง, ขนาดและจังหวะของชิ้น stream จริง, error ของ provider (401/404/429 ข้อความจริง), เครดิตหมด และพฤติกรรมของ Ollama ในเครื่อง (เช่น `fetch failed`) · ข้อเหล่านี้อยู่ใน 6b ของ [`spikes.md`](./spikes.md) (รายละเอียดสิ่งที่ทดลองใน 6a อยู่หัวข้อ "ทำแล้ว (6a)")
- header ที่ opencode บังคับ shim ใส่ให้เอง ผู้เรียนไม่ต้องทำและบทไม่ต้องมีโค้ดส่วนนี้
- `pnpm verify` เปิด shim ให้เองเมื่อใช้ `--provider opencode-dev` และปิดตอนจบ ไม่ต้องรันแยก
- ต้องมี `OPENCODE_API_KEY` และ `OPENCODE_DEV_MODEL` ใน `.env` (ตัวหลังคือชื่อโมเดลที่ opencode ให้ใช้)

```bash
pnpm verify 001-006 --provider opencode-dev --repeat 3
```

ผ่านด้วย `opencode-dev` แปลว่าโครงของบทและเกณฑ์ใน `internal/checks/` ใช้ได้ ไม่ได้แปลว่าผ่านกับ Google หรือ Ollama Cloud ต้องรันตามหัวข้อ 5 ก่อนปล่อยเสมอ

## 3. ข้อมูลร้าน `src/shop/`, zod และ structured output

ช่วงที่ 3 เริ่มใช้ข้อมูลร้านจริงและให้ผู้เรียนเขียน schema เอง ข้อตกลงต่อไปนี้ใช้กับบทหลังจากนี้ด้วย

### ข้อมูลร้าน `src/shop/`

- แยกเป็น `types.ts` (ชนิดข้อมูลกับป้ายไทย), `products.ts`, `customers.ts`, `orders.ts` และ `reset.ts` ไม่มี `index.ts` บทจึง import จากไฟล์ที่ใช้ตรงๆ เช่น `import { getOrder } from "../../src/shop/orders"`
- ข้อมูลตั้งต้นอยู่ในหน่วยความจำของโมดูล (ไม่มีฐานข้อมูล) ฟังก์ชันที่คืนข้อมูลคืน **สำเนา** ด้วย `structuredClone` ผู้เรียนแก้ผลลัพธ์ได้โดยไม่ทำข้อมูลกลางเสีย
- `resetShop()` คืนทั้งสินค้าและคำสั่งซื้อเป็นชุดตั้งต้น ใช้เมื่อรันซ้ำหรือใน test (`products.test.ts`, `orders.test.ts`) ไม่ได้ใช้ในบท
- `getOrder(orderId, customerId)` ต้องได้ทั้งรหัสคำสั่งซื้อและรหัสลูกค้า คืน `undefined` ทั้งกรณีไม่มีคำสั่งซื้อนั้นและกรณีเป็นของลูกค้าคนอื่น (ไม่บอกว่ามีอยู่จริง) · ตัดช่องว่างหัวท้ายและไม่สนตัวพิมพ์เล็กใหญ่ · รหัสลูกค้าในบทมาจากระบบหรือค่าคงที่ของบท ห้ามให้โมเดลเลือกเจ้าของ ไม่งั้นโมเดลจะขอดูคำสั่งซื้อของคนอื่นได้
- `searchProducts` ค้นแบบ substring: แยก keyword ด้วยช่องว่าง ทุกคำต้องปรากฏในชื่อ + tags + ป้ายหมวด (ไม่ค้นใน `description` และไม่ใช่ fuzzy) · `keyword`, `category`, `maxPrice` ที่เป็น `null` หรือ `undefined` แปลว่าไม่กรอง field นั้น
- **ห้ามคัดลอกข้อมูลสินค้าหรือคำสั่งซื้อลงในบท** ให้เรียกฟังก์ชันของ `src/shop` หรือสร้างข้อความจากผลของฟังก์ชัน ไม่งั้นราคาและสถานะในบทจะค้างเมื่อข้อมูลกลางเปลี่ยน

### zod

- zod `~4.6.7` และ import แบบ `import * as z from "zod"` (`z.config`, `z.locales.th`, `z.prettifyError`, `z.toJSONSchema` อยู่บน namespace นี้)
- ข้อความ error ของ zod ต้องเป็นภาษาไทย: ไฟล์ที่พิมพ์ error เรียก `z.config(z.locales.th())` ครั้งเดียวหลัง import รวมถึงไฟล์ schema ที่ใช้ร่วมกัน (เช่น `lessons/020-json-and-zod/search-filter.ts`) · ถ้าลืม ข้อความจะเป็นภาษาอังกฤษและไม่ตรงกับ "ผลที่ควรเห็น"
- `.optional()` แปลว่า "ไม่ส่ง field นี้มา" ไม่ได้แปลว่า "ส่ง `null` มา" บท 020 สอนเรื่องนี้ตรงๆ ว่า `null` ไม่ผ่าน zod
- **placeholder ของ schema ในแบบฝึกหัด:** ใช้ `z.custom<T>()` ที่ยอมทุกค่า หรือ schema ที่หลวมกว่า แล้วมี guard ที่ `safeParse` ตัวอย่างที่ **schema ที่ถูกต้องต้องไม่ผ่าน** (เช่น `orderId: "1002"`, `P999`, `quantity: 0`) แล้วหยุด (`👉`) เมื่อ placeholder ยอมตัวอย่างนั้น (ดู `buildSchema` ของบท 020 exercise-1, `productIdField` / `cartSchema` ของบท 021, `describeFailure` / `classifyWithRetry` ของบท 022)

### structured output

- ไฟล์ `.ollama` ส่ง `{ method: "functionCalling" }` เสมอ เพราะ Ollama Cloud ไม่รับ schema ทาง `format` (`jsonSchema`) · ไฟล์ `.google` ส่งแค่ `{ name: … }` เพราะ `ChatGoogle` ใช้ `functionCalling` ที่บังคับ `tool_choice` เป็นค่าเริ่มต้น
- `ChatOllama` ไม่มี `tool_choice` บทจึงต้องเขียนชื่อเครื่องมือใน system message (เช่น `CLASSIFY_SYSTEM` ของบท 022) และถือว่าโมเดลอาจตอบเป็นข้อความธรรมดาจนได้ `undefined` เป็นเรื่องปกติที่บทต้องอธิบายได้
- shim `internal/dev/opencode-shim.ts` ส่ง `tools` ต่อตามที่ได้และ **ไม่เติม `tool_choice`** · ผลทดลอง Task 3 (deepseek ผ่าน shim) อยู่หัวข้อ "structured output ผ่าน opencode shim (แผน 3)" ใน [`spikes.md`](./spikes.md): ได้ object 5/5 และไม่มี `null` ใน field ที่ `.optional()` จึงคง `.optional()` ไม่เปลี่ยนเป็น `.nullish()` · ผลนี้ยังต้องยืนยันกับ Ollama และ Gemini จริงใน 6b-12
- `includeRaw: true` กับ `.batch()` ของ `@langchain/core` 1.4.1: `includeRaw` ประกอบ chain ด้วย `withFallbacks` (fallback คืน `parsed: null`) และ `RunnableWithFallbacks.batch()` รัน fallback ให้ทุก input เมื่อมีข้อเดียวล้ม `parsed` ของทุกข้อจึงเป็น `null` บท 022 จึงเรียก `invoke` ทีละข้อ (ทั้ง example และแบบฝึกหัด 1) เพราะต้องบอกได้ว่าข้อไหนผิด — บทที่ต้องรายงานรายข้อห้ามใช้ `.batch` กับ `includeRaw`
- `describeFailure` ของบท 022 ตรวจ args ด้วย `StrictQuestion` (= `CustomerQuestion` + `summary.max(15)`) ไม่ใช่ `CustomerQuestion` เพราะ `CustomerQuestion.safeParse` ผ่านพอดีกับ args ที่ล้มในขั้นของ schema ที่เข้มกว่า

## 4. Branch `solutions` และลำดับการแก้

`solutions` คือ `main` บวกเฉลยของแบบฝึกหัดทุกข้อ (แทนที่บรรทัด 👉 ด้วยโค้ดจริง พร้อมคอมเมนต์ภาษาไทยว่า "ทำไม" และไม่เหลือ 👉) ผู้เรียนอ่านบนเว็บ GitHub ได้โดยไม่ต้อง checkout

ใช้ git worktree แยกโฟลเดอร์ จะได้ไม่ต้องสลับ branch ในโฟลเดอร์หลัก:

```bash
# ครั้งแรก (ทำแล้วสำหรับช่วงที่ 1)
git worktree add ../LANGGRAPH-solutions -b solutions
cd ../LANGGRAPH-solutions
pnpm install
cp ../LANGGRAPH/.env .env      # .env ไม่ถูก commit ต้องคัดลอกเอง
```

ลำดับการแก้ (**แก้บน `main` เสมอ** ยกเว้นตัวเฉลยเอง):

1. แก้บทหรือเกณฑ์บน `main` แล้ว commit
2. `git -C ../LANGGRAPH-solutions merge main`
3. ถ้า conflict ในไฟล์ `exercise-*` ให้ **เก็บโค้ดเฉลยไว้** (`git checkout --ours` ใน worktree `solutions`) แล้วปรับให้เข้ากับโจทย์ที่เปลี่ยน (ถ้าโจทย์เปลี่ยนต้องอัปเดตเฉลยด้วย) · กรณี renumber ดูหัวข้อถัดไป
4. ใน worktree รัน `pnpm check` และ `pnpm verify` ของบทที่แก้ ให้ผ่านก่อนไปต่อ
5. ห้ามแก้ไฟล์นอก `exercise-*` บน `solutions` เพื่อไม่ให้เกิด conflict ซ้ำๆ

### เพิ่ม ลบ หรือสลับเลขบท: `pnpm renumber`

```bash
pnpm renumber insert 012 --dry-run   # ดูแผนก่อน ไม่แก้ไฟล์
pnpm renumber insert 012             # เลื่อนบทตั้งแต่เลขนี้ขึ้นไปอีก 1 แล้วสร้างช่องว่างให้บทใหม่
pnpm renumber remove 012 --dry-run
pnpm renumber remove 012             # หลังลบโฟลเดอร์ของบทนั้นเอง เลื่อนบทหลังจากนั้นลง 1
```

- เปลี่ยนชื่อโฟลเดอร์ `lessons/NNN-*`, ไฟล์ `internal/checks/NNN.ts` และ `internal/verify/checks-NNN.test.ts` (พร้อมแก้ import `../checks/NNN` กับเลขบทในไฟล์นั้น) · แก้เลขบทใน README (ตารางสารบัญและลิงก์), ใน README/โค้ดของแต่ละบท, ใน `internal/*.md`, `.env.example` และเลขที่ฝังในไฟล์ allowlist 3 ไฟล์: `src/lib/env.ts`, `scripts/lib/doctor-checks.ts`, `scripts/lib/course-rules.ts` · ไม่แตะ `docs/` และไฟล์ `*.test.ts` อื่นๆ แต่ test ที่เทียบเลขบทจริงอ่านจากค่าคงที่ (`ENV_LESSON`, `SETUP_LESSON`, `STUDIO_FROM`, `PROVIDER_PAIRS_FROM`/`PROVIDER_PAIRS_TO`) จึงผ่านเองหลัง renumber · test ใหม่ที่ต้องอ้างเลขบทจริงให้อ่านจากค่าคงที่เหล่านี้ · `internal/verify/checks-keys.test.ts` จับเกณฑ์ตรวจที่ key ไม่ตรงไฟล์ของบท · ตอน `remove` ที่อ้างถึงบทที่ถูกลบจะถูกรายงาน (⚠️) ให้แก้เอง
- ปฏิเสธเมื่อ working tree ไม่สะอาด, เลขชนกัน หรือบางขั้นล้มเหลว ใช้ `--dry-run` ก่อนทุกครั้ง
- **ลำดับกับ branch `solutions`** (ทดสอบแล้วบน clone: insert 014 → merge ได้ conflict เฉพาะ `lessons/*/exercise-*` ของบทที่ถูกเลื่อน):
  1. บน `main`: `pnpm renumber insert NNN` แล้ว commit (สร้างบทใหม่ในช่องว่างและ commit ต่อได้)
  2. ใน `../LANGGRAPH-solutions`: รัน **คำสั่งเดียวกัน** (`pnpm renumber insert NNN`) แล้ว commit เพื่อให้เลขใน comment `// รัน: pnpm lesson ...` ของเฉลยเลื่อนตามด้วย
  3. `git merge main` ใน worktree นั้น
  4. conflict จะอยู่ใน `lessons/*/exercise-*` เท่านั้น ให้ใช้ฝั่งเฉลย: `git diff --name-only --diff-filter=U | xargs git checkout --ours` แล้ว `git add -A` และ commit (อย่าเลือก `--theirs` เพราะจะเอา 👉 กลับมา)
  5. `pnpm check` (มีกฎจับ `pnpm lesson MMM` ที่เลขไม่ตรงบท) และ `pnpm test` ต้องผ่าน
- **ทดลองก่อนเลื่อนเลขจริง:** ทำใน clone ทิ้งจาก commit ปัจจุบัน (ไม่แตะ repo และไม่ต้องใช้ key)

  ```bash
  N=017
  TRIAL="$(mktemp -d)/trial"
  git clone --quiet --local . "$TRIAL" && cd "$TRIAL"
  pnpm install --offline --frozen-lockfile
  pnpm renumber insert $N
  mkdir "lessons/$N-new"
  printf '# บทแทรก\n\n## จบบทนี้แล้วทำอะไรได้\n\n## เชื่อมกับที่รู้แล้ว\n\n## เนื้อหา\n\n## จุดที่มักพลาด\n\n## วิธีรัน\n\n## ผลที่ควรเห็น\n\n## แบบฝึกหัด\n\n## อ่านเพิ่ม\n' > "lessons/$N-new/README.md"
  pnpm check && pnpm test
  cd - && rm -rf "$(dirname "$TRIAL")"
  ```

  บทใหม่ต้องมี README ครบหัวข้อที่ `pnpm check` บังคับ (8 หัวข้อ ยังไม่ต้องมี `## เปิดดูใน Studio` เพราะเริ่มบท 046) และไม่มีไฟล์รัน จึงไม่ต้องมี `internal/checks/NNN.ts` · ต้องขึ้น `โครงคอร์สถูกต้อง` และ test ผ่านทั้งหมด · ทำ 2 รอบคือเลขที่อยู่กลางช่วงและเลขต้นๆ ที่ข้ามค่าคงที่ทุกตัว
- **ผลหลังมีบท 017–022** (clone ใหม่จาก commit ของ Task 10 · `insert 017` และ `insert 002`): ทั้ง 2 รอบขึ้น `โครงคอร์สถูกต้อง` และ test ผ่าน 407/407 · รอบ `insert 002` เลื่อนค่าคงที่ครบทุกตัว (`SETUP_LESSON`, `ENV_LESSON`, `STUDIO_FROM`, `PROVIDER_PAIRS_FROM`/`TO`) โดยไม่ต้องแก้ test

ห้าม push จนกว่าจะครบเงื่อนไขในเอกสารออกแบบข้อ 5.14 แล้วจึง push `main` และ `solutions` พร้อมกันครั้งเดียว

### กฎชื่อไฟล์ที่รันได้

ไฟล์ที่ผู้เรียนรันได้ต้องตรงรูปแบบ `example` หรือ `exercise-N` ตามด้วย `.ollama` หรือ `.google` (บท 006 ขึ้นไปต้องมีทั้งคู่) เช่น `example.ollama.ts`, `exercise-2.google.ts` · ไฟล์ที่ชื่อขึ้นต้น `example`/`exercise` แต่ไม่ตรงรูปแบบ ทำให้ `pnpm check` ไม่ผ่าน (จะไม่ถูกรัน) · ไฟล์ helper ที่ไม่ใช่ตัวรันให้ตั้งชื่อไม่ขึ้นต้นด้วย `example`/`exercise` เช่น `helpers.ts` (ถูกยกเว้น ไม่ต้องมี check) และไฟล์ `*.test.ts` ถูกยกเว้นเช่นกัน · เลขบทซ้ำทำให้ `pnpm check` และ `pnpm verify` หยุดพร้อมบอกโฟลเดอร์ที่ชน

### แบบฝึกที่ยังไม่เสร็จ

บน `main` ไฟล์ `exercise-*` ที่ยังไม่เติมจะ **พิมพ์ข้อความ 👉 บอกว่ายังต้องเติมอะไร แล้วจบด้วย exit 0** โดยไม่ยิง API (ไม่เสีย token) และเมื่อ `pnpm lesson` เจอ 👉 ในไฟล์จะขึ้นคำเตือน ⚠️ ด้วย ดังนั้นสถานะ "ยังไม่เติม" ไม่ใช่ error เวลาเขียนแบบฝึกใหม่ต้องใส่ guard ตามแบบนี้ และเกณฑ์ใน `internal/checks/` ใช้กับไฟล์บน `solutions` (ที่เติมแล้ว) ไม่ใช่ไฟล์บน `main`

**กฎ guard (ตั้งแต่บท 007):** ทุก `exercise-*.ts` ที่ยังมี `// 👉` ต้องพิมพ์ข้อความ 👉 ภาษาไทยที่บอกว่าต้องเติมอะไร แล้วจบด้วย exit 0 โดยไม่เรียกโมเดลและไม่ยิงเครือข่าย (นับ 👉 เฉพาะที่ขึ้นต้น `// 👉`) · `internal/verify/lesson-guards.test.ts` (รันใน `pnpm test`) รันไฟล์เหล่านั้นทุกไฟล์ในบท 007 ขึ้นไปโดยตั้ง base URL ปลอมและ hook นับ `fetch` แล้วล้มถ้า exit ไม่ใช่ 0, ไม่มี 👉 ในผลที่พิมพ์ หรือมีการเรียกเครือข่าย · ตัวเริ่มคือ `EXERCISE_GUARD_FROM` ใน `scripts/lib/course-rules.ts` (บท 006 ไม่ถูกตรวจ เพราะ `exercise-2` ของ 006 ยิง API ตอนยังไม่เติม)

**บทที่ใช้ `ask()` (แชทบอท):** ใส่ `input` ใน `internal/checks/NNN.ts` เป็นอาร์เรย์ของบรรทัด เช่น `input: ["สวัสดี", "จบ"]` runner จะเขียนทีละบรรทัดลง stdin แล้วปิด stdin · `ask()` คืน `null` เมื่อ input หมด บทจึงต้องจบเองด้วย exit 0 ได้แม้ไม่มี `จบ` (ดู `internal/checks/016.ts` ที่ตั้งใจไม่ใส่ `จบ` ในบางเคส)

## 5. `pnpm check` และ `pnpm verify`

**`pnpm check`** ไม่ใช้ token และรันใน CI: ตรวจโครงบท (ชื่อโฟลเดอร์ 3 หลัก, README 9 หัวข้อ, คู่ไฟล์ `.ollama`/`.google` ของบท 006-027, ไม่มีชื่อโมเดลหรือค่าคล้าย key ในโค้ด ฯลฯ) แล้วตามด้วย `tsc --noEmit` และ `eslint` ต้องผ่านทั้งบน `main` และ `solutions`

**`pnpm verify`** ใช้ token จริง ไม่รันใน CI รันใน worktree ของ `solutions`:

```bash
pnpm verify [NNN | NNN-NNN] --provider <google|ollama-cloud|ollama|opencode-dev> [--repeat N] [--examples-only]
```

- รันทั้งตัวอย่างและเฉลยของบท แล้วตรวจกับ `internal/checks/NNN.ts` (ตรวจโครงของผล ไม่ตรวจถ้อยคำของโมเดล เพราะคำตอบเปลี่ยนทุกครั้ง)
- บทที่ไม่มีไฟล์ให้รัน (เช่น 001, 003, 004, 005) ขึ้น `– ไม่มีไฟล์ให้รัน`
- **จบด้วย exit 1 เมื่อรันได้ 0 รอบ** ทุกกรณี (พิมพ์เลขบทผิดหรือช่วงที่มีแต่บทอ่าน เช่น `003-005`) เพื่อไม่ให้ดูเหมือนผ่าน · `internal/checks/NNN.ts` ที่ import พัง ทำให้บทนั้นล้มเฉพาะบท ไม่ล้มทั้งรอบ
- ท้ายผลพิมพ์ยอด token แยกตาม provider ให้จดไว้เทียบค่าใช้จ่าย

**เกณฑ์ผ่าน (เอกสารออกแบบข้อ 5.10):**

| provider | ต้องผ่าน |
|---|---|
| Google และ Ollama Cloud | ครบ 3 รอบ (`--repeat 3`) ทุกบทที่เรียก LLM เพราะผู้เรียนใช้ API เป็นหลัก |
| Ollama ในเครื่อง | 1 รอบ ในบท 003 และ 006-027 (ผู้เรียนอาจใช้แทน Cloud) |
| Ollama ในเครื่อง บทหลังจากนั้น | รัน 1 รอบเพื่อหาปัญหาเฉพาะในเครื่อง ถ้าไม่ผ่านเพราะโมเดลเล็กเกินไป ให้เขียนไว้ใน README ของบทนั้นโดยไม่ต้องแก้บท |
| บทเรื่องยิงพร้อมกันหรือ 429 (014, 055, 059, 117) | เกณฑ์ตรวจว่า "จำนวนงานพร้อมกันไม่เกิน `maxConcurrency`" ไม่ตรวจว่า "ต้องเจอ 429" |

ถ้าไม่ผ่านให้ดูก่อนว่าผิดที่โค้ดบทหรือที่เกณฑ์ แก้บน `main` แล้ว merge ไป `solutions` ตามหัวข้อ 4

## 6. ก่อนสอนแต่ละรอบ

1. เลือก API หลักของรอบนั้น: Google หรือ Ollama Cloud (เลือกเจ้าที่คุ้มค่าและโควต้าพอสำหรับจำนวนผู้เรียน)
2. อัปเดตชื่อโมเดลใน `.env.example` (และ README บท 003-005) ถ้ารุ่นเดิมถูกถอด
3. รันทั้งคอร์สกับเจ้าที่เลือก ใน worktree ของ `solutions`: `pnpm verify --provider <ที่เลือก> --repeat 3`
4. ถ้าแก้อะไรบน `main` ให้ merge ไป `solutions` ก่อนรอบสุดท้าย แล้วค่อยแจ้งผู้เรียนว่าเฉลยพร้อม
5. ก่อนปล่อย repo ครั้งแรก ทำ checklist 6b ใน [`spikes.md`](./spikes.md) และ [`windows-checklist.md`](./windows-checklist.md) ให้ครบ
