import { describe, expect, it } from "vitest";
import * as z from "zod";
import { getProduct, searchProducts } from "../../src/shop/products";
import { CATEGORIES, type Product } from "../../src/shop/types";
import checks, { QUESTIONS } from "../checks/021";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "021", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

const p = (id: string): Product => {
  const found = getProduct(id);
  if (found === undefined) throw new Error(id);
  return found;
};
const productLine = (id: string): string => `${p(id).id} ${p(id).name} ราคา ${p(id).price} บาท`;

// schema หน้าตาเดียวกับบท 021 สร้างด้วย zod จริง (description 4 จุด, enum ของ category)
const Schema = z
  .object({
    keyword: z.string().optional().describe("คำที่ใช้ค้น"),
    category: z.enum(CATEGORIES).optional().describe("หมวดหมู่สินค้า"),
    maxPrice: z.number().optional().describe("ราคาสูงสุด"),
  })
  .describe("ตัวกรองสำหรับค้นสินค้าในร้าน DN Shop");
const STEP1_JSON = JSON.stringify(z.toJSONSchema(Schema), null, 2);

type SchemaNode = {
  description?: string;
  enum?: unknown[];
  anyOf?: unknown[];
  properties?: Record<string, SchemaNode>;
};
const SCHEMA = JSON.parse(STEP1_JSON) as SchemaNode;
// สร้าง schema หน้าตาเดิมที่แก้จุดเดียว เพื่อทดสอบว่าเกณฑ์จับ schema ที่ผิดได้
const withSchema = (mutate: (schema: SchemaNode) => void): string => {
  const clone = structuredClone(SCHEMA);
  mutate(clone);
  return JSON.stringify(clone, null, 2);
};
const Q1 = '{"keyword":"คั่วเข้ม","maxPrice":400}';
const Q2 = '{"category":"drinkware"}';
// นับด้วย searchProducts จริง
function searchCount(json: string): number {
  return searchProducts(JSON.parse(json) as Parameters<typeof searchProducts>[0]).length;
}

const STEP2 = (summary: number): string[] => [
  "--- ขั้นที่ 2: withStructuredOutput ---",
  `--- คำถามที่ 1: ${QUESTIONS[0]} ---`,
  `ตัวกรอง: ${Q1}`,
  `เจอสินค้า: ${searchCount(Q1)} ชิ้น: ${searchProducts(JSON.parse(Q1) as Parameters<typeof searchProducts>[0]).slice(0, 3).map((x) => x.name).join(", ")}`,
  `--- คำถามที่ 2: ${QUESTIONS[1]} ---`,
  `ตัวกรอง: ${Q2}`,
  `เจอสินค้า: ${searchCount(Q2)} ชิ้น`,
  `--- คำถามที่ 3: ${QUESTIONS[2]} ---`,
  "แปลงไม่สำเร็จ: โมเดลไม่ได้เรียกเครื่องมือ",
  `สรุป: แปลงสำเร็จ ${summary}/3`,
];
const EXAMPLE = [
  "--- ขั้นที่ 1: schema ที่ LangChain ส่งให้โมเดล ---",
  "ชื่อเครื่องมือ: search_filter",
  STEP1_JSON,
  ...STEP2(2),
].join("\n");

