import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyRenumber, mapNumber, planRenumber, renumberText, type RenumberOp } from "./renumber";

const ins: RenumberOp = { kind: "insert", at: 10 };
const rem: RenumberOp = { kind: "remove", at: 10 };
const ctx = { folders: new Set(["010-model-params"]), literals: false, readmeTable: false };
const t = (s: string, op = ins, c = ctx) => renumberText(s, op, c);

describe("mapNumber", () => {
  it("insert", () => {
    expect(mapNumber(9, ins)).toBe(9);
    expect(mapNumber(10, ins)).toBe(11);
  });
  it("remove", () => {
    expect(mapNumber(10, rem)).toBeNull();
    expect(mapNumber(11, rem)).toBe(10);
  });
});

describe("renumberText insert", () => {
  it("lesson refs", () => {
    const r = t("บท 009 บท 010 บท 012");
    expect(r.text).toBe("บท 009 บท 011 บท 013");
    expect(r.changes).toBe(2);
  });
  it("shifts ranges, folders, checks", () => {
    expect(t("บท 006–027").text).toBe("บท 006–028");
    expect(t("pnpm verify 001-010").text).toBe("pnpm verify 001-011");
    expect(t("lessons/010-model-params/README.md").text).toBe("lessons/011-model-params/README.md");
    expect(t("internal/checks/010.ts").text).toBe("internal/checks/011.ts");
  });
  it("leaves unrelated numbers", () => {
    for (const s of ["ราคา 500 บาท", "พอร์ต 3200", "token 120", '"010"']) expect(t(s).text).toBe(s);
  });
  it("literals", () => {
    const c = { ...ctx, literals: true };
    expect(t('"010"', ins, c).text).toBe('"011"');
    expect(t('"005"', ins, c).text).toBe('"005"');
  });
  it("shifts once", () => {
    expect(t("บท 010 (`lessons/010-model-params/`) และ `pnpm verify 010-011`").text).toBe(
      "บท 011 (`lessons/011-model-params/`) และ `pnpm verify 011-012`",
    );
  });
  it("readme table", () => {
    const c = { ...ctx, readmeTable: true };
    expect(t("| 010 🏫 | [`010-model-params`](lessons/010-model-params/README.md) | x |", ins, c).text).toBe(
      "| 011 🏫 | [`011-model-params`](lessons/011-model-params/README.md) | x |",
    );
  });
});

describe("renumberText remove", () => {
  it("keeps refs to the removed lesson and counts them", () => {
    const r = t("บท 010", rem);
    expect(r.text).toBe("บท 010");
    expect(r.removedRefs).toBe(1);
  });
  it("shifts and handles ranges", () => {
    expect(t("บท 011", rem).text).toBe("บท 010");
    expect(t("บท 001–010", rem).text).toBe("บท 001–009");
    expect(t("บท 010–012", rem).text).toBe("บท 010–011");
  });
});

describe("planRenumber / applyRenumber", () => {
  let root = "";
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
  const names = (d: string) => fs.readdirSync(path.join(root, d)).sort();
  function fixture() {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "dn-renumber-"));
    for (const n of ["001-a", "002-b", "003-c"]) write(`lessons/${n}/README.md`, `# ${n}\n`);
    write("internal/checks/002.ts", "export {};\n");
    write("internal/checks/003.ts", "export {};\n");
    write("README.md", "| 002 | [`002-b`](lessons/002-b/README.md) | x |\n\nรัน pnpm lesson 002\n");
    write("src/lib/env.ts", 'export const X = "003";\n');
    write(".env.example", "# บท 003: x\n");
    write("scripts/lib/x.test.ts", "// บท 002\n");
    write("docs/a.md", "บท 002\n");
  }

  it("insert at 2", () => {
    fixture();
    const r = planRenumber(root, { kind: "insert", at: 2 });
    if (!r.ok) throw new Error(r.message);
    applyRenumber(root, r.plan);
    expect(names("lessons")).toEqual(["001-a", "003-b", "004-c"]);
    expect(names("internal/checks")).toEqual(["003.ts", "004.ts"]);
    expect(read("src/lib/env.ts")).toContain('"004"');
    expect(read(".env.example")).toContain("# บท 004:");
    expect(read("scripts/lib/x.test.ts")).toBe("// บท 002\n");
    expect(read("docs/a.md")).toBe("บท 002\n");
  });

  it("remove at 2", () => {
    fixture();
    fs.rmSync(path.join(root, "lessons/002-b"), { recursive: true });
    fs.rmSync(path.join(root, "internal/checks/002.ts"));
    const r = planRenumber(root, { kind: "remove", at: 2 });
    if (!r.ok) throw new Error(r.message);
    applyRenumber(root, r.plan);
    expect(names("lessons")).toEqual(["001-a", "002-c"]);
    expect(r.plan.removedRefs.find((x) => x.file === "README.md")!.count).toBeGreaterThan(0);
  });

  it("refuses remove while folder exists", () => {
    fixture();
    const r = planRenumber(root, { kind: "remove", at: 2 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("ลบโฟลเดอร์ lessons/002-b ก่อน");
  });

  it("refuses bad input", () => {
    fixture();
    const bad = planRenumber(root, { kind: "insert", at: 1000 });
    expect(!bad.ok && bad.message).toBe("เลขบทต้องเป็น 001–999");
    const none = planRenumber(root, { kind: "insert", at: 9 });
    expect(!none.ok && none.message).toContain("ไม่มีบทตั้งแต่ 009 ขึ้นไป");
  });
});
