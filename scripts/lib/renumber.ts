import fs from "node:fs";
import path from "node:path";
import { duplicateNumbers, listLessons } from "./lessons";

export type RenumberOp = { kind: "insert" | "remove"; at: number };

export const LITERAL_FILES: readonly string[] = ["src/lib/env.ts", "scripts/lib/doctor-checks.ts", "scripts/lib/course-rules.ts"];

export function mapNumber(n: number, op: RenumberOp): number | null {
  if (op.kind === "insert") return n >= op.at ? n + 1 : n;
  if (n === op.at) return null;
  return n > op.at ? n - 1 : n;
}

export interface TextResult { text: string; changes: number; removedRefs: number }

const pad = (n: number): string => String(n).padStart(3, "0");
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function renumberText(
  text: string,
  op: RenumberOp,
  ctx: { folders: ReadonlySet<string>; literals: boolean; readmeTable: boolean },
): TextResult {
  let changes = 0;
  let removedRefs = 0;

  // เลขเดี่ยว: คืนเลขใหม่ (remove ที่ at คงเดิมและนับเป็นที่อ้างถึงบทที่ถูกลบ)
  const single = (s: string): string => {
    const m = mapNumber(Number(s), op);
    if (m === null) {
      removedRefs++;
      return s;
    }
    return pad(m);
  };
  // ช่วงเลข: ต้นช่วง = at คงไว้ ปลายช่วง = at เป็น at - 1 (ตอน remove)
  const range = (a: string, sep: string | undefined, b: string | undefined): string => {
    if (b === undefined || sep === undefined || a === b) return single(a);
    const start = Number(a);
    const end = Number(b);
    const ns = mapNumber(start, op) ?? start;
    const ne = mapNumber(end, op) ?? end - 1;
    return `${pad(ns)}${sep}${pad(ne)}`;
  };

  const parts = [
    String.raw`(?<lp>บท\s*)(?<la>\d{3})(?:(?<ls>[–-])(?<lb>\d{3}))?(?!\d)`,
    String.raw`(?<pp>pnpm (?:lesson|verify|studio|test) )(?<pa>\d{3})(?:(?<ps>-)(?<pb>\d{3}))?(?!\d)`,
    String.raw`(?<cp>checks/)(?<cn>\d{3})(?=\.ts)`,
  ];
  const names = [...ctx.folders].sort((x, y) => y.length - x.length).map(escapeRe);
  if (names.length > 0) parts.unshift(String.raw`(?<![\d\w-])(?<fn>${names.join("|")})(?![\w-])`);
  if (ctx.literals) parts.push(String.raw`(?<qp>")(?<qn>\d{3})(?=")`);
  if (ctx.readmeTable) parts.push(String.raw`(?<tp>^\|\s*)(?<tn>\d{3})(?!\d)`);

  const re = new RegExp(parts.join("|"), "gmu");
  const out = text.replace(re, (whole: string, ...args: unknown[]) => {
    const g = args[args.length - 1] as Record<string, string | undefined>;
    let next = whole;
    if (g.fn !== undefined) {
      next = single(g.fn.slice(0, 3)) + g.fn.slice(3);
    } else if (g.la !== undefined) {
      next = g.lp + range(g.la, g.ls, g.lb);
    } else if (g.pa !== undefined) {
      next = g.pp + range(g.pa, g.ps, g.pb);
    } else if (g.cn !== undefined) {
      next = g.cp + single(g.cn);
    } else if (g.qn !== undefined) {
      next = g.qp + single(g.qn);
    } else if (g.tn !== undefined) {
      next = g.tp + single(g.tn);
    }
    if (next !== whole) changes++;
    return next;
  });
  return { text: out, changes, removedRefs };
}

export interface RenumberPlan {
  renames: { from: string; to: string }[];
  edits: { file: string; text: string; changes: number }[];
  removedRefs: { file: string; count: number }[];
}

const SKIP_DIRS = new Set(["node_modules", ".git"]);

function walk(root: string, rel: string, exts: readonly string[], out: string[]): void {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(root, `${rel}/${e.name}`, exts, out);
    } else if (e.isFile() && exts.some((x) => e.name.endsWith(x)) && !e.name.endsWith(".test.ts")) {
      out.push(`${rel}/${e.name}`);
    }
  }
}