describe("เกณฑ์ตรวจบท 021 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และรับ CRLF (ข้อหนึ่งแปลงไม่สำเร็จแต่ X = 2)", () => {
    expect(() => check(run(EXAMPLE))).not.toThrow();
    expect(() => checks["example.google"].check(run(EXAMPLE))).not.toThrow();
    expect(() => check(run(EXAMPLE.replace(/\n/g, "\r\n")))).not.toThrow();
  });
  it("ผ่านเมื่อ enum ของ category อยู่ใน anyOf", () => {
    const anyOf = withSchema((s) => {
      s.properties!.category = { description: "หมวดหมู่สินค้า", anyOf: [{ type: "string", enum: [...CATEGORIES] }] };
    });
    expect(anyOf).not.toBe(STEP1_JSON);
    expect(() => check(run(EXAMPLE.replace(STEP1_JSON, anyOf)))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อชื่อเครื่องมือผิด หรือ schema ขาด property", () => {
    expect(() => check(run(EXAMPLE.replace("ชื่อเครื่องมือ: search_filter", "ชื่อเครื่องมือ: filter")))).toThrow(/ชื่อเครื่องมือ/);
    expect(() => check(run(EXAMPLE.replace(`"maxPrice": {`, `"maxprice": {`)))).toThrow(/maxPrice/);
  });
  it("ไม่ผ่านเมื่อ enum ไม่ครบ หรือ description ไม่ครบ 4 จุด", () => {
    const enumMissing = withSchema((s) => {
      s.properties!.category.enum = CATEGORIES.slice(0, 3);
    });
    expect(() => check(run(EXAMPLE.replace(STEP1_JSON, enumMissing)))).toThrow(/enum/);
    const noDescription = withSchema((s) => {
      delete s.properties!.maxPrice.description;
    });
    expect(() => check(run(EXAMPLE.replace(STEP1_JSON, noDescription)))).toThrow(/description/);
  });
  it("ไม่ผ่านเมื่อจำนวนสินค้าไม่ตรงกับตัวกรองที่พิมพ์", () => {
    expect(() => check(run(EXAMPLE.replace(`เจอสินค้า: ${searchCount(Q2)} ชิ้น`, `เจอสินค้า: ${searchCount(Q2) + 1} ชิ้น`)))).toThrow(/ไม่ตรงกับตัวกรอง/);
  });
  it("ไม่ผ่านเมื่อ maxPrice ของคำถามที่ 1 ไม่ใช่ 400", () => {
    const cheap = '{"keyword":"คั่วเข้ม","maxPrice":300}';
    const mutated = EXAMPLE
      .replace(Q1, cheap)
      .replace(`เจอสินค้า: ${searchCount(Q1)} ชิ้น`, `เจอสินค้า: ${searchCount(cheap)} ชิ้น`);
    expect(() => check(run(mutated))).toThrow(/maxPrice/);
  });
  it("ไม่ผ่านเมื่อสรุปไม่ตรงกับจำนวนบรรทัด ตัวกรอง: หรือแปลงสำเร็จน้อยกว่า 2", () => {
    expect(() => check(run(EXAMPLE.replace("สรุป: แปลงสำเร็จ 2/3", "สรุป: แปลงสำเร็จ 3/3")))).toThrow(/ไม่ตรงกับจำนวน/);
    const onlyOne = EXAMPLE
      .replace(`ตัวกรอง: ${Q2}\nเจอสินค้า: ${searchCount(Q2)} ชิ้น`, "แปลงไม่สำเร็จ: โมเดลไม่ได้เรียกเครื่องมือ")
      .replace("สรุป: แปลงสำเร็จ 2/3", "สรุป: แปลงสำเร็จ 1/3");
    expect(() => check(run(onlyOne))).toThrow(/อย่างน้อย 2/);
  });
  it("ไม่ผ่านเมื่อคำถามที่ 1 แปลงไม่สำเร็จพร้อมกับไม่มีตัวกรองของข้ออื่น หรือ exit code ไม่ใช่ 0", () => {
    expect(() => check(run(EXAMPLE.replace("ชื่อเครื่องมือ: search_filter", "ชื่อเครื่องมือ: x")))).toThrow();
    expect(() => check({ ...run(EXAMPLE), exitCode: 1 })).toThrow();
  });
});

const GOOD1 = [
  "ตรวจตัวอย่าง: P001 → ผ่าน",
  "ตรวจตัวอย่าง: P999 → ไม่ผ่าน",
  `แนะนำ: ${productLine("P006")}`,
  "เหตุผล: ดริปซองคั่วกลางชงง่าย เหมาะกับมือใหม่",
].join("\n");

describe("เกณฑ์ตรวจบท 021 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider", () => {
    expect(() => check(run(GOOD1))).not.toThrow();
    expect(() => checks["exercise-1.google"].check(run(GOOD1))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม หรือบรรทัดตรวจตัวอย่างผิด", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม productIdField (ดูบรรทัดที่มี 👉)"))).toThrow();
    expect(() => check(run(GOOD1.replace("P999 → ไม่ผ่าน", "P999 → ผ่าน")))).toThrow(/ตรวจตัวอย่าง/);
    expect(() => check(run(GOOD1.replace("P001 → ผ่าน", "P001 → ไม่ผ่าน")))).toThrow(/ตรวจตัวอย่าง/);
  });
  it("ไม่ผ่านเมื่อรหัสสินค้าไม่มีจริง หรือชื่อ/ราคาไม่ตรงกับ getProduct", () => {
    expect(() => check(run(GOOD1.replace(`แนะนำ: ${productLine("P006")}`, "แนะนำ: P999 ไม่มีจริง ราคา 1 บาท")))).toThrow(/ไม่มีในร้าน/);
    expect(() => check(run(GOOD1.replace(productLine("P006"), "P006 อย่างอื่น ราคา 189 บาท")))).toThrow(/ชื่อสินค้า/);
    expect(() => check(run(GOOD1.replace(productLine("P006"), `P006 ${p("P006").name} ราคา 190 บาท`)))).toThrow(/ราคา/);
  });
  it("ไม่ผ่านเมื่อแนะนำสินค้าเกินงบ 500 หรือเหตุผลไม่ใช่ภาษาไทย", () => {
    expect(() => check(run(GOOD1.replace(productLine("P006"), productLine("P012"))))).toThrow(/เกินงบ/);
    expect(() => check(run(GOOD1.replace("เหตุผล: ดริปซองคั่วกลางชงง่าย เหมาะกับมือใหม่", "เหตุผล: good for beginners")))).toThrow(/ไทย/);
  });
});

