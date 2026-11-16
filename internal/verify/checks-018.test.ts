import { describe, expect, it } from "vitest";
import checks, { expectedFit } from "../checks/018";
import { getProduct, listProducts } from "../../src/shop/products";
import type { Product } from "../../src/shop/types";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "018", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

// ข้อมูลร้านอ่านจาก src/shop เหมือนเกณฑ์จริง ไม่ฝังราคาในเทสต์
const p = (id: string): Product => {
  const found = getProduct(id);
  if (found === undefined) throw new Error(id);
  return found;
};
const line = (id: string): string => `${p(id).id} ${p(id).name} ราคา ${p(id).price} บาท`;

const STEP1 = [
  "--- ขั้นที่ 1: ใส่ข้อมูลสินค้าด้วย template string ---",
  line("P001"), line("P002"), line("P003"),
  "... (อีก 21 บรรทัด)",
  "ทุกชิ้น: 24 บรรทัด ยาว 1234 ตัวอักษร",
  'เฉพาะที่ค้นด้วย "ดอยช้าง": 1 บรรทัด ยาว 48 ตัวอักษร',
  "--- จำลอง context เต็ม: เก็บได้แค่ 10 บรรทัดท้าย ---",
  "ข้อความทั้งหมด 26 บรรทัด เหลือ 10 บรรทัด",
  `บรรทัดแรกที่เหลือ: ${line("P016")}`,
  "system prompt ยังอยู่ไหม: ไม่อยู่",
  "ข้อมูล P001 ยังอยู่ไหม: ไม่อยู่",
];
const STEP2 = (t1: number, t2: number, t3: number, a1: string, a2: string, a3: string): string[] => [
  "--- ขั้นที่ 2: ถามราคาโดยใส่ข้อมูล 3 แบบ ---",
  "--- แบบที่ 1: ไม่ใส่ข้อมูล ---", `ขาเข้า: ${t1} token`, `คำตอบ: ${a1}`,
  "--- แบบที่ 2: ใส่สินค้าทุกชิ้น ---", `ขาเข้า: ${t2} token`, `คำตอบ: ${a2}`,
  "--- แบบที่ 3: ใส่เฉพาะสินค้าที่ค้นเจอ ---", `ขาเข้า: ${t3} token`, `คำตอบ: ${a3}`,
];
const EXAMPLE = [...STEP1, ...STEP2(40, 900, 60, "ไม่มีข้อมูลครับ", `ราคา ${p("P001").price} บาทครับ`, `ราคา ${p("P001").price} บาท\nครับ`)].join("\n");

