# การตัดสินใจของผู้ควบคุมการสร้าง (ledger: ruling)

บันทึกเรื่องที่ตัดสินแทนผู้ใช้ระหว่างสร้าง เพื่อให้ผู้ใช้ตรวจและแก้ได้ · อัปเดตทุกแผน

## แผน 1
- Ruling: repo already has 1 commit ("first commit"), docs untracked; working on main in project dir (no worktree) — plan mandates main, user chose repo layout — cost if wrong: none (local only).
- Ruling: Tasks 1-5 need no keys; run them first, ask user for keys before Task 6.
- Ruling: pnpm 12 has built-in 'pnpm doctor' that shadows our script — rename the course command to 'pnpm preflight' (script file stays scripts/doctor.ts) across code, specs and plan — spec said doctor but it cannot work as written; cost if wrong: rename again (text only).
- Ruling (user directive 2026-11-16): all dev-time testing uses opencode Go endpoint, model deepseek-v4.1-flash only (key in .env as OPENCODE_API_KEY, model in OPENCODE_DEV_MODEL; needs header x-opencode-session). Google/Ollama Cloud/local Ollama testing deferred to the very end. Plan amended (commit above): add Task 5b (dev shim + verify provider opencode-dev), split Task 6 into 6a (now) / 6b (deferred), T7-9 verified on opencode-dev first. Design criteria unchanged, only reordered. Note: user pasted the key in chat — recommend rotating after the work.
- Task 10: complete (a92f2d9..07c27ca main; merge ecb9b78 on solutions). Ruling: Task 10 gets no separate task review — covered by final whole-branch review; plan's 'stop for user review' overridden by user directive.

## แผน 2
- Ruling: `ask()` returns `string | null` where `null` means input ended (EOF), and reads through the async iterator of `node:readline/promises` instead of `rl.question()` because `question()` drops lines that arrive together — cost if wrong: rework `src/lib/ask.ts` and the chatbot lessons' exit handling.
- Ruling: the opencode shim turns thinking off with `thinking: {type: "disabled"}`, a deepseek parameter that is only valid when `OPENCODE_DEV_MODEL` is a deepseek-family model — cost if wrong: change the shim translation if the dev model family changes.
- Ruling: lesson 013 teaches `.withRetry()` because `ChatOllama` ignores `maxRetries`, and teaches timeout with `.stream()` because `invoke` + `timeout` returns a half message without saying so — cost if wrong: rewrite the lesson 013 README and exercises.
- Ruling: exercise guards start at lesson 007 and lesson 006 is left untouched (its `exercise-2` calls the API while still unfilled) — cost if wrong: add guards to lesson 006 later (small rework).
- Ruling: `pnpm renumber` rewrites the lesson numbers embedded in an allowlist of 3 files (`src/lib/env.ts`, `scripts/lib/doctor-checks.ts`, `scripts/lib/course-rules.ts`) instead of moving the numbers into one place, so `src/lib/env.ts` stays readable in lesson 002 — cost if wrong: refactor the numbers into one module and drop the allowlist.
- Ruling: `pnpm verify` exits 1 whenever it ran 0 rounds, including ranges that only contain reading lessons such as `003-005` — cost if wrong: a verify run over a reading-only range reports failure; relax the rule for that case.
- Ruling: exercise counts are 3 for lessons 007 and 016 and 2 for every other lesson in section 2, each with an `.ollama` / `.google` pair — cost if wrong: add or remove exercises and their checks.
- Ruling: accepted plan 2's 7 in-plan decisions (ask() returns null on EOF; guard starts at 007; renumber allowlist 3 files; verify 0 runs exits 1; shim thinking-off only for deepseek family; 016 manual chat deferred to 6b-11; Windows items 1-5 by instructor) — they are within the plan's own rulings and spec-consistent — cost if wrong: small rework in plan 2 files.
- Ruling: on Task review, preflight scan for plan 2 skipped the detailed table (plan written by a fresh agent from the same spec and self-reviewed); the review loop is the safety net — cost if wrong: a plan defect found only at task review.
- Ruling: solutions-only tasks 9/11/13 get no separate task review after Task 7's clean review; they are covered by the final whole-plan review plus verify x3 and `pnpm check` — cost if wrong: a flaw found at final review, one fix wave.
- Ruling: Task 10 fix round got no separate scoped re-review; the fix is test-demonstrated (constant solution fails, scratch-solved passes) and covered by the final whole-plan review — cost if wrong: one more fix at final review.
