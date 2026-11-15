# บท 002: เตรียมเครื่องและโปรเจกต์

บทนี้ติดตั้งเครื่องมือ ดึงโปรเจกต์มาลง และเรียนรู้วิธีรันบทต่างๆ ตลอดคอร์ส ใช้เวลาประมาณ 30-45 นาที (ขึ้นกับความเร็วอินเทอร์เน็ต) บทนี้ไม่เรียก LLM

## จบบทนี้แล้วทำอะไรได้

- ติดตั้ง Node 24, pnpm 12, Git และ VS Code ครบ
- ดึงโปรเจกต์มาลงเครื่องและติดตั้ง dependency ได้
- สร้างไฟล์ `.env` จาก `.env.example`
- รันบทด้วย `pnpm lesson NNN` และตรวจเครื่องด้วย `pnpm preflight`
- ตั้ง terminal บน Windows ให้พิมพ์และแสดงภาษาไทยได้
- รู้ว่าเครื่องหมาย 👉 ในไฟล์แบบฝึกหัดหมายถึงอะไร

## เชื่อมกับที่รู้แล้ว

คุณคงเคย `git clone`, `npm install` และใช้ไฟล์ `.env` มาแล้ว บทนี้ก็คือชุดเดียวกัน แต่ใช้ `pnpm` แทน `npm` และมีสคริปต์ช่วยของคอร์สอีก 2 ตัว:

| คำสั่ง | ทำอะไร |
|---|---|
| `pnpm lesson NNN` | รันไฟล์ตัวอย่างของบท NNN (`pnpm lesson 2` ก็ได้ ไม่ต้องใส่ศูนย์) |
| `pnpm lesson NNN ชื่อไฟล์` | รันไฟล์อื่นในบท เช่น `pnpm lesson 002 exercise-1` |
| `pnpm preflight` | ตรวจว่า Node, pnpm, `.env`, Google และ Ollama พร้อมใช้ |

## เนื้อหา

### 1. ติดตั้งเครื่องมือ