describe("เกณฑ์ตรวจบท 018 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และรับราคาแบบมีจุลภาคกับคำตอบหลายบรรทัด", () => {
    expect(() => check(run(EXAMPLE))).not.toThrow();
    expect(() => checks["example.google"].check(run(EXAMPLE))).not.toThrow();
    expect(() => check(run(EXAMPLE.replace(/\n/g, "\r\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อบรรทัดสินค้า 3 บรรทัดแรกไม่ตรงข้อมูลร้าน หรือไม่มี ... (อีก 21 บรรทัด)", () => {
    expect(() => check(run(EXAMPLE.replace(line("P002"), "P002 อื่น")))).toThrow(/บรรทัดที่ 2/);
    expect(() => check(run(EXAMPLE.replace("... (อีก 21 บรรทัด)", "... (อีก 20 บรรทัด)")))).toThrow(/อีก 21/);
  });
  it("ไม่ผ่านเมื่อความยาวทุกชิ้นไม่มากกว่าเฉพาะที่ค้นเจอ หรือตัวเลขไม่ใช่จำนวนเต็ม", () => {
    expect(() => check(run(EXAMPLE.replace("ยาว 1234 ตัวอักษร", "ยาว 48 ตัวอักษร")))).toThrow(/มากกว่า/);
    expect(() => check(run(EXAMPLE.replace("ยาว 1234 ตัวอักษร", "ยาว undefined ตัวอักษร")))).toThrow();
  });
  it("ไม่ผ่านเมื่อส่วนจำลองผิด", () => {
    expect(() => check(run(EXAMPLE.replace("เหลือ 10 บรรทัด", "เหลือ 9 บรรทัด")))).toThrow(/ส่วนจำลอง/);
    expect(() => check(run(EXAMPLE.replace(`บรรทัดแรกที่เหลือ: ${line("P016")}`, `บรรทัดแรกที่เหลือ: ${line("P015")}`)))).toThrow(/ส่วนจำลอง/);
    expect(() => check(run(EXAMPLE.replace("ข้อมูล P001 ยังอยู่ไหม: ไม่อยู่", "ข้อมูล P001 ยังอยู่ไหม: อยู่")))).toThrow(/ส่วนจำลอง/);
  });
  it("ไม่ผ่านเมื่อไม่มี token ขาเข้า เป็น 0 หรือแบบที่ 2 ไม่มากกว่าแบบที่ 3", () => {
    expect(() => check(run(EXAMPLE.replace("ขาเข้า: 40 token", "ขาเข้า: ไม่มี token")))).toThrow();
    expect(() => check(run(EXAMPLE.replace("ขาเข้า: 40 token", "ขาเข้า: 0 token")))).toThrow(/มากกว่า 0/);
    expect(() => check(run(EXAMPLE.replace("ขาเข้า: 900 token", "ขาเข้า: 60 token")))).toThrow(/แบบที่ 2/);
  });
  it("ไม่ผ่านเมื่อคำตอบแบบที่ 2 หรือ 3 ไม่มีราคา หรือแบบที่ 1 ไม่ใช่ไทย", () => {
    expect(() => check(run(EXAMPLE.replace(`คำตอบ: ราคา ${p("P001").price} บาทครับ`, "คำตอบ: ไม่ทราบครับ")))).toThrow(/แบบที่ 2/);
    expect(() => check(run(EXAMPLE.replace(`คำตอบ: ราคา ${p("P001").price} บาท\nครับ`, "คำตอบ: ไม่ทราบครับ")))).toThrow(/แบบที่ 3/);
    expect(() => check(run(EXAMPLE.replace("คำตอบ: ไม่มีข้อมูลครับ", "คำตอบ: unknown")))).toThrow(/ไทย/);
    expect(() => check(run(EXAMPLE.replace("คำตอบ: ไม่มีข้อมูลครับ", "คำตอบ: undefined")))).toThrow();
  });
  it("ไม่ผ่านเมื่อ exit code ไม่ใช่ 0", () => {
    expect(() => check({ ...run(EXAMPLE), exitCode: 1 })).toThrow();
  });
  it("รับราคาแบบมีจุลภาค (คำนวณราคาจากข้อมูลร้าน)", () => {
    const expensive = listProducts().find((x) => x.price >= 1000);
    expect(expensive).toBeDefined();
    expect((expensive?.price ?? 0).toLocaleString("en-US")).toContain(",");
  });
});

const detail1 = `${line("P012")} หมด`;
const detail2 = `${line("P018")} เหลือ ${p("P018").stock} ชิ้น`;
const GOOD1 = [
  `ตรวจตัวอย่าง: ${detail1}`, `ตรวจตัวอย่าง: ${detail2}`,
  "--- คำถามที่ 1 ---", "เครื่องบดกาแฟไฟฟ้าหมดครับ",
  "--- คำถามที่ 2 ---", `เหลือ ${p("P018").stock} ใบครับ`,
].join("\n");

describe("เกณฑ์ตรวจบท 018 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  it("ผ่านเมื่อครบ (รับราคา P012 แบบมีจุลภาค)", () => {
    expect(() => check(run(GOOD1))).not.toThrow();
    expect(() => checks["exercise-1.google"].check(run(GOOD1))).not.toThrow();
    const comma = GOOD1.replace(`ราคา ${p("P012").price} บาท`, `ราคา ${p("P012").price.toLocaleString("en-US")} บาท`);
    expect(() => check(run(comma))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม detailLine (ดูบรรทัดที่มี 👉)"))).toThrow();
  });
  it("ไม่ผ่านเมื่อ detailLine คืนค่าคงที่ (หมดทุกชิ้น หรือเหลือทุกชิ้น)", () => {
    const alwaysOut = GOOD1.replace(detail2, `${line("P018")} หมด`);
    expect(() => check(run(alwaysOut))).toThrow(/ตรวจตัวอย่าง บรรทัดที่ 2/);
    const alwaysIn = GOOD1.replace(detail1, `${line("P012")} เหลือ 15 ชิ้น`);
    expect(() => check(run(alwaysIn))).toThrow();
  });
  it("ไม่ผ่านเมื่อบรรทัดไม่มีราคา รหัส หรือสต็อก หรือมี undefined", () => {
    expect(() => check(run(GOOD1.replace(`ราคา ${p("P012").price} บาท `, "")))).toThrow(/ราคา/);
    expect(() => check(run(GOOD1.replace("P018", "P0xx")))).toThrow(/P018/);
    expect(() => check(run(GOOD1.replace(`เหลือ ${p("P018").stock} ชิ้น`, "เหลือ undefined ชิ้น")))).toThrow();
  });
  it("ไม่ผ่านเมื่อคำตอบที่ 1 ไม่บอกว่าของหมด หรือคำตอบที่ 2 ไม่มีสต็อก", () => {
    expect(() => check(run(GOOD1.replace("เครื่องบดกาแฟไฟฟ้าหมดครับ", "มีของครับ")))).toThrow(/ของหมด/);
    expect(() => check(run(GOOD1.replace(`เหลือ ${p("P018").stock} ใบครับ`, "เหลือหลายใบครับ")))).toThrow(/คำถามที่ 2/);
    expect(() => check(run(GOOD1.replace("เครื่องบดกาแฟไฟฟ้าหมดครับ", "")))).toThrow();
  });
});

const lines = listProducts().map((x) => `${x.id} ${x.name} ราคา ${x.price} บาท`);
const fit = expectedFit(lines, 300);
const GOOD2 = [
  "ตรวจตัวอย่าง: งบ 4 ตัวอักษร ได้ 1 บรรทัด",
  `ส่งข้อมูล ${fit.count} จาก 24 บรรทัด (${fit.chars} ตัวอักษร)`,
  "--- คำถามที่ 1 ---", `ราคา ${p("P001").price} บาทครับ`,
  "--- คำถามที่ 2 ---", "ไม่มีข้อมูลครับ",
].join("\n");

describe("expectedFit", () => {
  it("เก็บจากต้นตราบที่ยาวไม่เกินงบ นับทีละตัวอักษร", () => {
    expect(expectedFit(["กขค", "งจฉ"], 4)).toEqual({ count: 1, chars: 3 });
    expect(expectedFit(["กขค", "งจฉ"], 7)).toEqual({ count: 2, chars: 7 });
    expect(expectedFit(["กขค", "งจฉ"], 2)).toEqual({ count: 0, chars: 0 });
    expect(fit.count).toBeGreaterThan(1);
    expect(fit.count).toBeLessThan(24);
  });
});

describe("เกณฑ์ตรวจบท 018 (exercise-2)", () => {
  const check = checks["exercise-2.ollama"].check;
  it("ผ่านเมื่อครบ", () => {
    expect(() => check(run(GOOD2))).not.toThrow();
    expect(() => checks["exercise-2.google"].check(run(GOOD2))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม หรือไม่มีบรรทัดตรวจตัวอย่าง", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม fitBudget (ดูบรรทัดที่มี 👉)"))).toThrow();
    expect(() => check(run(GOOD2.replace("ได้ 1 บรรทัด", "ได้ 2 บรรทัด")))).toThrow(/ตรวจตัวอย่าง/);
  });
  it("ไม่ผ่านเมื่อ fitBudget ไม่ตัด (ส่งทั้ง 24 บรรทัด) หรือคืนค่าคงที่ (1 บรรทัด)", () => {
    expect(() => check(run(GOOD2.replace(/ส่งข้อมูล .*/, "ส่งข้อมูล 24 จาก 24 บรรทัด (1200 ตัวอักษร)")))).toThrow();
    expect(() => check(run(GOOD2.replace(/ส่งข้อมูล .*/, `ส่งข้อมูล 1 จาก 24 บรรทัด (${[...lines[0]].length} ตัวอักษร)`)))).toThrow(/ควรได้/);
  });
  it("ไม่ผ่านเมื่อเกินงบหรือ M ไม่ตรง", () => {
    expect(() => check(run(GOOD2.replace(/ส่งข้อมูล .*/, `ส่งข้อมูล ${fit.count} จาก 24 บรรทัด (301 ตัวอักษร)`)))).toThrow(/เกินงบ/);
    expect(() => check(run(GOOD2.replace(/ส่งข้อมูล .*/, `ส่งข้อมูล ${fit.count} จาก 24 บรรทัด (${fit.chars - 1} ตัวอักษร)`)))).toThrow(/ไม่ตรง/);
  });
  it("ไม่ผ่านเมื่อคำตอบที่ 1 ไม่มีราคา หรือคำตอบที่ 2 ไม่บอกว่าไม่มีข้อมูล", () => {
    expect(() => check(run(GOOD2.replace(`ราคา ${p("P001").price} บาทครับ`, "ไม่ทราบครับ")))).toThrow(/คำถามที่ 1/);
    expect(() => check(run(GOOD2.replace("ไม่มีข้อมูลครับ", "ราคา 350 บาทครับ")))).toThrow(/ไม่มีข้อมูล/);
    expect(() => check(run(GOOD2.replace("ไม่มีข้อมูลครับ", "undefined")))).toThrow();
  });
});
