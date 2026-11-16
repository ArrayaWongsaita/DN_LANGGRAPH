import { getProduct, listProducts } from "../../src/shop/products";
import type { Product } from "../../src/shop/types";
import { CheckFailure, expectIncludes, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const STEP1 = "--- ขั้นที่ 1: ใส่ข้อมูลสินค้าด้วย template string ---";
const SIM = "--- จำลอง context เต็ม: เก็บได้แค่ 10 บรรทัดท้าย ---";
const STEP2 = "--- ขั้นที่ 2: ถามราคาโดยใส่ข้อมูล 3 แบบ ---";
const V1 = "--- แบบที่ 1: ไม่ใส่ข้อมูล ---";
const V2 = "--- แบบที่ 2: ใส่สินค้าทุกชิ้น ---";
const V3 = "--- แบบที่ 3: ใส่เฉพาะสินค้าที่ค้นเจอ ---";
const BUDGET = 300;

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");
const len = (s: string): number => [...s].length;

// ค่าที่คาดคำนวณจากข้อมูลร้านจริง ไม่ฝังตัวเลขในเกณฑ์
function product(id: string): Product {
  const p = getProduct(id);
  if (p === undefined) throw new Error(`เกณฑ์ตรวจ: ไม่พบสินค้า ${id} ใน src/shop`);
  return p;
}
const productLine = (p: Product): string => `${p.id} ${p.name} ราคา ${p.price} บาท`;
// ราคาที่ยอมรับ: 380 หรือ 1,290 (มีจุลภาคคั่นหลักพัน)
const priceForms = (p: Product): string[] => [String(p.price), p.price.toLocaleString("en-US")];
function expectPrice(text: string, p: Product, label: string): void {
  if (!priceForms(p).some((f) => text.includes(f))) throw new CheckFailure(`${label}: ไม่พบราคา ${p.price} ของ ${p.id}`);
}

function expectNoLeak(text: string, label: string): void {
  if (/\b(undefined|null|NaN)\b/.test(text)) throw new CheckFailure(`${label}: พบ undefined/null/NaN หลุดมาในผลที่พิมพ์`);
}

function expectAnswer(text: string, label: string): void {
  if (text === "" || /^(undefined|null)$/.test(text)) throw new CheckFailure(`${label}: คำตอบว่างหรือเป็น ${text || "ค่าว่าง"}`);
  expectThai(text, label);
}

// จำนวนบรรทัดและตัวอักษรที่ fitBudget ที่ถูกต้องต้องเก็บ (เก็บจากต้นตราบที่รวมแล้วไม่เกินงบ)
export function expectedFit(lines: string[], maxChars: number): { count: number; chars: number } {
  let count = 0;
  while (count < lines.length && len(lines.slice(0, count + 1).join("\n")) <= maxChars) count++;
  return { count, chars: len(lines.slice(0, count).join("\n")) };
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const step1 = linesOf(extractSection(out, STEP1, SIM, label));
    const first = ["P001", "P002", "P003"].map((id) => productLine(product(id)));
    first.forEach((line, i) => {
      if (step1[i] !== line) throw new CheckFailure(`${label}: บรรทัดที่ ${i + 1} ของขั้นที่ 1 ต้องเป็น "${line}" (ได้ "${step1[i] ?? ""}")`);
    });
    const rest = listProducts().length - 3;
    if (step1[3] !== `... (อีก ${rest} บรรทัด)`) throw new CheckFailure(`${label}: บรรทัดที่ 4 ของขั้นที่ 1 ต้องเป็น "... (อีก ${rest} บรรทัด)"`);
    const all = expectMatches(step1.join("\n"), /^ทุกชิ้น: 24 บรรทัด ยาว (\d+) ตัวอักษร$/m, `${label} (ทุกชิ้น)`);
    const found = expectMatches(step1.join("\n"), /^เฉพาะที่ค้นด้วย "ดอยช้าง": 1 บรรทัด ยาว (\d+) ตัวอักษร$/m, `${label} (เฉพาะที่ค้นด้วย "ดอยช้าง")`);
    if (Number(all[1]) <= Number(found[1])) throw new CheckFailure(`${label}: ความยาวของทุกชิ้น (${all[1]}) ต้องมากกว่าเฉพาะที่ค้นเจอ (${found[1]})`);

    const sim = linesOf(extractSection(out, SIM, STEP2, label));
    const expectedSim = [
      "ข้อความทั้งหมด 26 บรรทัด เหลือ 10 บรรทัด",
      `บรรทัดแรกที่เหลือ: ${productLine(product("P016"))}`,
      "system prompt ยังอยู่ไหม: ไม่อยู่",
      "ข้อมูล P001 ยังอยู่ไหม: ไม่อยู่",
    ];
    if (sim.join("\n") !== expectedSim.join("\n")) throw new CheckFailure(`${label}: ผลของส่วนจำลองไม่ตรงกับที่ต้องได้\n${sim.join("\n")}`);

    const step2 = extractSection(out, STEP2, null, label);
    const variants = [V1, V2, V3].map((h, i, hs) => extractSection(step2, h, hs[i + 1] ?? null, label));
    const tokens = variants.map((v, i) => {
      const t = expectMatches(v, /^ขาเข้า: (\d+) token$/m, `${label} (แบบที่ ${i + 1} ขาเข้า: N token)`);
      if (Number(t[1]) <= 0) throw new CheckFailure(`${label}: แบบที่ ${i + 1} token ขาเข้าต้องมากกว่า 0`);
      return Number(t[1]);
    });
    if (tokens[1] <= tokens[2]) throw new CheckFailure(`${label}: token ขาเข้าของแบบที่ 2 (${tokens[1]}) ต้องมากกว่าแบบที่ 3 (${tokens[2]})`);
    const answers = variants.map((v, i) => {
      const m = /^คำตอบ: ([\s\S]*)$/m.exec(v);
      if (!m) throw new CheckFailure(`${label}: แบบที่ ${i + 1} ไม่มีบรรทัด "คำตอบ:"`);
      return m[1].trim();
    });
    expectAnswer(answers[0], `${label} (แบบที่ 1)`);
    expectPrice(answers[1], product("P001"), `${label} (แบบที่ 2)`);
    expectPrice(answers[2], product("P001"), `${label} (แบบที่ 3)`);
  },
});

