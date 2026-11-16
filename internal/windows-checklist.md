# รายการทดสอบบน Windows (ผู้สอนหรือผู้ช่วยเป็นคนรัน)

ผู้สร้างคอร์สทดสอบบน macOS เท่านั้น ไฟล์นี้คือขั้นตอนให้คนที่มีเครื่อง Windows รันทีละข้อ แล้วจดผลในตารางท้ายไฟล์ · ทุกคำสั่งพิมพ์ใน **Windows PowerShell** (5.1 หรือ 7) · ถ้าผลไม่ตรงกับ "ควรเห็น" ให้ถ่ายรูปหน้าจอหรือคัดลอกข้อความทั้งหมดส่งให้ผู้สร้าง (ลบค่า key ออกก่อน)

ข้อ 1–6 ทดสอบได้ตั้งแต่จบแผนที่ 1 · ข้อในหัวข้อ "ทดสอบเมื่อถึงแผนที่ N" รอให้แผนนั้นสร้างเสร็จก่อน · รอบสุดท้ายรันทั้งไฟล์ในแผนที่ 22 ก่อนปล่อย repo

> **ข้อที่ต้องใช้ชื่อโมเดลรอค่าจากข้อ 6b-7 ของ `internal/spikes.md` ก่อน:** ตอนนี้ `OLLAMA_MODEL`, `GOOGLE_MODEL` และ `OLLAMA_NUM_CTX` ใน `.env.example` ยังเป็น `CHANGE_ME` · ข้อที่เรียกโมเดลจริงจึงรันได้หลัง 6b-7 ใส่ค่าที่เลือกแล้วเท่านั้น ได้แก่ แถว ✅ ของ Google/Ollama ในข้อ 3, `pnpm lesson 006 example.google` ในข้อ 4 และทุกข้อในหัวข้อ "ทดสอบเมื่อถึงแผนที่ N" ที่ส่งข้อความหาโมเดล (Studio แผนที่ 6, บท 073 แผนที่ 9, บท 127 แผนที่ 16, บทเว็บแผนที่ 19) · ข้อที่ไม่เรียกโมเดล (UTF-8, `pnpm install`, แถว ❌ ของ preflight, `pnpm lesson 002`, Notepad `.env`) รันได้เลย

## ก่อนเริ่ม

- Windows 10 หรือ 11 · จดรุ่นจาก `winver`
- ติดตั้ง Node 24 (LTS) จาก nodejs.org, Git และ VS Code
- เปิด **Windows Terminal** (แท็บ PowerShell) เป็นหลัก · บางข้อให้ลองใน **terminal ของ VS Code** และหน้าต่าง PowerShell แบบเก่า (เปิดจาก Start → "Windows PowerShell") ด้วย

```powershell
node -v
corepack enable
pnpm -v
```

ควรเห็น: `node -v` เป็น `v24.` ตามด้วยเลขใดๆ · `pnpm -v` เป็นเลขที่ขึ้นต้นด้วย `12.` (ในโฟลเดอร์ repo ต้องเป็น `12.21.0` ตาม `packageManager`)

