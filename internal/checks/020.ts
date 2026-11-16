import { getOrder } from "../../src/shop/orders";
import { searchProducts } from "../../src/shop/products";
import { ORDER_STATUS_LABELS, type ProductQuery } from "../../src/shop/types";
import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const CUSTOMER_ID = "C001";
const STEP1 = "--- ขั้นที่ 1: ตรวจ JSON ด้วย zod (ข้อความตายตัว) ---";
const STEP2 = "--- ขั้นที่ 2: ขอ JSON จากโมเดลจริง ---";

export const QUESTIONS: readonly string[] = [
  "อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท",
  "มีแก้วกาแฟอะไรบ้าง",
  "ของขวัญให้แฟนที่ชอบกาแฟ ราคาไม่เกิน 800",
];

const ORDER_QUESTIONS: readonly string[] = [
  "ขอยกเลิกคำสั่งซื้อ O1003 เพราะสั่งผิด",
  "คำสั่งซื้อ O1002 ถึงไหนแล้ว",
  "ขอคืนเงิน O1001 ของแตก",
];
const ORDER_EXPECTED: readonly { action: string; orderId: string }[] = [
  { action: "cancel", orderId: "O1003" },
  { action: "status", orderId: "O1002" },
  { action: "refund", orderId: "O1001" },
];
const ORDER_SAMPLES: readonly string[] = [
  'ตรวจตัวอย่าง: {"action":"cancel","orderId":"O1002"} → ผ่าน',
  'ตรวจตัวอย่าง: {"action":"delete","orderId":"O1002"} → ไม่ผ่าน',
  'ตรวจตัวอย่าง: {"action":"cancel","orderId":"1002"} → ไม่ผ่าน',
];

// จำนวนสินค้าจริงของแต่ละตัวกรอง คำนวณจาก src/shop ไม่ฝังตัวเลขในเกณฑ์
const DRIP_COUNT = searchProducts({ keyword: "ดริป", maxPrice: 200 }).length;
const DRINKWARE_COUNT = searchProducts({ category: "drinkware" }).length;

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");

// บรรทัดสถานะของคำสั่งซื้อที่ลูกค้าคนนี้เห็น: ไม่มีของคนอื่นต้องได้ข้อความ "ไม่พบ" เหมือนคำสั่งซื้อที่ไม่มีอยู่จริง
export function expectedStatusLine(orderId: string): string {
  const order = getOrder(orderId, CUSTOMER_ID);
  return order === undefined ? `ไม่พบคำสั่งซื้อ ${orderId} ของลูกค้ารายนี้` : ORDER_STATUS_LABELS[order.status];
}

// ทุกบรรทัด "zod: ผ่าน <json>" ต้องตามด้วยสถานะที่คำนวณจาก getOrder(orderId, C001) เท่านั้น
// คำสั่งซื้อของลูกค้าคนอื่น (เช่น O1004 ของ C002) จึงพิมพ์สถานะจริงไม่ได้
export function expectNoStatusLeak(text: string, label: string): void {
  for (const m of text.matchAll(/^zod: ผ่าน (\{.*\})$/gm)) {
    let data: unknown;
    try {
      data = JSON.parse(m[1]);
    } catch {
      throw new CheckFailure(`${label}: บรรทัด zod: ผ่าน ไม่ใช่ JSON`);
    }
    const orderId = typeof (data as { orderId?: unknown }).orderId === "string" ? (data as { orderId: string }).orderId : "";
    const next = text.slice((m.index ?? 0) + m[0].length).split("\n").map((l) => l.trim()).find((l) => l !== "") ?? "";
    const want = `สถานะ: ${expectedStatusLine(orderId)}`;
    if (next !== want) throw new CheckFailure(`${label}: ${orderId} ต้องพิมพ์ "${want}" (ได้ "${next}")`);
  }
}

interface Block {
  n: number;
  head: string;
  body: string;
}