// แยกคำตอบหลังหัวข้อ "--- คำถามที่ N ---"
function exerciseAnswers(out: string, label: string): string[] {
  const heads = ["--- คำถามที่ 1 ---", "--- คำถามที่ 2 ---"];
  return heads.map((h, i) => extractSection(out, h, heads[i + 1] ?? null, label));
}

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const checks = [...out.matchAll(/^ตรวจตัวอย่าง: (.*)$/gm)].map((m) => m[1]);
    if (checks.length < 2) throw new CheckFailure(`${label}: ต้องมีบรรทัด "ตรวจตัวอย่าง:" 2 บรรทัด (ได้ ${checks.length})`);
    const [soldOut, inStock] = checks;
    expectNoLeak(soldOut + inStock, `${label} (ตรวจตัวอย่าง)`);
    const p012 = product("P012");
    const p018 = product("P018");
    expectIncludes(soldOut, "P012", `${label} (ตรวจตัวอย่าง บรรทัดที่ 1)`);
    expectPrice(soldOut, p012, `${label} (ตรวจตัวอย่าง บรรทัดที่ 1)`);
    expectIncludes(soldOut, "หมด", `${label} (ตรวจตัวอย่าง บรรทัดที่ 1)`);
    if (/เหลือ\s*\d+\s*ชิ้น/.test(soldOut)) throw new CheckFailure(`${label}: สินค้าที่สต็อกเป็น 0 ต้องไม่เขียนว่า เหลือ N ชิ้น`);
    expectIncludes(inStock, "P018", `${label} (ตรวจตัวอย่าง บรรทัดที่ 2)`);
    expectPrice(inStock, p018, `${label} (ตรวจตัวอย่าง บรรทัดที่ 2)`);
    expectIncludes(inStock, String(p018.stock), `${label} (ตรวจตัวอย่าง บรรทัดที่ 2)`);
    if (inStock.includes("หมด")) throw new CheckFailure(`${label}: สินค้าที่มีของ (P018) ต้องไม่มีคำว่า หมด`);

    const [a1, a2] = exerciseAnswers(out, label);
    expectAnswer(a1, `${label} (คำถามที่ 1)`);
    expectAnswer(a2, `${label} (คำถามที่ 2)`);
    expectMatches(a1, /หมด|ไม่มีของ|ไม่มีสินค้า/, `${label} (คำถามที่ 1 ต้องบอกว่าของหมด)`);
    expectIncludes(a2, String(p018.stock), `${label} (คำถามที่ 2)`);
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    expectMatches(out, /^ตรวจตัวอย่าง: งบ 4 ตัวอักษร ได้ 1 บรรทัด$/m, `${label} (ตรวจตัวอย่าง)`);
    const m = expectMatches(out, /^ส่งข้อมูล (\d+) จาก 24 บรรทัด \((\d+) ตัวอักษร\)$/m, `${label} (ส่งข้อมูล N จาก 24 บรรทัด (M ตัวอักษร))`);
    const want = expectedFit(listProducts().map(productLine), BUDGET);
    if (Number(m[1]) !== want.count) throw new CheckFailure(`${label}: เก็บได้ ${m[1]} บรรทัด แต่งบ ${BUDGET} ตัวอักษรควรได้ ${want.count} บรรทัด`);
    if (Number(m[2]) > BUDGET) throw new CheckFailure(`${label}: ส่งไป ${m[2]} ตัวอักษร เกินงบ ${BUDGET}`);
    if (Number(m[2]) !== want.chars) throw new CheckFailure(`${label}: ความยาวที่พิมพ์ (${m[2]}) ไม่ตรงกับบรรทัดที่ควรเก็บ (${want.chars})`);

    const [a1, a2] = exerciseAnswers(out, label);
    expectAnswer(a1, `${label} (คำถามที่ 1)`);
    expectAnswer(a2, `${label} (คำถามที่ 2)`);
    expectPrice(a1, product("P001"), `${label} (คำถามที่ 1)`);
    expectIncludes(a2, "ไม่มีข้อมูล", `${label} (คำถามที่ 2)`);
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