ถ้า `pnpm` ขึ้น error เรื่อง "running scripts is disabled on this system" ให้รัน แล้วเปิด terminal ใหม่:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 1. ตั้ง UTF-8 แล้วพิมพ์และแสดงภาษาไทยได้

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
node -e "console.log('ทดสอบภาษาไทย: สวัสดี น้ำ ทำ กำลัง ผู้ใหญ่')"
```

ควรเห็น: `ทดสอบภาษาไทย: สวัสดี น้ำ ทำ กำลัง ผู้ใหญ่` ตรงทุกตัว · ไม่มี `?`, `�` หรือกล่องสี่เหลี่ยม · สระและวรรณยุกต์อยู่ตำแหน่งถูก (ไม่ลอยแยกจากพยัญชนะ)

- [ ] Windows Terminal
- [ ] terminal ของ VS Code
- [ ] หน้าต่าง PowerShell แบบเก่า (ถ้าเป็นกล่องสี่เหลี่ยมแต่คัดลอกไปวางที่อื่นแล้วอ่านได้ = ปัญหาฟอนต์ ไม่ใช่ encoding ให้จดไว้)
- [ ] ปิด terminal แล้วเปิดใหม่ รันบรรทัด `node -e` อย่างเดียว (ไม่ตั้ง 3 บรรทัดแรก) · จดว่ายังแสดงถูกไหม
- [ ] ตั้งถาวร: `notepad $PROFILE` (ถ้าไม่มีไฟล์ ให้ตอบ Yes เพื่อสร้าง) ใส่ 3 บรรทัดแรกแล้วบันทึก · เปิด terminal ใหม่แล้วรัน `node -e` อีกครั้ง → ควรเห็นภาษาไทยถูก · ถ้าเปิด terminal แล้วขึ้น error เรื่อง script ให้ทำข้อ Execution Policy ด้านบน
- [ ] จดผลของ `chcp` (เลข code page) ก่อนและหลังตั้งค่า

## 2. `pnpm install`

```powershell
git clone <ที่อยู่ repo>
cd DN_LANGGRAPH
pnpm install
```

ควรเห็น:
- จบด้วย `Done in …` ไม่มีบรรทัด `ERR_PNPM_…`
- **ไม่มีข้อความ `Ignored build scripts`** (repo ตั้ง `allowBuilds` ไว้ใน `pnpm-workspace.yaml` แล้ว)
- ไม่ต้องติดตั้ง Visual Studio Build Tools หรือ Python เพิ่ม

จดเวลาที่ใช้ และถ้ามีบรรทัด `WARN` ให้คัดลอกมาทั้งหมด

## 3. `.env` และ `pnpm preflight`

```powershell
Copy-Item .env.example .env
pnpm preflight
```

ควรเห็น (ยังไม่ได้ใส่ key ใดๆ):

```
✅ Node v24.…
✅ pnpm 12
✅ .env
❌ Google Gemini — ยังไม่ได้ตั้ง GOOGLE_API_KEY ในไฟล์ .env (ดูบท 005)
❌ Ollama — … (ดูบท 003)
ยังมี 2 เรื่องต้องแก้
```

- [ ] ไม่มี stack trace ภาษาอังกฤษ · ภาษาไทยและ emoji ✅ ❌ แสดงถูก
- [ ] ใส่ `GOOGLE_API_KEY` และ `GOOGLE_MODEL` ที่ใช้ได้ (ทำตามบท 005) แล้วรันใหม่ → แถว Google เป็น `✅ Google Gemini (<ชื่อโมเดล>)`
- [ ] ถ้ามี Ollama บนเครื่อง Windows ให้ทำบท 003 แล้วรันใหม่ → แถว Ollama เป็น ✅ · ถ้าไม่มี ให้ทำบท 004 (Ollama Cloud) แทน
- [ ] พิมพ์ key ผิดโดยตั้งใจ 1 ตัว แล้วรันใหม่ → ขึ้น ❌ พร้อมเลขบท โปรแกรมไม่พัง และ**ไม่มีค่า key โผล่บนหน้าจอ** · แก้กลับให้ถูก

## 4. `pnpm lesson 002` และ `pnpm lesson 006 example.google`

```powershell
pnpm lesson 002
```

ควรเห็น:
- `สวัสดีจาก DN_LANGGRAPH`
- `Node v24.…`
- 5 บรรทัดของ `OLLAMA_BASE_URL`, `OLLAMA_API_KEY`, `OLLAMA_MODEL`, `GOOGLE_API_KEY`, `GOOGLE_MODEL` แต่ละบรรทัดเป็น `ตั้งแล้ว`, `ยังไม่ได้ตั้ง` หรือ `ค่าไม่ถูกต้อง` · **ไม่มีค่า key จริง**

```powershell
pnpm lesson 006 example.google
pnpm lesson 6 example.google.ts
```

ควรเห็น (ทั้ง 2 คำสั่งได้ผลแบบเดียวกัน):
- URL ที่ลงท้ายด้วย `:generateContent`
- headers ที่ค่า key เป็น `***`
- body เป็น JSON หลายบรรทัด
- บรรทัด `คำตอบ: …` ตามด้วยภาษาไทยที่อ่านได้

- [ ] `pnpm lesson 006 exercise-1.google` → ขึ้นคำเตือน `ยังมี 👉 อีก N จุด` ก่อนรัน และ 👉 แสดงเป็นรูปนิ้ว
- [ ] `pnpm lesson 006` (ไม่ใส่ชื่อไฟล์) → บอกรายชื่อไฟล์ให้เลือก
- [ ] `pnpm lesson 999` → `ไม่พบบท 999 ในโฟลเดอร์ lessons/`

## 5. `.env` ที่บันทึกจาก Notepad

ทำทีละแบบ แล้วรัน `pnpm preflight` และ `pnpm lesson 006 example.google` หลังบันทึกทุกครั้ง:

- [ ] **ก. Notepad → File → Save As → Encoding: `UTF-8`** (ไม่มี BOM) → ควรเห็น `✅ .env` และบท 006 ได้คำตอบ
- [ ] **ข. Encoding: `UTF-8 with BOM`** → ควรเห็น `❌ .env — ไฟล์มี BOM นำหน้า: บันทึกใหม่เป็น UTF-8 แบบไม่มี BOM (ดูบท 002)` · จากนั้นบันทึกกลับเป็น `UTF-8` แล้ว preflight ต้องกลับเป็น ✅
- [ ] **ค.** เปิด `.env` ใน Notepad เพิ่มคอมเมนต์ภาษาไทย 1 บรรทัด (`# ทดสอบภาษาไทย`) แล้วบันทึกแบบ `UTF-8` → ค่าทุกตัวยังอ่านได้ (บท 002 ยังเป็น `ตั้งแล้ว`)
- [ ] **ง.** ดูมุมขวาล่างของ Notepad ว่าเป็น `Windows (CRLF)` → ค่าต้องอ่านได้ถูก ไม่มีตัวอักษรเกินท้ายชื่อโมเดล (ถ้าชื่อโมเดลมี `\r` ติดมา บท 006 จะได้ error 404 จาก Google)
- [ ] **จ.** เปลี่ยนชื่อ `.env` ชั่วคราวเป็น `.env.bak` แล้วรัน `pnpm lesson 002` → ยังรันได้ ตัวแปรเป็น `ยังไม่ได้ตั้ง` · อาจมีบรรทัดภาษาอังกฤษ `.env not found. Continuing without it.` จาก Node (ไม่ใช่ error) · เปลี่ยนชื่อกลับ

