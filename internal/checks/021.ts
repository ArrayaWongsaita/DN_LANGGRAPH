import { getProduct, searchProducts } from "../../src/shop/products";
import { CATEGORIES, type Product } from "../../src/shop/types";
import { CheckFailure, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const TOOL = "search_filter";
const STEP1 = "--- ขั้นที่ 1: schema ที่ LangChain ส่งให้โมเดล ---";
const STEP2 = "--- ขั้นที่ 2: withStructuredOutput ---";

export const QUESTIONS: readonly string[] = [
  "อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท",
  "มีแก้วกาแฟอะไรบ้าง",
  "ของขวัญให้แฟนที่ชอบกาแฟ ราคาไม่เกิน 800",
];

// จำนวน description ที่ schema ต้องมี: keyword, category, maxPrice และตัว object เอง
const DESCRIPTION_COUNT = 4;
const CART: readonly { id: string; quantity: number }[] = [
  { id: "P006", quantity: 2 },
  { id: "P015", quantity: 1 },
];

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");

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

function expectQuestionHeads(blocks: Block[], label: string): void {
  if (blocks.map((b) => b.head).join("\n") !== QUESTIONS.join("\n")) {
    throw new CheckFailure(`${label}: คำถามในหัวข้อไม่ตรงกับชุดที่กำหนด\n${blocks.map((b) => b.head).join("\n")}`);
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

// ค่า enum ของ property อาจอยู่ตรงๆ ที่ node หรืออยู่ใน anyOf (zod บางรูปแบบห่อ nullable ไว้)
function enumValues(node: unknown): unknown[] | null {
  if (!isRecord(node)) return null;
  if (Array.isArray(node.enum)) return node.enum as unknown[];
  if (Array.isArray(node.anyOf)) {
    for (const part of node.anyOf) {
      const got = enumValues(part);
      if (got !== null) return got;
    }
  }
  return null;
}

function product(id: string): Product {
  const found = getProduct(id);
  if (found === undefined) throw new Error(`เกณฑ์ตรวจ: ไม่พบสินค้า ${id} ใน src/shop`);
  return found;
}

// JSON ที่พิมพ์ตามหลังหัวข้อ ต้องแปลงกลับได้เป็น object
function parseJsonLine(line: string, prefix: string, label: string): Record<string, unknown> {
  let data: unknown;
  try {
    data = JSON.parse(line.slice(prefix.length));
  } catch {
    throw new CheckFailure(`${label}: บรรทัด "${prefix}…" ไม่ใช่ JSON`);
  }
  if (!isRecord(data)) throw new CheckFailure(`${label}: บรรทัด "${prefix}…" ต้องเป็น object`);
  return data;
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);

    // ขั้นที่ 1: ชื่อเครื่องมือ, JSON ที่แปลงได้, enum ของ category และจำนวน description
    const step1 = extractSection(out, STEP1, STEP2, label);
    const tool = expectMatches(step1, /^ชื่อเครื่องมือ: (.+)$/m, `${label} (ชื่อเครื่องมือ)`);
    if (tool[1].trim() !== TOOL) throw new CheckFailure(`${label}: ชื่อเครื่องมือต้องเป็น ${TOOL} (ได้ ${tool[1].trim()})`);
    const start = step1.indexOf("{");
    if (start < 0) throw new CheckFailure(`${label}: ขั้นที่ 1 ไม่มี JSON ของ schema`);
    const jsonText = step1.slice(start);
    let schema: unknown;
    try {
      schema = JSON.parse(jsonText);
    } catch {
      throw new CheckFailure(`${label}: JSON ของ schema ในขั้นที่ 1 แปลงด้วย JSON.parse ไม่ได้`);
    }
    if (!isRecord(schema) || !isRecord(schema.properties)) throw new CheckFailure(`${label}: schema ต้องมี properties`);
    for (const key of ["keyword", "category", "maxPrice"]) {
      if (!(key in schema.properties)) throw new CheckFailure(`${label}: schema ไม่มี properties.${key}`);
    }
    const values = enumValues(schema.properties.category);
    if (values === null || JSON.stringify(values) !== JSON.stringify([...CATEGORIES])) {
      throw new CheckFailure(`${label}: enum ของ properties.category ต้องเป็น ${CATEGORIES.join(", ")}`);
    }
    const descriptions = (jsonText.match(/"description"/g) ?? []).length;
    if (descriptions !== DESCRIPTION_COUNT) throw new CheckFailure(`${label}: schema ต้องมี "description" ${DESCRIPTION_COUNT} จุด (ได้ ${descriptions})`);

    // ขั้นที่ 2: ทุกตัวกรองตามด้วยจำนวนสินค้าที่คำนวณจาก JSON นั้น
    const step2 = extractSection(out, STEP2, null, label);
    const questions = splitBlocks(step2, /^--- คำถามที่ (\d+): (.*) ---$/gm, `${label} (ขั้นที่ 2)`, [1, 2, 3]);
    expectQuestionHeads(questions, label);
    let pass = 0;
    for (const [i, q] of questions.entries()) {
      const lines = bodyLines(q);
      const idx = lines.findIndex((l) => l.startsWith("ตัวกรอง: "));
      if (idx < 0) {
        if (!lines.some((l) => l.startsWith("แปลงไม่สำเร็จ: "))) {
          throw new CheckFailure(`${label} (คำถามที่ ${q.n}): ต้องมีบรรทัด ตัวกรอง: หรือ แปลงไม่สำเร็จ:`);
        }
        continue;
      }
      pass += 1;
      const filter = parseJsonLine(lines[idx], "ตัวกรอง: ", `${label} (คำถามที่ ${q.n})`);
      const next = lines[idx + 1] ?? "";
      const got = expectMatches(next, /^เจอสินค้า: (\d+) ชิ้น(?:[: ].*)?$/, `${label} (คำถามที่ ${q.n} เจอสินค้า: N ชิ้น)`);
      const want = searchProducts(filter).length;
      if (Number(got[1]) !== want) throw new CheckFailure(`${label} (คำถามที่ ${q.n}): เจอสินค้า ${got[1]} ชิ้น ไม่ตรงกับตัวกรองที่พิมพ์ (${want} ชิ้น)`);
      if (i === 0 && filter.maxPrice !== 400) {
        throw new CheckFailure(`${label} (คำถามที่ 1): maxPrice ต้องเป็น 400 ตามคำถาม (ได้ ${String(filter.maxPrice)})`);
      }
    }
    const summary = expectMatches(step2, /^สรุป: แปลงสำเร็จ (\d+)\/3$/m, `${label} (สรุป: แปลงสำเร็จ X/3)`);
    if (Number(summary[1]) < 2) throw new CheckFailure(`${label}: ต้องแปลงสำเร็จอย่างน้อย 2/3 (ได้ ${summary[1]}/3)`);
    if (Number(summary[1]) !== pass) throw new CheckFailure(`${label}: สรุปแปลงสำเร็จ ${summary[1]}/3 ไม่ตรงกับจำนวนบรรทัด ตัวกรอง: (${pass})`);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const samples = linesOf(out).filter((l) => l.startsWith("ตรวจตัวอย่าง:"));
    const expectedSamples = ["ตรวจตัวอย่าง: P001 → ผ่าน", "ตรวจตัวอย่าง: P999 → ไม่ผ่าน"];
    if (samples.join("\n") !== expectedSamples.join("\n")) {
      throw new CheckFailure(`${label}: บรรทัด ตรวจตัวอย่าง ต้องเป็น\n${expectedSamples.join("\n")}\n(ได้\n${samples.join("\n") || "ไม่มีเลย"})`);
    }
    const rec = expectMatches(out, /^แนะนำ: (P\d{3}) (.+) ราคา (\d+) บาท$/m, `${label} (แนะนำ: รหัส ชื่อ ราคา)`);
    const found = getProduct(rec[1]);
    if (found === undefined) throw new CheckFailure(`${label}: แนะนำสินค้ารหัส ${rec[1]} ที่ไม่มีในร้าน`);
    if (found.name !== rec[2]) throw new CheckFailure(`${label}: ชื่อสินค้าไม่ตรงกับ ${rec[1]} (ต้องเป็น "${found.name}")`);
    if (found.price !== Number(rec[3])) throw new CheckFailure(`${label}: ราคา ${rec[3]} ไม่ตรงกับ ${rec[1]} (ต้องเป็น ${found.price})`);
    if (found.price > 500) throw new CheckFailure(`${label}: แนะนำ ${found.id} ราคา ${found.price} เกินงบ 500 บาท`);
    const reason = expectMatches(out, /^เหตุผล: (.+)$/m, `${label} (เหตุผล: …)`);
    expectThai(reason[1], `${label} (เหตุผล)`);
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const lines = linesOf(out);
    for (const sample of ["ตรวจตัวอย่าง: quantity 0 → ไม่ผ่าน", "ตรวจตัวอย่าง: quantity 1.5 → ไม่ผ่าน"]) {
      if (!lines.includes(sample)) throw new CheckFailure(`${label}: ไม่พบ "${sample}"`);
    }
    const desc = expectMatches(out, /^ตรวจตัวอย่าง: คำอธิบายใน schema (\d+) จุด$/m, `${label} (คำอธิบายใน schema N จุด)`);
    if (Number(desc[1]) < 3) throw new CheckFailure(`${label}: ต้องมีคำอธิบายใน schema อย่างน้อย 3 จุด (ได้ ${desc[1]})`);

    const found = new Map<string, number>();
    for (const m of out.matchAll(/^- (P\d{3}) (.+) × (\d+) = (\d+) บาท$/gm)) {
      const p = getProduct(m[1]);
      if (p === undefined) throw new CheckFailure(`${label}: รายการสินค้ารหัส ${m[1]} ไม่มีในร้าน`);
      if (p.name !== m[2]) throw new CheckFailure(`${label}: ชื่อสินค้าไม่ตรงกับ ${m[1]} (ต้องเป็น "${p.name}")`);
      if (p.price * Number(m[3]) !== Number(m[4])) throw new CheckFailure(`${label}: ราคารวมของ ${m[1]} ไม่ตรงกับราคา ${p.price} × ${m[3]}`);
      found.set(m[1], Number(m[3]));
    }
    for (const item of CART) {
      if (found.get(item.id) !== item.quantity) throw new CheckFailure(`${label}: ต้องมี ${item.id} × ${item.quantity} (ได้ ${String(found.get(item.id) ?? "ไม่มี")})`);
    }
    if (found.size !== CART.length) throw new CheckFailure(`${label}: ต้องมีสินค้า ${CART.length} รายการ (ได้ ${found.size})`);
    const total = CART.reduce((sum, item) => sum + product(item.id).price * item.quantity, 0);
    const summary = expectMatches(out, /^ตะกร้า: (\d+) รายการ รวม (\d+) บาท$/m, `${label} (ตะกร้า: N รายการ รวม X บาท)`);
    if (Number(summary[1]) !== CART.length) throw new CheckFailure(`${label}: ตะกร้าต้องมี ${CART.length} รายการ (ได้ ${summary[1]})`);
    if (Number(summary[2]) !== total) throw new CheckFailure(`${label}: ยอดรวมต้องเป็น ${total} บาท (ได้ ${summary[2]})`);
  },
});

export default {
  "example.ollama": example("example.ollama"),
  "example.google": example("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama"),
  "exercise-2.google": exercise2("exercise-2.google"),
} satisfies Record<string, FileCheck>;
