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
- header ที่ opencode บังคับ shim ใส่ให้เอง ผู้เรียนไม่ต้องทำและบทไม่ต้องมีโค้ดส่วนนี้
- `pnpm verify` เปิด shim ให้เองเมื่อใช้ `--provider opencode-dev` และปิดตอนจบ ไม่ต้องรันแยก
- ต้องมี `OPENCODE_API_KEY` และ `OPENCODE_DEV_MODEL` ใน `.env` (ตัวหลังคือชื่อโมเดลที่ opencode ให้ใช้)

```bash
pnpm verify 001-006 --provider opencode-dev --repeat 3
```

ผ่านด้วย `opencode-dev` แปลว่าโครงของบทและเกณฑ์ใน `internal/checks/` ใช้ได้ ไม่ได้แปลว่าผ่านกับ Google หรือ Ollama Cloud ต้องรันตามหัวข้อ 4 ก่อนปล่อยเสมอ

## 3. Branch `solutions` และลำดับการแก้

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
3. ถ้า conflict ในไฟล์ `exercise-*` ให้ **เก็บโค้ดเฉลยไว้** แล้วปรับให้เข้ากับโจทย์ที่เปลี่ยน (ถ้าโจทย์เปลี่ยนต้องอัปเดตเฉลยด้วย)
4. ใน worktree รัน `pnpm check` และ `pnpm verify` ของบทที่แก้ ให้ผ่านก่อนไปต่อ
5. ห้ามแก้ไฟล์นอก `exercise-*` บน `solutions` เพื่อไม่ให้เกิด conflict ซ้ำๆ

ห้าม push จนกว่าจะครบเงื่อนไขในเอกสารออกแบบข้อ 5.14 แล้วจึง push `main` และ `solutions` พร้อมกันครั้งเดียว

### แบบฝึกที่ยังไม่เสร็จ

บน `main` ไฟล์ `exercise-*` ที่ยังไม่เติมจะ **พิมพ์ข้อความ 👉 บอกว่ายังต้องเติมอะไร แล้วจบด้วย exit 0** โดยไม่ยิง API (ไม่เสีย token) และเมื่อ `pnpm lesson` เจอ 👉 ในไฟล์จะขึ้นคำเตือน ⚠️ ด้วย ดังนั้นสถานะ "ยังไม่เติม" ไม่ใช่ error เวลาเขียนแบบฝึกใหม่ต้องใส่ guard ตามแบบนี้ และเกณฑ์ใน `internal/checks/` ใช้กับไฟล์บน `solutions` (ที่เติมแล้ว) ไม่ใช่ไฟล์บน `main`

## 4. `pnpm check` และ `pnpm verify`

**`pnpm check`** ไม่ใช้ token และรันใน CI: ตรวจโครงบท (ชื่อโฟลเดอร์ 3 หลัก, README 9 หัวข้อ, คู่ไฟล์ `.ollama`/`.google` ของบท 006-027, ไม่มีชื่อโมเดลหรือค่าคล้าย key ในโค้ด ฯลฯ) แล้วตามด้วย `tsc --noEmit` และ `eslint` ต้องผ่านทั้งบน `main` และ `solutions`

**`pnpm verify`** ใช้ token จริง ไม่รันใน CI รันใน worktree ของ `solutions`:

```bash
pnpm verify [NNN | NNN-NNN] --provider <google|ollama-cloud|ollama|opencode-dev> [--repeat N] [--examples-only]
```

- รันทั้งตัวอย่างและเฉลยของบท แล้วตรวจกับ `internal/checks/NNN.ts` (ตรวจโครงของผล ไม่ตรวจถ้อยคำของโมเดล เพราะคำตอบเปลี่ยนทุกครั้ง)
- บทที่ไม่มีไฟล์ให้รัน (เช่น 001, 003, 004, 005) ขึ้น `– ไม่มีไฟล์ให้รัน`
- ท้ายผลพิมพ์ยอด token แยกตาม provider ให้จดไว้เทียบค่าใช้จ่าย

**เกณฑ์ผ่าน (เอกสารออกแบบข้อ 5.10):**

| provider | ต้องผ่าน |
|---|---|
| Google และ Ollama Cloud | ครบ 3 รอบ (`--repeat 3`) ทุกบทที่เรียก LLM เพราะผู้เรียนใช้ API เป็นหลัก |
| Ollama ในเครื่อง | 1 รอบ ในบท 003 และ 006-027 (ผู้เรียนอาจใช้แทน Cloud) |
| Ollama ในเครื่อง บทหลังจากนั้น | รัน 1 รอบเพื่อหาปัญหาเฉพาะในเครื่อง ถ้าไม่ผ่านเพราะโมเดลเล็กเกินไป ให้เขียนไว้ใน README ของบทนั้นโดยไม่ต้องแก้บท |
| บทเรื่องยิงพร้อมกันหรือ 429 (014, 055, 059, 117) | เกณฑ์ตรวจว่า "จำนวนงานพร้อมกันไม่เกิน `maxConcurrency`" ไม่ตรวจว่า "ต้องเจอ 429" |

ถ้าไม่ผ่านให้ดูก่อนว่าผิดที่โค้ดบทหรือที่เกณฑ์ แก้บน `main` แล้ว merge ไป `solutions` ตามหัวข้อ 3

## 5. ก่อนสอนแต่ละรอบ

1. เลือก API หลักของรอบนั้น: Google หรือ Ollama Cloud (เลือกเจ้าที่คุ้มค่าและโควต้าพอสำหรับจำนวนผู้เรียน)
2. อัปเดตชื่อโมเดลใน `.env.example` (และ README บท 003-005) ถ้ารุ่นเดิมถูกถอด
3. รันทั้งคอร์สกับเจ้าที่เลือก ใน worktree ของ `solutions`: `pnpm verify --provider <ที่เลือก> --repeat 3`
4. ถ้าแก้อะไรบน `main` ให้ merge ไป `solutions` ก่อนรอบสุดท้าย แล้วค่อยแจ้งผู้เรียนว่าเฉลยพร้อม
5. ก่อนปล่อย repo ครั้งแรก ทำ checklist 6b ใน [`spikes.md`](./spikes.md) และ [`windows-checklist.md`](./windows-checklist.md) ให้ครบ
