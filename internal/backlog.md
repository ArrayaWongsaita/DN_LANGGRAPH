# งานที่เลื่อนไปแผนหลัง (จากการรีวิวท้ายแผน 1)

รายการเล็กๆ ที่ยังไม่ทำ ใส่เลขแผนที่ต้องทำไว้ท้ายบรรทัด

แผน 2 ปิดแล้ว: ตรวจเลขบทซ้ำ กฎชื่อไฟล์รันได้ และ test guard ของแบบฝึก `97fbd21` · verify จับ checks ที่พังทีละบทและ exit 1 เมื่อรัน 0 รอบ `fdd83a1` · `pnpm renumber` `cec7057` + `3a825e3`

แผน 3 ปิดแล้ว: fence ใน README, test ทนต่อ renumber และ checks-keys `9ee4a5a` · comment ของ guard แก้แล้วใน `c5b9846`

## แผน 4

- ทางหนีของกฎ `pnpm lesson MMM` สำหรับบทที่ตั้งใจอ้างบทอื่น: ตัดสินจากบท 023–028 ถ้ายังไม่มีกรณีจริงให้เลื่อนต่อพร้อมเหตุผล (แผน 4)
- แยก `lesson-guards.test.ts` เป็นรายบท (`it.each` + timeout รายบท + `os.availableParallelism()`) ก่อนช่วงที่ 5 หรือก่อน CI Windows ครั้งแรก (แผน 4)

## แผน 22 (release gate) หรือทำเมื่อสะดวก

- เพิ่ม Node 26 ใน CI matrix และเลิกเขียนว่า "Node 24 (LTS)" ใน `.github/workflows/ci.yml`, `internal/windows-checklist.md` ตรวจเวอร์ชัน `actions/*` อีกครั้ง (แผน 22)
- `scripts/lesson.ts` กับ `internal/verify/runner.ts` ซ้ำ argv ของ child process ควรดึงเป็น `lessonChildArgs` (แผน 22)
- ย้ายบรรทัด `OPENCODE_*` ของผู้สอนออกจาก `.env.example` ไปไว้ใน `internal/README.md` อย่างเดียว (แผน 22)
- ตรวจสระอำ (sara am) ใน `.env.example` และ `package.json` ที่ปัจจุบันถูกข้าม (แผน 22)
- เพิ่ม `expectBlock` ใน `internal/verify/expect.ts` ตรวจบล็อก "ต้องตรงทุกตัว" ใน README อัตโนมัติ (แผน 22)
- test ที่ยังขาด: ทางแยก `child.error` ของ runner, SIGTERM-only timeout, บัฟเฟอร์ไม่จำกัด, parse argv (แผน 22)
- แผน 4: ข้อความท้าย renumber ยังบอกให้แก้ *.test.ts เอง · test ของกฎ fence ใน README ไม่ครอบคลุม indented fence/closer มีข้อความต่อท้าย · เลขบทในคอลัมน์ที่ 2 ของตาราง "สิ่งที่ต้องมี" ใน README (เช่น `| … | 003 | ฟรี |`) ไม่ถูกเลื่อนเวลา renumber (เห็นตอนทดลอง `insert 002`)

## Later (จากการรีวิวแผน 3)

- บท 019: ไฟล์บท 6 ไฟล์ตัดข้อความที่ 40 ตัวอักษรโดยไม่มี `…` ต่อท้ายตามที่กฎกำหนด แก้เมื่อกลับมาแตะบท 019 (แตะ `exercise-*` จึงต้อง merge ไป `solutions` แล้วรัน verify ใหม่)
- บท 018: `internal/checks/018.ts` ยังฮาร์ดโค้ด 24 / 26 / `จาก 24` ให้คำนวณจาก `listProducts().length` · `expectPrice`/stock ใช้ `includes` ตรงๆ (`1,380` ผ่านเพราะเจอ `380`, `150` ผ่านเพราะเจอ `15`) ต้องเทียบแบบมีขอบเขต
- บท 017: ตัวจับ marker รับ `[ขอบเขต]` / `[ตอบ]` (ความหมายตรงข้าม) ด้วย ให้บังคับ `นอกขอบเขต`/`ไม่ตอบ` โดยคงความทนต่อ typo ที่เจอจริง
- checks 017–022: `expectNoLeak` ไม่ถูกใช้กับเนื้อคำตอบ (`ราคา undefined 380 บาท` ผ่านได้) · helper ต่อไฟล์ (`expectAnswer`, `expectNoLeak`, `common`, `norm`, `linesOf`, `Block`/`splitBlocks`/`bodyLines`) ซ้ำกันทุกไฟล์ ให้ย้ายไป `internal/verify/expect.ts` (หรือไฟล์ข้างเคียง) ตอนทำบทถัดไป
- solutions (เลื่อนไว้ ต้องรัน solutions ใหม่): บท 022 exercise-3 พิมพ์คำสั่งซื้อทั้งหมดโดยไม่มีเพดาน 5 บรรทัดเหมือนสินค้า และมี guard `Map.has` ที่ซ้ำเกิน · comment ของบท 021 exercise-2 พูดถึง `.refine` ทั้งที่ schema ไม่มี

## Later (จากการรีวิวแผน 2)

- hook ของ `lesson-guards.test.ts` ที่กันแค่ `fetch` ต้องกัน MCP (child process) และ pg / socket ด้วย ก่อนบทแรกที่ใช้ของเหล่านั้น (แผน 16)
- test ที่ยังขาดจากรีวิวแผน 2: shim abort flake · ช่วงบทที่คร่อม (straddle range) และ branch ที่ซ้ำใน verify · `บท 006 และ 100 คน` กับการ rollback ข้อความของ renumber · BOM echo ของ `ask()` · regex ราคาของบท 009 ที่รับ `.` ตัวเดียว (แผน 22)
