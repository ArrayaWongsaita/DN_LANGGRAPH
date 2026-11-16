# การตัดสินใจของผู้ควบคุมการสร้าง (ledger: ruling)

บันทึกเรื่องที่ตัดสินแทนผู้ใช้ระหว่างสร้าง เพื่อให้ผู้ใช้ตรวจและแก้ได้ · อัปเดตทุกแผน

## แผน 1
- Ruling: repo already has 1 commit ("first commit"), docs untracked; working on main in project dir (no worktree) — plan mandates main, user chose repo layout — cost if wrong: none (local only).
- Ruling: Tasks 1-5 need no keys; run them first, ask user for keys before Task 6.
- Ruling: pnpm 12 has built-in 'pnpm doctor' that shadows our script — rename the course command to 'pnpm preflight' (script file stays scripts/doctor.ts) across code, specs and plan — spec said doctor but it cannot work as written; cost if wrong: rename again (text only).
- Ruling (user directive 2026-11-16): all dev-time testing uses opencode Go endpoint, model deepseek-v4.1-flash only (key in .env as OPENCODE_API_KEY, model in OPENCODE_DEV_MODEL; needs header x-opencode-session). Google/Ollama Cloud/local Ollama testing deferred to the very end. Plan amended (commit above): add Task 5b (dev shim + verify provider opencode-dev), split Task 6 into 6a (now) / 6b (deferred), T7-9 verified on opencode-dev first. Design criteria unchanged, only reordered. Note: user pasted the key in chat — recommend rotating after the work.
- Task 10: complete (a92f2d9..07c27ca main; merge ecb9b78 on solutions). Ruling: Task 10 gets no separate task review — covered by final whole-branch review; plan's 'stop for user review' overridden by user directive.
