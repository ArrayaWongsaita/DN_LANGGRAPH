import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  EXERCISE_GUARD_FROM,
  PROVIDER_PAIRS_FROM,
  PROVIDER_PAIRS_TO,
  README_HEADINGS,
  STUDIO_FROM,
  checkLessonFileNames,
  checkLessonFolders,
  checkLessonRunNumbers,
  checkNoHardcodedModels,
  checkNoSecrets,
  checkProviderPairs,
  checkReadmeHeadings,
  checkThaiSaraAm,
  checkVerifyCoverage,
  type Problem,
} from "./course-rules";

const roots: string[] = [];
const SARA_AM_BAD = String.fromCharCode(0x0e17, 0x0e4d, 0x0e32); // wrong sara am encoding

function write(root: string, rel: string, content = ""): void {
  const full = path.join(root, ...rel.split("/"));
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}
function newRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dn-rules-"));
  roots.push(root);
  write(root, ".gitignore", "node_modules/\n.env\n.env.*\n");
  return root;
}
const readmeText = (headings: readonly string[]) => headings.map((h) => `## ${h}\n\nเนื้อหา\n`).join("\n");
function allRules(root: string): Problem[] {
  return [
    ...checkLessonFolders(root),
    ...checkReadmeHeadings(root),
    ...checkProviderPairs(root),
    ...checkNoHardcodedModels(root),
    ...checkNoSecrets(root),
    ...checkThaiSaraAm(root),
    ...checkLessonRunNumbers(root),
    ...checkVerifyCoverage(root),
  ];
}
function goodRoot(): string {
  const root = newRoot();
  const readme = readmeText(README_HEADINGS.filter((h) => h !== "เปิดดูใน Studio"));
  for (const d of ["001-intro", "002-a", "003-b", "004-c", "005-d", "006-raw-fetch"]) write(root, `lessons/${d}/README.md`, readme);
  write(root, "lessons/006-raw-fetch/example.ollama.ts", "export const a = 1;\n");
  write(root, "lessons/006-raw-fetch/example.google.ts", "export const a = 2;\n");
  write(root, "internal/checks/006.ts", "export {};\n");
  write(root, "src/lib/env.ts", 'export const m = env("OLLAMA_MODEL");\n');
  write(root, "README.md", "# หลักสูตร\n");
  return root;
}
function rootWith(dirs: string[]): string {
  const root = newRoot();
  for (const d of dirs) fs.mkdirSync(path.join(root, "lessons", d), { recursive: true });
  return root;
}
function rootWithReadme(dir: string, headings: readonly string[]): string {
  const root = newRoot();
  write(root, `lessons/${dir}/README.md`, readmeText(headings));
  return root;
}
function rootWithFiles(dir: string, files: string[]): string {
  const root = newRoot();
  for (const f of files) write(root, `lessons/${dir}/${f}`, "export {};\n");
  return root;
}
function rootWithSource(src: string): string {
  const root = newRoot();
  write(root, "src/x.ts", src);
  return root;
}

afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