// แยกส่วนที่ขึ้นต้นด้วยหัวข้อที่มีเลข ต้องมีเลขครบตาม want และเรียงตามลำดับ
function splitBlocks(text: string, re: RegExp, label: string, want: readonly number[]): Block[] {
  const matches = [...text.matchAll(re)];
  const got = matches.map((m) => Number(m[1]));
  if (got.join(",") !== want.join(",")) {
    throw new CheckFailure(`${label}: ต้องมีหัวข้อ ${want.join(", ")} ตามลำดับ (ได้ ${got.join(", ") || "ไม่มีเลย"})`);
  }
  return matches.map((m, i) => ({
    n: Number(m[1]),
    head: (m[2] ?? "").trim(),
    body: text.slice((m.index ?? 0) + m[0].length, matches[i + 1]?.index ?? text.length).trim(),
  }));
}

const bodyLines = (block: Block): string[] => linesOf(block.body);

function expectBody(block: Block, expected: string[], label: string): void {
  const got = bodyLines(block);
  if (got.join("\n") !== expected.join("\n")) {
    throw new CheckFailure(`${label}: ผลของหัวข้อ ${block.n} ไม่ตรงกับที่ต้องได้\n${got.join("\n")}`);
  }
}

function expectQuestionHeads(blocks: Block[], questions: readonly string[], label: string): void {
  if (blocks.map((b) => b.head).join("\n") !== questions.join("\n")) {
    throw new CheckFailure(`${label}: คำถามในหัวข้อไม่ตรงกับชุดที่กำหนด\n${blocks.map((b) => b.head).join("\n")}`);
  }
}