## 6. ข้อมูลเครื่องที่ทดสอบ

- [ ] รุ่น Windows (`winver`), สถาปัตยกรรม (x64 หรือ ARM64)
- [ ] `node -v`, `pnpm -v`, `git --version`
- [ ] path ของ repo มีช่องว่างหรือภาษาไทยไหม (เช่น `C:\Users\ชื่อ นามสกุล\...`) · ถ้าเป็นไปได้ให้ลองข้อ 2–4 ซ้ำใน path ที่มีช่องว่าง

---

## ทดสอบเมื่อถึงแผนที่ 2: `ask()` รับภาษาไทยจาก terminal

- [ ] หลังตั้ง UTF-8 ตามข้อ 1 รันบทที่ใช้ `ask()` ด้วย `pnpm lesson 016 example.google` (หรือ `pnpm lesson 016 example.ollama` ถ้ามี Ollama) พิมพ์ `สวัสดีครับ ขอน้ำเปล่า 2 ขวด` แล้วกด Enter
- ควรเห็น: ข้อความที่โปรแกรมพิมพ์กลับตรงกับที่พิมพ์ทุกตัว · ไม่มี `?` · สระอำและวรรณยุกต์ถูก
- [ ] กด Backspace ลบสระหรือวรรณยุกต์ระหว่างพิมพ์ แล้วดูว่าข้อความที่ได้ตรงกับที่เห็นบนจอ
- [ ] ทำซ้ำใน Windows Terminal, terminal ของ VS Code และหน้าต่าง PowerShell แบบเก่า
- [ ] ทำซ้ำโดยไม่ตั้ง `[Console]::InputEncoding` เพื่อดูว่าจำเป็นไหม · จดผล
- [ ] กด Ctrl+C ระหว่างรอพิมพ์ → โปรแกรมจบเรียบร้อย ไม่ค้าง
- [ ] ออกจากแชทบอทบท 016 (`pnpm lesson 016 example.ollama` หรือ `example.google`) ด้วยทุกวิธี แล้วดูว่าจบเอง พิมพ์ `ลาก่อนครับ` และ `จำนวนข้อความในประวัติ: N` (Ctrl+C ไม่พิมพ์บรรทัดเหล่านี้ ถือว่าปกติ) · เปิดโปรแกรมใหม่ทุกครั้ง:
  - พิมพ์ `จบ` แล้ว Enter → จบ
  - กด **Ctrl+D** → ไม่จบ (PowerShell ไม่ถือว่าเป็นสัญญาณจบ input) จดว่าเกิดอะไรขึ้น แล้วกด Ctrl+C
  - กด **Ctrl+Z แล้ว Enter** → จบโปรแกรมด้วย `ลาก่อนครับ` (ต้องเห็นข้อความนี้)
  - ทำซ้ำทั้ง 3 ข้อใน Windows Terminal, terminal ของ VS Code และหน้าต่าง PowerShell แบบเก่า
