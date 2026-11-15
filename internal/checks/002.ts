import { expectIncludes, expectMatches, expectNotIncludes, expectSuccess } from "../verify/expect";
import type { LessonChecks } from "../verify/types";

const checks: LessonChecks = {
  example: {
    check: (run) => {
      expectSuccess(run);
      expectIncludes(run.stdout, "สวัสดีจาก DN_LANGGRAPH", "example");
      expectMatches(run.stdout, /Node v\d+/, "example");
      expectNotIncludes(run.stdout, run.env.GOOGLE_API_KEY, "example (ห้ามพิมพ์ค่า key)");
    },
  },
  "exercise-1": {
    check: (run) => {
      expectSuccess(run);
      expectMatches(run.stdout, /สวัสดี \S+/, "exercise-1");
      expectNotIncludes(run.stdout, "ชื่อของคุณ", "exercise-1 (ต้องแก้ค่าชั่วคราว)");
    },
  },
  "exercise-2": {
    check: (run) => {
      expectSuccess(run);
      expectIncludes(run.stdout, `GOOGLE_MODEL = ${run.env.GOOGLE_MODEL ?? ""}`, "exercise-2");
    },
  },
};

export default checks;