| เครื่องมือ | เวอร์ชัน | ที่ติดตั้ง |
|---|---|---|
| Node.js | 24 ขึ้นไป | [nodejs.org](https://nodejs.org) (เลือกรุ่น LTS ที่เป็น 24 ขึ้นไป) |
| pnpm | 12 | ดูข้อ 3 |
| Git | ล่าสุด | [git-scm.com](https://git-scm.com) |
| VS Code | ล่าสุด | [code.visualstudio.com](https://code.visualstudio.com) |

ติดตั้ง Node, Git และ VS Code แล้ว **เปิด terminal ใหม่** (macOS ใช้ Terminal, Windows ใช้ Windows Terminal แท็บ PowerShell) ตรวจ Node:

```bash
node -v
```

ต้องขึ้นต้นด้วย `v24.` หรือสูงกว่า ส่วน pnpm ให้ทำหลังข้อ 2 (Windows) และข้อ 3

### 2. Windows PowerShell: แก้ Execution Policy (ทำก่อนใช้ pnpm)

ถ้าใช้ Windows ให้ทำข้อนี้ **ก่อน** รันคำสั่ง `corepack` หรือ `pnpm` ครั้งแรก มิฉะนั้นจะเจอ error ว่า `running scripts is disabled on this system` เพราะ Windows ห้ามรันสคริปต์ รันคำสั่งนี้ครั้งเดียว แล้วปิดและเปิด terminal ใหม่:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

(ถ้าถามยืนยัน ให้พิมพ์ `Y`) คำสั่งนี้เปลี่ยนเฉพาะผู้ใช้ของคุณ ไม่ต้องเปิดสิทธิ์ Administrator ผู้ใช้ macOS ข้ามข้อนี้ได้

### 3. ดึงโปรเจกต์และติดตั้ง

ผู้สอนจะให้ลิงก์ของโปรเจกต์ (ลิงก์ GitHub) ให้แทนที่ `ลิงก์ที่ผู้สอนให้` ด้านล่างด้วยลิงก์นั้นทั้งก้อน (ไม่ต้องเก็บเครื่องหมายใดๆ ไว้):

```bash
git clone ลิงก์ที่ผู้สอนให้ dn-langgraph
cd dn-langgraph
corepack enable
pnpm -v
pnpm install
```

คำสั่งทั้งหมดเหมือนกันทั้ง macOS และ PowerShell

- `pnpm -v` ต้องทำ **หลัง** `cd dn-langgraph` เพราะ corepack เลือกเวอร์ชัน pnpm ตามที่โปรเจกต์กำหนดไว้ (ควรขึ้นต้นด้วย `12.`) ถ้าเรียกนอกโฟลเดอร์โปรเจกต์ อาจได้เลขเวอร์ชันอื่น ซึ่งไม่ใช่ปัญหา
- ถ้า `corepack enable` ขึ้น error เรื่องสิทธิ์ (`EPERM` หรือ permission denied) ให้ใช้ทางใดทางหนึ่ง: macOS ลอง `sudo corepack enable` · Windows เปิด Windows Terminal แบบ Run as administrator แล้วรัน `corepack enable` อีกครั้ง หรือข้ามไปติดตั้ง pnpm ตรงๆ ด้วย `npm i -g pnpm@12` (ยังไม่ได้ทดสอบบน Windows จริง)
- เมื่อ clone เสร็จ เปิดโปรเจกต์ใน VS Code ด้วย `code .` (รันในโฟลเดอร์โปรเจกต์) หรือเปิดจากเมนู File → Open Folder

### 4. สร้างไฟล์ `.env`

ไฟล์ `.env` เก็บค่าลับ (เช่น API key) ของเครื่องคุณ ไม่ถูก commit เพราะอยู่ใน `.gitignore` คัดลอกจากไฟล์ตัวอย่าง:

macOS:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

ตอนนี้ยังไม่ต้องแก้อะไรใน `.env` เราจะใส่ค่าในบท 003-005

### 5. รันบทแรก

```bash
pnpm lesson 002
```

ถ้าเห็นข้อความภาษาอังกฤษ `.env not found. Continuing without it.` แปลว่ายังไม่มีไฟล์ `.env` (ข้อ 4) ข้อความนี้เป็นแค่การแจ้งเตือนจาก Node ไม่ใช่ error

### 6. ตรวจเครื่องด้วย `pnpm preflight`

```bash
pnpm preflight
```

ตอนนี้ **มี ❌ ได้** เพราะเรายังไม่ได้ตั้งค่า Google และ Ollama ซึ่งทำในบท 003-005 แต่ 3 แถวแรก (Node, pnpm, `.env`) ควรเป็น ✅ ทุกบรรทัดที่ ❌ จะบอกว่าต้องไปดูบทไหน

### 7. Windows: ตั้ง UTF-8 ให้ภาษาไทยแสดงถูก

ถ้าใช้ Windows และเห็นภาษาไทยเป็น `?` หรือกล่องสี่เหลี่ยม ให้ตั้ง encoding ของ PowerShell:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

คำสั่งนี้มีผลเฉพาะหน้าต่างที่เปิดอยู่ ถ้าอยากให้ตั้งทุกครั้งที่เปิด PowerShell ให้เพิ่มลงใน profile:

```powershell
if (!(Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }
notepad $PROFILE
```

ใน Notepad ที่เปิดขึ้นมา เพิ่ม 2 บรรทัดนี้ที่ท้ายไฟล์ แล้วบันทึก:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
```

เปิด terminal ใหม่แล้วทดสอบ:

```powershell
node -e "console.log('ทดสอบภาษาไทย: สวัสดี น้ำ ทำ กำลัง ผู้ใหญ่')"
```

ต้องเห็นข้อความตรงทุกตัว สระและวรรณยุกต์อยู่ติดพยัญชนะ ถ้าเห็นเป็นกล่องสี่เหลี่ยมแต่คัดลอกไปวางที่อื่นแล้วอ่านออก แปลว่าเป็นปัญหาฟอนต์ของหน้าต่าง ไม่ใช่ encoding ลองใช้ Windows Terminal หรือ terminal ใน VS Code แทน

### 8. เครื่องหมาย 👉

ไฟล์ `exercise-N.ts` ที่มีโค้ดให้คุณแก้ จะมีบรรทัดที่ขึ้นต้นด้วย 👉 กำกับไว้ พร้อมค่าชั่วคราวที่ทำให้ไฟล์รันได้ตั้งแต่ยังไม่ได้แก้ (แต่ผลจะยังไม่ถูก) ตอนรันถ้าไฟล์ยังมี 👉 อยู่ จะเห็นคำเตือน:

```
⚠️  ไฟล์นี้ยังมี 👉 อีก N จุด ผลที่ได้อาจยังไม่ครบ
```

ลบ 👉 ออกเมื่อแก้จุดนั้นเสร็จ คำเตือนจะหายเมื่อไม่เหลือ 👉

### 9. เปิดอ่าน `src/lib/env.ts`

ทุกบทอ่านค่าจาก `.env` ผ่านไฟล์นี้ เปิดใน VS Code (ด้วย `code .` ตามข้อ 3) แล้วอ่านคร่าวๆ มี 2 ฟังก์ชันที่ใช้ในบทนี้:

- `optionalEnv("ชื่อ")` คืนค่า หรือ `undefined` ถ้ายังไม่ตั้ง (ไม่ error)
- `env("ชื่อ")` คืนค่า หรือ error ที่บอกเลขบทที่ต้องไปตั้งค่า

สองฟังก์ชันนี้ตัดช่องว่างหัวท้ายและตรวจรูปแบบให้ด้วย เช่น `OLLAMA_BASE_URL` ต้องขึ้นต้นด้วย `http://` หรือ `https://`

## จุดที่มักพลาด

- **บันทึก `.env` ด้วย Notepad แล้วมี BOM:** ถ้าเลือก Encoding เป็น `UTF-8 with BOM` Notepad จะใส่อักขระล่องหนที่หัวไฟล์ ทำให้ชื่อตัวแปรบรรทัดแรกเพี้ยน ตอนบันทึกใน Notepad ให้เลือก File → Save As → Encoding: `UTF-8` ถ้าเห็นตัวเลือก `UTF-8 with BOM` อย่าเลือก (Notepad รุ่นเก่ามากอาจเรียก UTF-8 ที่มี BOM ว่า `UTF-8` เฉยๆ) `pnpm preflight` จะเตือนถ้าเจอ BOM วิธีที่ง่ายกว่าคือแก้ `.env` ใน VS Code
- **ลืมเปิด terminal ใหม่หลังติดตั้ง:** `node` หรือ `pnpm` จะยังไม่พบคำสั่ง ให้ปิดแล้วเปิด terminal ใหม่
- **คัดลอก `.env.example` ทับ `.env` เดิม:** จะทำให้ค่าที่ใส่ไว้หาย ทำคำสั่งในข้อ 4 แค่ครั้งเดียว
- **ใส่ค่าใน `.env.example`:** ไฟล์นี้ถูก commit ได้ ห้ามใส่ key จริง ใส่ใน `.env` เท่านั้น
- **ใส่เครื่องหมายคำพูดหรือเว้นวรรคแปลกๆ ในค่า:** เขียนแบบ `GOOGLE_MODEL=ชื่อโมเดล` ไม่ต้องมี `"`

## วิธีรัน

```bash
pnpm lesson 002
pnpm lesson 002 exercise-1
pnpm lesson 002 exercise-2
pnpm preflight
```

คำสั่งเหมือนกันทั้ง macOS และ PowerShell ตัวเลขบทใส่ `2` หรือ `002` ก็ได้

## ผลที่ควรเห็น

`pnpm lesson 002` พิมพ์ 7 บรรทัด (เลขเวอร์ชัน Node จะเป็นของเครื่องคุณ และสถานะแต่ละตัวแปรขึ้นกับว่าตั้งค่าไว้หรือยัง):

```
สวัสดีจาก DN_LANGGRAPH
Node v24.x.x
OLLAMA_BASE_URL: ตั้งแล้ว
OLLAMA_API_KEY: ยังไม่ได้ตั้ง
OLLAMA_MODEL: ตั้งแล้ว
GOOGLE_API_KEY: ยังไม่ได้ตั้ง
GOOGLE_MODEL: ตั้งแล้ว
```

- แต่ละตัวแปรเป็นหนึ่งใน `ตั้งแล้ว`, `ยังไม่ได้ตั้ง` หรือ `ค่าไม่ถูกต้อง` (ตั้งไว้แต่รูปแบบผิด) โปรแกรม **ไม่พิมพ์ค่าจริง** ออกมาเด็ดขาด
- ถ้ายังไม่ได้ทำบท 003-005 เกือบทุกบรรทัดจะเป็น `ยังไม่ได้ตั้ง` ซึ่งปกติ
- `pnpm preflight`: 3 แถวแรกเป็น ✅ ส่วน Google และ Ollama ยังเป็น ❌ ได้ จะเป็น ✅ หลังทำบท 003-005

## แบบฝึกหัด

1. **`exercise-1.ts`:** หาบรรทัดที่มี 👉 แก้ `"ชื่อของคุณ"` เป็นชื่อของคุณ แล้วรัน `pnpm lesson 002 exercise-1` ต้องเห็น `สวัสดี <ชื่อคุณ>` และคำเตือน ⚠️ ต้องหายไปเมื่อลบ 👉 ออก
2. **`exercise-2.ts`:** อ่านโจทย์ในไฟล์ แล้วลองลบค่าของ `GOOGLE_MODEL` ใน `.env` ชั่วคราว รันใหม่ ดูว่าข้อความ error บอกให้ไปดูบทไหน (หลังทำบท 005 ต้องเห็น `บท 005`) แล้วใส่ค่ากลับ

## อ่านเพิ่ม

- [Node.js: ตัวเลือก `--env-file`](https://nodejs.org/api/cli.html#--env-fileconfig)
- [pnpm: Installation](https://pnpm.io/installation)
- [ปุ่มลัดและการใช้ terminal ใน VS Code](https://code.visualstudio.com/docs/terminal/basics)