export function planRenumber(root: string, op: RenumberOp): { ok: true; plan: RenumberPlan } | { ok: false; message: string } {
  const at3 = pad(op.at);
  if (!Number.isInteger(op.at) || op.at < 1 || op.at > 999) return { ok: false, message: "เลขบทต้องเป็น 001–999" };
  const lessons = listLessons(path.join(root, "lessons"));
  const dups = duplicateNumbers(lessons);
  if (dups.size > 0) {
    const dupNames = [...dups.values()].flat().join(", ");
    return { ok: false, message: `มีเลขบทซ้ำ: ${dupNames} แก้ก่อนแล้วรันใหม่` };
  }
  if (op.kind === "insert") {
    if (!lessons.some((l) => Number(l.number) >= op.at)) {
      return { ok: false, message: `ไม่มีบทตั้งแต่ ${at3} ขึ้นไป สร้างโฟลเดอร์ใหม่ได้เลยไม่ต้องเลื่อน` };
    }
  } else {
    const existing = lessons.find((l) => Number(l.number) === op.at);
    if (existing) return { ok: false, message: `ลบโฟลเดอร์ lessons/${existing.number}-${existing.slug} ก่อน แล้วรันใหม่` };
    if (fs.existsSync(path.join(root, "internal", "checks", `${at3}.ts`))) {
      return { ok: false, message: `ลบ internal/checks/${at3}.ts ก่อน แล้วรันใหม่` };
    }
  }

  // รายการ rename
  const renames: { from: string; to: string }[] = [];
  const sorted = [...lessons].sort((a, b) => (op.kind === "insert" ? b.number.localeCompare(a.number) : a.number.localeCompare(b.number)));
  const checksDir = path.join(root, "internal", "checks");
  const checkNums = fs.existsSync(checksDir)
    ? fs.readdirSync(checksDir).map((f) => /^(\d{3})\.ts$/.exec(f)?.[1]).filter((x): x is string => x !== undefined)
    : [];
  const nums = [...new Set([...sorted.map((l) => l.number), ...checkNums])].sort((a, b) => (op.kind === "insert" ? b.localeCompare(a) : a.localeCompare(b)));
  for (const num of nums) {
    const mapped = mapNumber(Number(num), op);
    if (mapped === null || mapped === Number(num)) continue;
    const lesson = lessons.find((l) => l.number === num);
    if (lesson) renames.push({ from: `lessons/${num}-${lesson.slug}`, to: `lessons/${pad(mapped)}-${lesson.slug}` });
    if (checkNums.includes(num)) renames.push({ from: `internal/checks/${num}.ts`, to: `internal/checks/${pad(mapped)}.ts` });
  }

  // รายการไฟล์ที่แก้
  const files: string[] = [];
  walk(root, "lessons", [".md", ".ts"], files);
  walk(root, "internal", [".md", ".ts"], files);
  walk(root, "src", [".ts"], files);
  walk(root, "scripts", [".ts"], files);
  for (const f of ["README.md", ".env.example"]) if (fs.existsSync(path.join(root, f))) files.push(f);

  const folders = new Set(lessons.map((l) => `${l.number}-${l.slug}`));
  const edits: RenumberPlan["edits"] = [];
  const removedRefs: RenumberPlan["removedRefs"] = [];
  for (const file of files) {
    const original = fs.readFileSync(path.join(root, file), "utf8");
    const r = renumberText(original, op, { folders, literals: LITERAL_FILES.includes(file), readmeTable: file === "README.md" });
    if (r.text !== original) edits.push({ file, text: r.text, changes: r.changes });
    if (op.kind === "remove" && r.removedRefs > 0) removedRefs.push({ file, count: r.removedRefs });
  }
  return { ok: true, plan: { renames, edits, removedRefs } };
}

export function applyRenumber(root: string, plan: RenumberPlan): void {
  for (const e of plan.edits) fs.writeFileSync(path.join(root, e.file), e.text);
  for (const r of plan.renames) fs.renameSync(path.join(root, r.from), path.join(root, r.to));
}
