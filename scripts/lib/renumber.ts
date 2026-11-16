import { spawnSync } from "node:child_process";
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

  // รายการเลขหลัง "บท": คั่นด้วย , และ หรือ หรือขีด เลขทุกตัวในรายการต้องเลื่อน
  const SEP = String.raw`[ \t]*(?:,|และ|หรือ|[–-])[ \t]*`;
  const list = (chain: string): string => {
    const tokens = chain.split(/(\d{3})/); // [sep, num, sep, num, ...]
    const out: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      if (i % 2 === 0) {
        out.push(tokens[i]);
        continue;
      }
      const n = tokens[i];
      const prevDash = i >= 2 && /[–-]/.test(tokens[i - 1]);
      const nextDash = i + 2 < tokens.length && /[–-]/.test(tokens[i + 1]);
      if (prevDash && tokens[i - 2] !== n) out.push(pad(mapNumber(Number(n), op) ?? Number(n) - 1));
      else if (nextDash && tokens[i + 2] !== n) out.push(pad(mapNumber(Number(n), op) ?? Number(n)));
      else out.push(single(n));
    }
    return out.join("");
  };
  const parts = [
    String.raw`(?<lp>บท[ \t]*)(?<ll>\d{3}(?:${SEP}\d{3})*)(?!\d)`,
    String.raw`(?<pp>pnpm (?:lesson|verify|studio|test) )(?<pa>\d{3})(?:(?<ps>-)(?<pb>\d{3}))?(?!\d)`,
    String.raw`(?<cp>checks/)(?<cn>\d{3})(?=\.ts)`,
  ];
  const names = [...ctx.folders].sort((x, y) => y.length - x.length).map(escapeRe);
  if (names.length > 0) parts.unshift(String.raw`(?<![\d\w-])(?<fn>${names.join("|")})(?![\w-])`);
  if (ctx.literals) parts.push(String.raw`(?<qp>")(?<qn>\d{3})(?=")`);
  if (ctx.readmeTable) parts.push(String.raw`(?<tp>^\|[ \t]*)(?<tn>\d{3})(?!\d)`);

  const re = new RegExp(parts.join("|"), "gmu");
  const out = text.replace(re, (whole: string, ...args: unknown[]) => {
    const g = args[args.length - 1] as Record<string, string | undefined>;
    let next = whole;
    if (g.fn !== undefined) {
      next = single(g.fn.slice(0, 3)) + g.fn.slice(3);
    } else if (g.ll !== undefined) {
      next = g.lp + list(g.ll);
    } else if (g.pa !== undefined) {
      next = g.pp + range(g.pa, g.ps, g.pb);
    } else if (g.cn !== undefined) {
      next = g.cp + single(g.cn);
    } else if (g.qn !== undefined) {
      // เลข 200-599 ในเครื่องหมายคำพูดมักเป็น HTTP status ไม่ใช่เลขบท (คอร์สมีไม่ถึง 200 บท) จึงไม่แตะ
      const v = Number(g.qn);
      next = v >= 200 && v <= 599 ? whole : g.qp + single(g.qn);
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

  // ปลายทางต้องไม่ชนกับของที่มีอยู่ (ยกเว้นที่ถูกย้ายออกไปก่อนหน้าในลำดับ)
  const gone = new Set<string>();
  const added = new Set<string>();
  for (const r of renames) {
    const occupied = added.has(r.to) || (fs.existsSync(path.join(root, r.to)) && !gone.has(r.to));
    if (occupied) return { ok: false, message: `ปลายทาง ${r.to} มีอยู่แล้ว ย้าย/ลบออกก่อนแล้วรันใหม่` };
    gone.add(r.from);
    added.add(r.to);
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

function finalPath(file: string, renames: RenumberPlan["renames"]): string {
  let out = file;
  for (const r of renames) {
    if (out === r.from || out.startsWith(`${r.from}/`)) {
      out = r.to + out.slice(r.from.length);
      break;
    }
  }
  return out;
}

// ย้ายโฟลเดอร์ก่อน แล้วค่อยเขียนไฟล์ที่แก้ (ที่อยู่ใหม่) ถ้าล้มเหลวกลางทางจะพยายามย้อนกลับ แล้ว throw พร้อมรายงานว่าทำอะไรไปแล้ว
export function applyRenumber(root: string, plan: RenumberPlan): void {
  const undo: { label: string; run: () => void }[] = [];
  const done: string[] = [];
  const steps: { label: string; run: () => void }[] = [];
  for (const r of plan.renames) {
    steps.push({
      label: `เปลี่ยนชื่อ ${r.from} → ${r.to}`,
      run: () => {
        fs.renameSync(path.join(root, r.from), path.join(root, r.to));
        undo.push({ label: `ย้าย ${r.to} กลับเป็น ${r.from}`, run: () => fs.renameSync(path.join(root, r.to), path.join(root, r.from)) });
      },
    });
  }
  for (const e of plan.edits) {
    const target = path.join(root, finalPath(e.file, plan.renames));
    steps.push({
      label: `แก้ ${finalPath(e.file, plan.renames)}`,
      run: () => {
        const original = fs.readFileSync(target, "utf8");
        fs.writeFileSync(target, e.text);
        undo.push({ label: `คืนเนื้อหา ${finalPath(e.file, plan.renames)}`, run: () => fs.writeFileSync(target, original) });
      },
    });
  }
  for (let i = 0; i < steps.length; i++) {
    try {
      steps[i].run();
      done.push(steps[i].label);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const rollbackFailed: string[] = [];
      for (const u of undo.reverse()) {
        try {
          u.run();
        } catch {
          rollbackFailed.push(u.label);
        }
      }
      const lines = [`ล้มเหลวที่ขั้น: ${steps[i].label} (${reason})`, `ทำไปแล้วก่อนล้มเหลว ${done.length} ขั้น`];
      lines.push(
        rollbackFailed.length === 0
          ? "ย้อนกลับทุกขั้นที่ทำไปแล้วสำเร็จ ไม่มีอะไรถูกแก้ค้างไว้"
          : `ย้อนกลับไม่สำเร็จ ต้องแก้เอง (ใช้ git status / git checkout .): ${rollbackFailed.join("; ")}`,
      );
      lines.push(`ขั้นที่ยังไม่ได้ทำ ${steps.length - i - 1} ขั้น`);
      throw new Error(lines.join("\n"));
    }
  }
}

export type GitState = "clean" | "dirty" | "unknown";

export function gitState(root: string): GitState {
  const r = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  if (r.error || r.status !== 0) return "unknown";
  return r.stdout.trim() === "" ? "clean" : "dirty";
}

// คืน exit code (CLI บางๆ อยู่ที่ scripts/renumber.ts)
export function runRenumber(
  argv: string[],
  root: string,
  out: (line: string) => void = console.log,
  err: (line: string) => void = console.error,
): number {
  const dryRun = argv.includes("--dry-run");
  const force = argv.includes("--force");
  const rest = argv.filter((a) => a !== "--dry-run" && a !== "--force");
  const kind = rest[0];
  const m = rest[1] !== undefined && /^\d{1,3}$/.test(rest[1]) ? Number(rest[1]) : 0;
  if ((kind !== "insert" && kind !== "remove") || m < 1 || rest.length !== 2) {
    err("ใช้งาน: pnpm renumber <insert|remove> NNN [--dry-run]");
    return 1;
  }
  const at3 = pad(m);
  const result = planRenumber(root, { kind, at: m });
  if (!result.ok) {
    err(result.message);
    return 1;
  }
  const { plan } = result;
  if (!dryRun && !force) {
    const state = gitState(root);
    if (state === "dirty") {
      err("มีไฟล์ที่ยังไม่ได้ commit ให้ commit หรือ stash ก่อน (หรือใช้ --force ถ้ามั่นใจ)");
      return 1;
    }
    if (state === "unknown") {
      err("ตรวจสถานะ git ไม่ได้ จึงไม่กล้าแก้ไฟล์ ให้ติดตั้ง git หรือใช้ --force ถ้ามั่นใจ");
      return 1;
    }
  }
  for (const r of plan.renames) out(`เปลี่ยนชื่อ: ${r.from} → ${r.to}`);
  for (const e of plan.edits) out(`แก้: ${e.file} (${e.changes} จุด)`);
  for (const r of plan.removedRefs) out(`⚠️ ยังมีที่อ้างถึงบท ${at3} ที่ถูกลบ: ${r.file} (${r.count} จุด) ให้แก้เอง`);
  if (dryRun) {
    out("ยังไม่ได้แก้ไฟล์ (--dry-run)");
    return 0;
  }
  try {
    applyRenumber(root, plan);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    return 1;
  }
  out(kind === "insert" ? `เสร็จแล้ว สร้างโฟลเดอร์ lessons/${at3}-<slug> ของบทใหม่ แล้วรัน pnpm check และ pnpm test` : "เสร็จแล้ว รัน pnpm check และ pnpm test");
  out("หมายเหตุ: ไฟล์ *.test.ts ไม่ถูกแก้อัตโนมัติ ให้รัน pnpm test แล้วแก้เลขบทในเทสต์เองถ้ามี");
  return 0;
}
