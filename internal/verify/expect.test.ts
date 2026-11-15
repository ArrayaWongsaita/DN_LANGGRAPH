import { describe, expect, it } from "vitest";
import { CheckFailure, expectIncludes, expectMatches, expectNotIncludes, expectSuccess, expectThai } from "./expect";
import type { RunResult } from "./types";

function fakeRun(over: Partial<RunResult> = {}): RunResult {
  return {
    lesson: "001", file: "example", provider: "google", attempt: 1, env: {},
    stdout: "", stderr: "", exitCode: 0, timedOut: false, durationMs: 1, usage: null, ...over,
  };
}

describe("expect", () => {
  it("expectSuccess ผ่านเมื่อ exit 0", () => expectSuccess(fakeRun()));
  it("expectSuccess แนบ stderr", () => expect(() => expectSuccess(fakeRun({ exitCode: 1, stderr: "พัง" }))).toThrow(/พัง/));
  it("expectSuccess แนบ stderr แค่ 20 บรรทัดสุดท้าย", () => {
    const stderr = Array.from({ length: 30 }, (_, i) => `บรรทัด${i}`).join("\n");
    expect(() => expectSuccess(fakeRun({ exitCode: 1, stderr }))).toThrow(/บรรทัด29/);
    expect(() => expectSuccess(fakeRun({ exitCode: 1, stderr }))).not.toThrow(/บรรทัด0\b/);
  });
  it("expectSuccess timeout", () => expect(() => expectSuccess(fakeRun({ timedOut: true, exitCode: null }))).toThrow(CheckFailure));
  it("expectIncludes", () => {
    expectIncludes("abc", "b", "x");
    expect(() => expectIncludes("abc", "z", "x")).toThrow(CheckFailure);
  });
  it("expectNotIncludes: needle ว่างหรือ undefined ผ่าน", () => {
    expectNotIncludes("abc", undefined, "x");
    expectNotIncludes("abc", "", "x");
    expect(() => expectNotIncludes("abc", "a", "x")).toThrow(CheckFailure);
  });
  it("expectMatches คืนผลจับคู่", () => {
    expect(expectMatches("n=42", /n=(\d+)/, "x")[1]).toBe("42");
    expect(() => expectMatches("n", /\d/, "x")).toThrow(CheckFailure);
  });
  it("expectThai", () => {
    expect(() => expectThai("hello", "คำตอบ")).toThrow(CheckFailure);
    expectThai("สวัสดี", "คำตอบ");
  });
});
