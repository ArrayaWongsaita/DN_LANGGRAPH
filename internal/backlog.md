# งานที่เลื่อนไปแผนหลัง (จากการรีวิวท้ายแผน 1)

รายการเล็กๆ ที่ยังไม่ทำ ใส่เลขแผนที่ต้องทำไว้ท้ายบรรทัด

แผน 2 ปิดแล้ว: ตรวจเลขบทซ้ำ กฎชื่อไฟล์รันได้ และ test guard ของแบบฝึก `97fbd21` · verify จับ checks ที่พังทีละบทและ exit 1 เมื่อรัน 0 รอบ `fdd83a1` · `pnpm renumber` `cec7057` + `3a825e3`

## แผน 3 (ก่อนบทที่มี prompt ใน code fence)

- `course-rules.ts` นับ `## ` ภายใน code fence เป็นหัวข้อ README ต้องติดตามสถานะ fence ตอนสแกน (แผน 3)

## แผน 22 (release gate) หรือทำเมื่อสะดวก

- เพิ่ม Node 26 ใน CI matrix และเลิกเขียนว่า "Node 24 (LTS)" ใน `.github/workflows/ci.yml`, `internal/windows-checklist.md` ตรวจเวอร์ชัน `actions/*` อีกครั้ง (แผน 22)
- `scripts/lesson.ts` กับ `internal/verify/runner.ts` ซ้ำ argv ของ child process ควรดึงเป็น `lessonChildArgs` (แผน 22)
- ย้ายบรรทัด `OPENCODE_*` ของผู้สอนออกจาก `.env.example` ไปไว้ใน `internal/README.md` อย่างเดียว (แผน 22)
- ตรวจสระอำ (sara am) ใน `.env.example` และ `package.json` ที่ปัจจุบันถูกข้าม (แผน 22)
- คำอธิบายใน `lessons/004` เรื่องเงื่อนไขส่ง header Authorization ให้ตรงกับโค้ด (ส่งเมื่อมี `OLLAMA_API_KEY`) (แผน 22)
- เพิ่ม `expectBlock` ใน `internal/verify/expect.ts` ตรวจบล็อก "ต้องตรงทุกตัว" ใน README อัตโนมัติ (แผน 22)
- test ที่ยังขาด: ทางแยก `child.error` ของ runner, SIGTERM-only timeout, บัฟเฟอร์ไม่จำกัด, parse argv (แผน 22)
- แผน 3: comment ใน scripts/lib/exercise-guard.ts (WeakMap/guardTargets) วางผิดที่ · กฎ pnpm lesson MMM==NNN ยังไม่มีทางหนีสำหรับบทที่ตั้งใจอ้างบทอื่น