// ตรวจว่าบรรทัด "zod: ผ่าน <json>" ตามด้วย "เจอสินค้า: N ชิ้น" ที่ N ตรงกับ searchProducts ของ JSON นั้น
function expectFilterCounts(text: string, label: string): number {
  let count = 0;
  for (const m of text.matchAll(/^zod: ผ่าน (\{.*\})$/gm)) {
    count += 1;
    let data: unknown;
    try {
      data = JSON.parse(m[1]);
    } catch {
      throw new CheckFailure(`${label}: บรรทัด zod: ผ่าน ไม่ใช่ JSON`);
    }
    const next = text.slice((m.index ?? 0) + m[0].length).split("\n").map((l) => l.trim()).find((l) => l !== "") ?? "";
    const got = expectMatches(next, /^เจอสินค้า: (\d+) ชิ้น$/, `${label} (เจอสินค้า: N ชิ้น)`);
    const want = searchProducts(data as ProductQuery).length;
    if (Number(got[1]) !== want) throw new CheckFailure(`${label}: เจอสินค้า ${got[1]} ชิ้น ไม่ตรงกับ JSON ที่พิมพ์ (${want} ชิ้น)`);
  }
  return count;
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);

    // ขั้นที่ 1: ข้อความตายตัว 4 ก้อน ผลต้องตรงทุกบรรทัด
    const step1 = extractSection(out, STEP1, STEP2, label);
    const blocks = splitBlocks(step1, /^ข้อความที่ (\d+): (.*)$/gm, `${label} (ขั้นที่ 1)`, [1, 2, 3, 4]);
    if (blocks.some((b) => b.head === "")) throw new CheckFailure(`${label}: บรรทัด "ข้อความที่ N:" ต้องมีข้อความตามหลัง`);
    expectBody(blocks[0], [
      "JSON.parse ตรงๆ: ผ่าน",
      'zod: ผ่าน {"keyword":"ดริป","maxPrice":200}',
      `เจอสินค้า: ${DRIP_COUNT} ชิ้น`,
    ], `${label} (ข้อความที่ 1)`);
    expectBody(blocks[1], [
      "JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)",
      "แกะเอาเฉพาะ {...} แล้ว: ผ่าน",
      'zod: ผ่าน {"category":"drinkware"}',
      `เจอสินค้า: ${DRINKWARE_COUNT} ชิ้น`,
    ], `${label} (ข้อความที่ 2)`);
    for (const [i, key, title] of [[2, "→ at maxPrice", "maxPrice"], [3, "ไม่มีค่า (null)", "null"]] as const) {
      const lines = bodyLines(blocks[i]);
      if (lines[0] !== "JSON.parse ตรงๆ: ผ่าน" || lines[1] !== "zod: ไม่ผ่าน") {
        throw new CheckFailure(`${label} (ข้อความที่ ${i + 1}): ต้องขึ้นด้วย JSON.parse ผ่าน แล้ว zod: ไม่ผ่าน`);
      }
      if (!lines.some((l) => l.includes(key))) throw new CheckFailure(`${label} (ข้อความที่ ${i + 1}): ไม่พบ "${title}" ในข้อความ zod`);
      if (lines.some((l) => l.startsWith("เจอสินค้า:"))) throw new CheckFailure(`${label} (ข้อความที่ ${i + 1}): zod ไม่ผ่านต้องไม่พิมพ์จำนวนสินค้า`);
    }
    const step1Lines = linesOf(step1);
    if (step1Lines.filter((l) => l === "JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)").length !== 1) {
      throw new CheckFailure(`${label}: ขั้นที่ 1 ต้องมี "JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)" 1 ครั้ง`);
    }
    if (step1Lines.filter((l) => l === "zod: ไม่ผ่าน").length !== 2) {
      throw new CheckFailure(`${label}: ขั้นที่ 1 ต้องมี "zod: ไม่ผ่าน" 2 ครั้ง`);
    }
    for (const n of [DRIP_COUNT, DRINKWARE_COUNT]) {
      if (!step1Lines.includes(`เจอสินค้า: ${n} ชิ้น`)) throw new CheckFailure(`${label}: ขั้นที่ 1 ไม่มี "เจอสินค้า: ${n} ชิ้น"`);
    }

    // ขั้นที่ 2: 3 คำถาม สรุปต้องตรงกับจำนวนบรรทัด zod: ผ่าน
    const step2 = extractSection(out, STEP2, null, label);
    const questions = splitBlocks(step2, /^--- คำถามที่ (\d+): (.*) ---$/gm, `${label} (ขั้นที่ 2)`, [1, 2, 3]);
    expectQuestionHeads(questions, QUESTIONS, label);
    for (const q of questions) {
      const lines = bodyLines(q);
      if (!lines.some((l) => l.startsWith("คำตอบดิบ: "))) throw new CheckFailure(`${label} (คำถามที่ ${q.n}): ไม่มีบรรทัด คำตอบดิบ:`);
      const hasPass = lines.some((l) => l.startsWith("zod: ผ่าน "));
      const hasFail = lines.some((l) => l === "zod: ไม่ผ่าน");
      if (hasPass === hasFail) throw new CheckFailure(`${label} (คำถามที่ ${q.n}): ต้องมี zod: ผ่าน หรือ zod: ไม่ผ่าน อย่างใดอย่างหนึ่ง`);
      if (hasFail && lines.some((l) => l.startsWith("เจอสินค้า:"))) {
        throw new CheckFailure(`${label} (คำถามที่ ${q.n}): zod ไม่ผ่านต้องไม่พิมพ์จำนวนสินค้า`);
      }
    }
    const pass = expectFilterCounts(step2, label);
    const summary = expectMatches(step2, /^สรุป: zod ผ่าน (\d+)\/3$/m, `${label} (สรุป: zod ผ่าน X/3)`);
    if (Number(summary[1]) < 2) throw new CheckFailure(`${label}: ต้องมี zod ผ่านอย่างน้อย 2/3 (ได้ ${summary[1]}/3)`);
    if (Number(summary[1]) !== pass) throw new CheckFailure(`${label}: สรุป zod ผ่าน ${summary[1]}/3 ไม่ตรงกับจำนวนบรรทัด zod: ผ่าน (${pass})`);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const samples = linesOf(out).filter((l) => l.startsWith("ตรวจตัวอย่าง:"));
    if (samples.join("\n") !== ORDER_SAMPLES.join("\n")) {
      throw new CheckFailure(`${label}: บรรทัด ตรวจตัวอย่าง ต้องเป็น\n${ORDER_SAMPLES.join("\n")}\n(ได้\n${samples.join("\n") || "ไม่มีเลย"})`);
    }

    const questions = splitBlocks(out, /^--- คำถามที่ (\d+): (.*) ---$/gm, label, [1, 2, 3]);
    expectQuestionHeads(questions, ORDER_QUESTIONS, label);
    let pass = 0;
    for (const [i, q] of questions.entries()) {
      const lines = bodyLines(q);
      if (!lines.some((l) => l.startsWith("คำตอบดิบ: "))) throw new CheckFailure(`${label} (คำถามที่ ${q.n}): ไม่มีบรรทัด คำตอบดิบ:`);
      const idx = lines.findIndex((l) => l.startsWith("zod: ผ่าน "));
      if (idx < 0) {
        if (!lines.some((l) => l.startsWith("zod: ไม่ผ่าน"))) throw new CheckFailure(`${label} (คำถามที่ ${q.n}): ต้องมี zod: ผ่าน หรือ zod: ไม่ผ่าน`);
        continue;
      }
      pass += 1;
      let data: { action?: unknown; orderId?: unknown };
      try {
        data = JSON.parse(lines[idx].slice("zod: ผ่าน ".length)) as { action?: unknown; orderId?: unknown };
      } catch {
        throw new CheckFailure(`${label} (คำถามที่ ${q.n}): บรรทัด zod: ผ่าน ไม่ใช่ JSON`);
      }
      const want = ORDER_EXPECTED[i];
      if (data.action !== want.action || data.orderId !== want.orderId) {
        throw new CheckFailure(`${label} (คำถามที่ ${q.n}): ต้องได้ action ${want.action} orderId ${want.orderId} (ได้ ${String(data.action)} ${String(data.orderId)})`);
      }
      const wantStatus = `สถานะ: ${expectedStatusLine(want.orderId)}`;
      if (lines[idx + 1] !== wantStatus) throw new CheckFailure(`${label} (คำถามที่ ${q.n}): ต้องพิมพ์ "${wantStatus}" (ได้ "${lines[idx + 1] ?? "ไม่มี"}")`);
    }
    expectNoStatusLeak(out, label);
    const summary = expectMatches(out, /^สรุป: zod ผ่าน (\d+)\/3$/m, `${label} (สรุป: zod ผ่าน X/3)`);
    if (Number(summary[1]) < 2) throw new CheckFailure(`${label}: ต้องมี zod ผ่านอย่างน้อย 2/3 (ได้ ${summary[1]}/3)`);
    if (Number(summary[1]) !== pass) throw new CheckFailure(`${label}: สรุป zod ผ่าน ${summary[1]}/3 ไม่ตรงกับจำนวนบรรทัด zod: ผ่าน (${pass})`);
  },
});