- [ ] pipe ข้อความไทยเข้าแชทบอท: `"สวัสดี ฉันชื่อสมชาย", "จบ" | pnpm lesson 016 example.ollama` ใน Windows PowerShell 5.1 และใน PowerShell 7 · จดว่าข้อความไทยที่โปรแกรมพิมพ์ย้อนกลับ (`คุณ: ...`) เพี้ยนไหม (README บท 016 บอกว่า 5.1 อาจเพี้ยนตาม `$OutputEncoding` ส่วนการพิมพ์เองไม่เพี้ยน) · ลองตั้ง `$OutputEncoding = [System.Text.Encoding]::UTF8` ก่อนแล้วเทียบผล

## ทดสอบเมื่อถึงแผนที่ 3: error ของ zod เป็นภาษาไทย

- [ ] `pnpm lesson 020 example.google` (หรือ `pnpm lesson 020 example.ollama` ถ้ามี Ollama) → ขั้นที่ 1 ขึ้น `✖` พร้อม `→ at maxPrice` และ `→ at keyword` ของ error zod · ภาษาไทยไม่เพี้ยน (ไม่มี `?` หรือกล่องสี่เหลี่ยม) ไม่มี stack trace ภาษาอังกฤษหลุดมา

## ทดสอบเมื่อถึงแผนที่ 6: `pnpm studio NNN`

- [ ] `pnpm studio 046` → server เปิด และพิมพ์ลิงก์ Studio
- [ ] เปิดลิงก์ใน Edge หรือ Chrome → ถ้าเบราว์เซอร์ถามเรื่องการเข้าถึงอุปกรณ์/เครือข่ายในเครื่อง ให้กดอนุญาต → เห็น graph ของบท
- [ ] ส่งข้อความใน Studio แล้วได้คำตอบ
- [ ] Ctrl+C แล้วรัน `Get-Process node -ErrorAction SilentlyContinue` → ไม่มี process ของ server ค้าง
- [ ] `git status` → ไม่มีไฟล์ใหม่นอก `.langgraph/` (เช่น `.gitignore` หรือ `.langgraph_api/` ในโฟลเดอร์บท)

## ทดสอบเมื่อถึงแผนที่ 9: better-sqlite3

- [ ] `pnpm install` หลังเพิ่ม `@langchain/langgraph-checkpoint-sqlite` → ไม่มี `Ignored build scripts` และไม่มีการ compile ด้วย node-gyp (ใช้ไฟล์ prebuilt ของ win32 ที่มีให้แล้วใน better-sqlite3 12.11.1 สำหรับ Node 24)
- [ ] `pnpm lesson 073` 2 ครั้งติดกัน → ครั้งที่สองจำบทสนทนาครั้งแรกได้
- [ ] ถ้าเปลี่ยนรุ่น Node หลังติดตั้งแล้วเจอ `NODE_MODULE_VERSION` ให้รัน `pnpm rebuild better-sqlite3` → หาย · จดว่าเจอไหม
- [ ] ไฟล์ฐานข้อมูลที่เกิดขึ้นอยู่ใน gitignore (`git status` ไม่เห็น)

## ทดสอบเมื่อถึงแผนที่ 16: MCP แบบ stdio

- [ ] รันบท 127 → client เปิด MCP server ของร้านด้วย `process.execPath` + `--import tsx` สำเร็จ ได้รายชื่อ tool และผลจาก tool เป็นภาษาไทยไม่เพี้ยน
- [ ] ทดสอบใน path ที่มีช่องว่าง (ข้อ 6)
- [ ] หลังโปรแกรมจบ `Get-Process node -ErrorAction SilentlyContinue` ไม่มี process ของ MCP server ค้าง

## ทดสอบเมื่อถึงแผนที่ 19: บทเว็บ

- [ ] `pnpm web` → เปิด `http://localhost:3200` ได้ หน้าแรกเป็นสารบัญบทเว็บ
- [ ] บท 141: เปิด Agent Chat UI บนเว็บต่อ `http://localhost:2024` ใน Edge และ Chrome · กดอนุญาตเมื่อถามเรื่องเครือข่ายในเครื่อง · ส่งข้อความภาษาไทยแล้วได้คำตอบ
- [ ] บท 142–145 คู่กับ `pnpm studio NNN` → ส่งข้อความแล้วเห็นคำตอบ stream ทีละส่วน
- [ ] `pnpm db:up` / `pnpm db:down` กับ Docker Desktop

## ตารางผล

| วันที่ | ผู้ทดสอบ | Windows / สถาปัตยกรรม | terminal | ข้อ | ผล (ผ่าน/ไม่ผ่าน) | หมายเหตุ |
|---|---|---|---|---|---|---|
| | | | | | | |