const CART_LINES = (): string[] => [
  "ตรวจตัวอย่าง: quantity 0 → ไม่ผ่าน",
  "ตรวจตัวอย่าง: quantity 1.5 → ไม่ผ่าน",
  "ตรวจตัวอย่าง: คำอธิบายใน schema 3 จุด",
  `- ${p("P006").id} ${p("P006").name} × 2 = ${p("P006").price * 2} บาท`,
  `- ${p("P015").id} ${p("P015").name} × 1 = ${p("P015").price} บาท`,
  `ตะกร้า: 2 รายการ รวม ${p("P006").price * 2 + p("P015").price} บาท`,
];
const GOOD2 = CART_LINES().join("\n");

describe("เกณฑ์ตรวจบท 021 (exercise-2)", () => {
  const check = checks["exercise-2.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และรับลำดับรายการสลับกัน", () => {
    expect(() => check(run(GOOD2))).not.toThrow();
    expect(() => checks["exercise-2.google"].check(run(GOOD2))).not.toThrow();
    const [q0, q15] = CART_LINES();
    const swapped = [q0, q15, ...CART_LINES().slice(2, 3), CART_LINES()[4], CART_LINES()[3], CART_LINES()[5]].join("\n");
    expect(() => check(run(swapped))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม คำอธิบายไม่ครบ 3 จุด หรือบรรทัดตรวจตัวอย่างผิด", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม cartSchema (ดูบรรทัดที่มี 👉)"))).toThrow();
    expect(() => check(run(GOOD2.replace("คำอธิบายใน schema 3 จุด", "คำอธิบายใน schema 2 จุด")))).toThrow(/อย่างน้อย 3/);
    expect(() => check(run(GOOD2.replace("quantity 0 → ไม่ผ่าน", "quantity 0 → ผ่าน")))).toThrow(/quantity 0/);
  });
  it("ไม่ผ่านเมื่อรายการสินค้าไม่ตรงกับ P006 × 2 กับ P015 × 1", () => {
    const p06 = `- ${p("P006").id} ${p("P006").name} × 2 = ${p("P006").price * 2} บาท`;
    const p06one = `- ${p("P006").id} ${p("P006").name} × 1 = ${p("P006").price} บาท`;
    expect(() => check(run(GOOD2.replace(p06, p06one)))).toThrow(/P006 × 2/);
    const p15 = `- ${p("P015").id} ${p("P015").name} × 1 = ${p("P015").price} บาท`;
    expect(() => check(run(GOOD2.replace(p15, "- P015 ไม่พบสินค้า")))).toThrow(/P015/);
    const p07 = `- ${p("P007").id} ${p("P007").name} × 1 = ${p("P007").price} บาท`;
    expect(() => check(run(GOOD2.replace(p15, p07)))).toThrow(/P015/);
  });
  it("ไม่ผ่านเมื่อราคารวมของรายการหรือยอดรวมในบรรทัด ตะกร้า ผิด", () => {
    expect(() => check(run(GOOD2.replace(`× 2 = ${p("P006").price * 2} บาท`, `× 2 = ${p("P006").price * 2 + 1} บาท`)))).toThrow(/ราคารวม/);
    expect(() => check(run(GOOD2.replace(`รวม ${p("P006").price * 2 + p("P015").price} บาท`, `รวม ${p("P006").price * 2 + p("P015").price + 1} บาท`)))).toThrow(/ยอดรวม/);
    expect(() => check(run(GOOD2.replace("ตะกร้า: 2 รายการ", "ตะกร้า: 3 รายการ")))).toThrow(/รายการ/);
  });
});
