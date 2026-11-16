import { applyRenumber, planRenumber } from "./lib/renumber";
import { normalizeLessonNumber } from "./lib/lessons";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const rest = args.filter((a) => a !== "--dry-run");
const kind = rest[0];
const at3 = rest[1] === undefined ? null : normalizeLessonNumber(rest[1]);

if ((kind !== "insert" && kind !== "remove") || at3 === null || rest.length !== 2) {
  console.error("ใช้งาน: pnpm renumber <insert|remove> NNN [--dry-run]");
  process.exit(1);
}

const result = planRenumber(process.cwd(), { kind, at: Number(at3) });
if (!result.ok) {
  console.error(result.message);
  process.exit(1);
}
const { plan } = result;
for (const r of plan.renames) console.log(`เปลี่ยนชื่อ: ${r.from} → ${r.to}`);
for (const e of plan.edits) console.log(`แก้: ${e.file} (${e.changes} จุด)`);
for (const r of plan.removedRefs) console.log(`⚠️ ยังมีที่อ้างถึงบท ${at3} ที่ถูกลบ: ${r.file} (${r.count} จุด) ให้แก้เอง`);

if (dryRun) {
  console.log("ยังไม่ได้แก้ไฟล์ (--dry-run)");
} else {
  applyRenumber(process.cwd(), plan);
  console.log(
    kind === "insert"
      ? `เสร็จแล้ว สร้างโฟลเดอร์ lessons/${at3}-<slug> ของบทใหม่ แล้วรัน pnpm check และ pnpm test`
      : "เสร็จแล้ว รัน pnpm check และ pnpm test",
  );
}
