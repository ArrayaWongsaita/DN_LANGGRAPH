import path from "node:path";
import { describe, expect, it } from "vitest";
import { EXERCISE_GUARD_FROM } from "../../scripts/lib/course-rules";
import { guardProblem, guardTargets, runGuard } from "./exercise-guard";

const root = path.resolve(import.meta.dirname, "..", "..");

describe("lesson guards", () => {
  it("แบบฝึกที่ยังไม่เติมทุกไฟล์ (บท 007 ขึ้นไป) พิมพ์ 👉 แล้วจบโดยไม่เรียก API", async () => {
    const targets = guardTargets(path.join(root, "lessons"), EXERCISE_GUARD_FROM);
    const failures: string[] = [];
    for (let i = 0; i < targets.length; i += 4) {
      const results = await Promise.all(targets.slice(i, i + 4).map((t) => runGuard(root, t)));
      for (const r of results) {
        const problem = guardProblem(r);
        if (problem) failures.push(`${path.relative(root, r.file)}: ${problem}`);
      }
    }
    expect(failures).toEqual([]);
  }, 300000);
});