describe("course rules", () => {
  it("โครงที่ถูกต้อง → ไม่มีปัญหา", () => expect(allRules(goodRoot())).toEqual([]));
  it("ไม่มีโฟลเดอร์ lessons → ไม่มีปัญหา", () => expect(allRules(newRoot())).toEqual([]));

  it("เลขบทขาด", () =>
    expect(checkLessonFolders(rootWith(["001-a", "003-c"]))).toContainEqual(expect.objectContaining({ message: "เลขบทขาด: ไม่มีบท 002" })));
  it("เลขบทซ้ำ", () =>
    expect(checkLessonFolders(rootWith(["001-x", "002-x", "003-x", "004-x", "005-x", "006-x", "007-a", "007-b"]))).toContainEqual(
      expect.objectContaining({ file: "lessons", message: "เลขบทซ้ำ: 007-a, 007-b" }),
    ));
  it("checkLessonFileNames จับชื่อที่ไม่ตรงรูปแบบ", () => {
    const root = rootWithFiles("008-a", ["exercise1.ts", "example-ollama.ts", "exercise-1.Ollama.ts", "helper.ts", "example.test.ts", "exercise-1.ts"]);
    expect(checkLessonFileNames(root).map((p) => path.basename(p.file)).sort()).toEqual(["example-ollama.ts", "exercise-1.Ollama.ts", "exercise1.ts"]);
    expect(checkLessonFileNames(root)[0].message).toBe("ชื่อไฟล์ไม่ตรงรูปแบบ example / exercise-N (.ollama|.google) จึงจะไม่ถูกรัน");
  });
  it("checkLessonRunNumbers จับ pnpm lesson ที่เลขไม่ตรงบท (เฉพาะ .ts)", () => {
    const root = rootWithFiles("008-a", ["example.ollama.ts"]);
    write(root, "lessons/008-a/example.ollama.ts", "// รัน: pnpm lesson 008 example.ollama\n// ลอง pnpm lesson 007 x\n");
    write(root, "lessons/008-a/README.md", "pnpm lesson 002\n");
    const p = checkLessonRunNumbers(root);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ file: "lessons/008-a/example.ollama.ts", line: 2 });
    expect(p[0].message).toContain("pnpm lesson 008");
  });
  it("checkProviderPairs ไม่ฟ้อง helper.ts", () => expect(checkProviderPairs(rootWithFiles("008-a", ["helper.ts"]))).toEqual([]));
  it("ค่าคงที่เป็น string 3 หลัก", () => {
    for (const c of [STUDIO_FROM, PROVIDER_PAIRS_FROM, PROVIDER_PAIRS_TO, EXERCISE_GUARD_FROM]) expect(c).toMatch(/^\d{3}$/);
  });
  it("ชื่อโฟลเดอร์ผิด", () => expect(checkLessonFolders(rootWith(["001-a", "2-b"]))).toHaveLength(1));
  it("ภาคผนวกชื่อถูกรูปแบบ ไม่นับเป็นเลขบท", () =>
    expect(checkLessonFolders(rootWith(["001-a", "appendix-a-more-providers"]))).toEqual([]));

  it("README ขาดหัวข้อ", () =>
    expect(checkReadmeHeadings(rootWithReadme("001-a", README_HEADINGS.filter((h) => h !== "จุดที่มักพลาด" && h !== "เปิดดูใน Studio")))).toHaveLength(1));
  it("README ลำดับหัวข้อผิด", () => {
    const hs = README_HEADINGS.filter((h) => h !== "เปิดดูใน Studio");
    const swapped = [hs[1], hs[0], ...hs.slice(2)];
    expect(checkReadmeHeadings(rootWithReadme("001-a", swapped))).toHaveLength(1);
  });
  it("README มีหัวข้ออื่นแทรกได้", () =>
    expect(checkReadmeHeadings(rootWithReadme("001-a", [README_HEADINGS[0], "แทรก", ...README_HEADINGS.slice(1).filter((h) => h !== "เปิดดูใน Studio")]))).toEqual([]));
  it("บทไม่มี README", () => expect(checkReadmeHeadings(rootWith(["001-a"]))).toHaveLength(1));
  it("บท 001 ไม่ต้องมี Studio แต่ 046 ต้องมี", () => {
    const without = README_HEADINGS.filter((h) => h !== "เปิดดูใน Studio");
    expect(checkReadmeHeadings(rootWithReadme("001-a", without))).toEqual([]);
    expect(checkReadmeHeadings(rootWithReadme("046-studio", without))).toHaveLength(1);
    expect(checkReadmeHeadings(rootWithReadme("046-studio", README_HEADINGS))).toEqual([]);
  });
  it("ข้ามภาคผนวก", () => expect(checkReadmeHeadings(rootWith(["appendix-a-x"]))).toEqual([]));

  it("006 มี ollama แต่ไม่มี google", () =>
    expect(checkProviderPairs(rootWithFiles("006-raw-fetch", ["example.ollama.ts"]))).toHaveLength(1));
  it("google ไม่มีคู่ ollama", () =>
    expect(checkProviderPairs(rootWithFiles("006-raw-fetch", ["example.google.ts"]))).toHaveLength(1));
  it("006 มี example.ts เปล่า", () => expect(checkProviderPairs(rootWithFiles("006-raw-fetch", ["example.ts"]))).toHaveLength(1));
  it("006 มี exercise-1.ts เปล่า", () => expect(checkProviderPairs(rootWithFiles("006-raw-fetch", ["exercise-1.ts"]))).toHaveLength(1));
  it("บทนอกช่วง 006-027 ใช้ example.ts ได้", () =>
    expect(checkProviderPairs(rootWithFiles("002-setup-project", ["example.ts"]))).toEqual([]));

  it("ชื่อโมเดลในโค้ด", () => expect(checkNoHardcodedModels(rootWithSource(`const m = { model: "gemma3" }`))).toHaveLength(1));
  it("initChatModel ใส่ชื่อตรง", () => expect(checkNoHardcodedModels(rootWithSource('initChatModel("x")'))).toHaveLength(1));
  it("อ่านชื่อโมเดลจาก env ได้", () =>
    expect(checkNoHardcodedModels(rootWithSource(`const m = { model: env("OLLAMA_MODEL") }`))).toEqual([]));

  it("เจอ key ของ Google", () => expect(checkNoSecrets(rootWithSource("const k = 'AIza" + "A".repeat(35) + "'"))).toHaveLength(1));
  it("เจอ key ของ LangSmith", () =>
    expect(checkNoSecrets(rootWithSource("const k = 'lsv2_pt_" + "a1".repeat(10) + "'"))).toHaveLength(1));
  it("เจอ key ของ opencode", () =>
    expect(checkNoSecrets(rootWithSource("const k = 'oc_sk" + "_" + "a1B2".repeat(6) + "'"))).toHaveLength(1));
  it("oc_sk_ สั้นเกินไป (ข้อความอธิบาย) ไม่ถูกจับ", () =>
    expect(checkNoSecrets(rootWithSource("// prefix oc_sk" + "_xxx"))).toEqual([]));
  it(".env ไม่ถูกไล่ แต่ .env.example ถูกไล่", () => {
    const root = newRoot();
    write(root, ".env", "K=AIza" + "A".repeat(35));
    expect(checkNoSecrets(root)).toEqual([]);
    write(root, ".env.example", "K=AIza" + "A".repeat(35));
    expect(checkNoSecrets(root)).toHaveLength(1);
  });
  it(".gitignore ต้องมี .env", () => {
    const root = newRoot();
    write(root, ".gitignore", "node_modules/\n");
    expect(checkNoSecrets(root)).toHaveLength(1);
  });

  it("สระอำผิดรหัส บอกเลขบรรทัด", () => {
    const root = newRoot();
    write(root, "README.md", `บรรทัดแรก\n${SARA_AM_BAD}\n`);
    const [p] = checkThaiSaraAm(root);
    expect(p.line).toBe(2);
    expect(p.file).toBe("README.md");
  });

  it("บทที่มีไฟล์ให้รันแต่ไม่มีไฟล์ตรวจ", () =>
    expect(checkVerifyCoverage(rootWithFiles("002-setup-project", ["example.ts"]))).toHaveLength(1));
  it("มีไฟล์ตรวจแล้ว → ผ่าน", () => {
    const root = rootWithFiles("002-setup-project", ["example.ts"]);
    write(root, "internal/checks/002.ts", "export {};\n");
    expect(checkVerifyCoverage(root)).toEqual([]);
  });
});
