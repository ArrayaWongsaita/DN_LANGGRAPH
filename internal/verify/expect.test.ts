import { describe, expect, it } from "vitest";
import { CheckFailure, expectIncludes, expectMatches, expectNotIncludes, expectSuccess, expectNoSecrets, expectThai, extractAfter, extractRounds, extractSection } from "./expect";
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
  it("expectNotIncludes ไม่พิมพ์ค่าที่ห้ามมีลงในข้อความ error", () => {
    const secret = "SECRETVALUE" + "12345";
    try {
      expectNotIncludes(`out ${secret} out`, secret, "x");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CheckFailure);
      expect((e as Error).message).not.toContain(secret);
      expect((e as Error).message).not.toContain("SECRET");
      expect((e as Error).message).toContain(String(secret.length));
    }
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

describe("extractAfter / extractRounds", () => {
  it("extractAfter คืนข้อความหลัง marker หลายบรรทัด", () => {
    expect(extractAfter("a\nคำตอบ: สวัสดี\nบรรทัดสอง\n", "คำตอบ: ", "x")).toBe("สวัสดี\nบรรทัดสอง");
  });
  it("extractAfter ไม่พบ marker", () => expect(() => extractAfter("abc", "คำตอบ: ", "x")).toThrow(CheckFailure));
  it("extractRounds อ่านหลายรอบและข้อความหลายบรรทัด", () => {
    const out = "ครั้งที่ 1: ก\nข\n(token 10→20)\nครั้งที่ 2: ค\n(token 11→21)\n";
    expect(extractRounds(out)).toEqual([
      { n: 1, text: "ก\nข", inputTokens: 10, outputTokens: 20 },
      { n: 2, text: "ค", inputTokens: 11, outputTokens: 21 },
    ]);
  });
  it("extractRounds ไม่เจอ คืนอาร์เรย์ว่าง", () => expect(extractRounds("ไม่มี")).toEqual([]));
});

describe("expectNoSecrets / extractSection", () => {
  it("throw เมื่อค่า key อยู่ใน stderr และไม่แสดงค่า", () => {
    const secret = "FAKEKEY" + "abc123";
    try {
      expectNoSecrets(fakeRun({ env: { GOOGLE_API_KEY: secret }, stderr: `x ${secret} y` }), "x");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CheckFailure);
      expect((e as Error).message).not.toContain(secret);
    }
  });
  it("throw เมื่อค่า OPENCODE_API_KEY อยู่ใน stdout", () => {
    const secret = "FAKEKEY" + "xyz789";
    expect(() => expectNoSecrets(fakeRun({ env: { OPENCODE_API_KEY: secret }, stdout: secret }), "x")).toThrow(CheckFailure);
  });
  it("ไม่ throw เมื่อค่าเป็นสตริงว่าง", () => {
    expectNoSecrets(fakeRun({ env: { GOOGLE_API_KEY: "" }, stdout: "abc", stderr: "abc" }), "x");
  });
  it("extractSection", () => {
    const t = "ก\n--- 1 ---\nข\n--- 2 ---\nค";
    expect(extractSection(t, "--- 1 ---", "--- 2 ---", "x")).toBe("ข");
    expect(extractSection(t, "--- 1 ---", null, "x")).toBe("ข\n--- 2 ---\nค");
  });
  it("extractSection ไม่พบ start หรือ end", () => {
    expect(() => extractSection("abc", "zz", null, "x")).toThrow(/^x:/);
    expect(() => extractSection("a --- 1 ---", "--- 1 ---", "--- 2 ---", "x")).toThrow(/^x:/);
  });
});