const exercise2 = (label: string, options: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const sample = `ตรวจตัวอย่าง: ตัวเลือกที่เพิ่ม ${options}`;
    if (!linesOf(out).includes(sample)) throw new CheckFailure(`${label}: ไม่พบ "${sample}"`);
    const questions = splitBlocks(out, /^--- คำถามที่ (\d+): (.*) ---$/gm, label, [1, 2, 3]);
    expectQuestionHeads(questions, QUESTIONS, label);

    const lines = linesOf(out);
    const parsed = lines.filter((l) => l.startsWith("JSON.parse ตรงๆ: ผ่าน")).length;
    const a = expectMatches(out, /^JSON.parse ตรงๆ ผ่าน: (\d+)\/3$/m, `${label} (JSON.parse ตรงๆ ผ่าน: A/3)`);
    if (Number(a[1]) !== 3) throw new CheckFailure(`${label}: JSON.parse ตรงๆ ผ่านต้องเป็น 3/3 (ได้ ${a[1]}/3)`);
    if (Number(a[1]) !== parsed) throw new CheckFailure(`${label}: JSON.parse ตรงๆ ผ่าน ${a[1]}/3 ไม่ตรงกับจำนวนบรรทัดที่ผ่าน (${parsed})`);
    const zod = expectMatches(out, /^zod ผ่าน: (\d+)\/3$/m, `${label} (zod ผ่าน: X/3)`);
    if (Number(zod[1]) < 2) throw new CheckFailure(`${label}: zod ผ่านต้องอย่างน้อย 2/3 (ได้ ${zod[1]}/3)`);
    const passed = expectFilterCounts(out, label);
    if (Number(zod[1]) !== passed) throw new CheckFailure(`${label}: zod ${zod[1]}/3 ไม่ตรงกับจำนวนบรรทัด zod: ผ่าน (${passed})`);
  },
});

export default {
  "example.ollama": example("example.ollama"),
  "example.google": example("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama", '{"format":"json"}'),
  "exercise-2.google": exercise2("exercise-2.google", '{"responseMimeType":"application/json"}'),
} satisfies Record<string, FileCheck>;
