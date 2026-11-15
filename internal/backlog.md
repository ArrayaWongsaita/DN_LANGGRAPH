# งานที่เลื่อนไปแผนหลัง (จากการรีวิวท้ายแผน 1)

รายการเล็กๆ ที่ยังไม่ทำ ใส่เลขแผนที่ต้องทำไว้ท้ายบรรทัด

## แผน 2 (ก่อน/พร้อมสคริปต์ renumber)

- สคริปต์ renumber ต้องแก้เลขบทที่ฮาร์ดโค้ดด้วย: `src/lib/env.ts` (ENV_LESSON), `scripts/lib/course-rules.ts` (046, 006-027), `scripts/lib/doctor-checks.ts` ("002") และคอมเมนต์ `# บท NNN:` ใน `.env.example` หรือรวมเลขเหล่านี้ไว้ที่เดียว (แผน 2)
- กติกาตั้งชื่อไฟล์ช่วย (helper) และ `route.ts`: ไฟล์ `.ts` ที่ไม่ใช่ไฟล์รันตรงๆ ตอนนี้จะทำให้ `pnpm check` ไม่ผ่าน โผล่เป็นตัวเลือกของ `pnpm lesson` และต้องมี check ของ verify · ต้องตัดสินใจก่อนบท 023-027 (เช่น `^(example|exercise-\d+)(\.(ollama|google))?$` เป็นไฟล์รัน, ที่เหลือยกเว้น) และใช้กับ `route.ts` บท 147 (แผน 2)
- เลขบทซ้ำ: `course-rules.ts` ไม่ตรวจโฟลเดอร์ที่เลขซ้ำ `findLesson` เลือกตัวแรกเงียบๆ และ verify รันทั้งสองโฟลเดอร์กับ checks ไฟล์เดียว (แผน 2)
- ไฟล์ `internal/checks/NNN.ts` ที่ import พัง ทำให้ `pnpm verify` ล้มทั้งรอบ (`scripts/verify.ts` ~บรรทัด 83) ให้จับ error ทีละบท (แผน 2)
- `pnpm verify 999 --provider google` (เลือกไม่ตรงบทใดเลย) พิมพ์ผ่าน 0 ไม่ผ่าน 0 แล้ว exit 0 ต้อง exit 1 เมื่อรันไป 0 รอบ เพราะพิมพ์ผิดจะดูเหมือนผ่าน (แผน 2 และใช้เป็นเกณฑ์ release gate ของแผน 22)

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
