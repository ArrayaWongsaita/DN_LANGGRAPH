import { describe, expect, it } from "vitest";
import { getOrder } from "../../src/shop/orders";
import { searchProducts } from "../../src/shop/products";
import { ORDER_STATUS_LABELS } from "../../src/shop/types";
import checks, { expectedStatusLine, expectNoStatusLeak, QUESTIONS } from "../checks/020";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "020", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

// จำนวนสินค้าคำนวณจาก src/shop เหมือนเกณฑ์จริง ไม่ฝังตัวเลขในเทสต์
const DRIP = searchProducts({ keyword: "ดริป", maxPrice: 200 }).length;
const DRINKWARE = searchProducts({ category: "drinkware" }).length;
const Q1_FILTER = '{"keyword":"คั่วเข้ม","maxPrice":400}';
const Q2_FILTER = '{"category":"drinkware"}';
const count = (json: string): number => searchProducts(JSON.parse(json) as Parameters<typeof searchProducts>[0]).length;

const STEP1 = [
  "--- ขั้นที่ 1: ตรวจ JSON ด้วย zod (ข้อความตายตัว) ---",
  'ข้อความที่ 1: {"keyword":"ดริป","maxPrice":200}',
  "JSON.parse ตรงๆ: ผ่าน",
  'zod: ผ่าน {"keyword":"ดริป","maxPrice":200}',
  `เจอสินค้า: ${DRIP} ชิ้น`,
  "ข้อความที่ 2: ```json {\"category\":\"drinkware\"} ```",
  "JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)",
  "แกะเอาเฉพาะ {...} แล้ว: ผ่าน",
  `zod: ผ่าน ${Q2_FILTER}`,
  `เจอสินค้า: ${DRINKWARE} ชิ้น`,
  'ข้อความที่ 3: {"keyword":"แก้ว","maxPrice":"300"}',
  "JSON.parse ตรงๆ: ผ่าน",
  "zod: ไม่ผ่าน",
  "  ✖ ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น ตัวเลข แต่ได้รับ string",
  "    → at maxPrice",
  'ข้อความที่ 4: {"keyword":null,"category":"gifts"}',
  "JSON.parse ตรงๆ: ผ่าน",
  "zod: ไม่ผ่าน",
  "  ✖ ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น string แต่ได้รับ ไม่มีค่า (null)",
  "    → at keyword",
];

const STEP2 = (x: number): string[] => [
  "--- ขั้นที่ 2: ขอ JSON จากโมเดลจริง ---",
  `--- คำถามที่ 1: ${QUESTIONS[0]} ---`,
  `คำตอบดิบ: ${Q1_FILTER}`,
  "JSON.parse ตรงๆ: ผ่าน",
  `zod: ผ่าน ${Q1_FILTER}`,
  `เจอสินค้า: ${count(Q1_FILTER)} ชิ้น`,
  `--- คำถามที่ 2: ${QUESTIONS[1]} ---`,
  `คำตอบดิบ: ${Q2_FILTER}`,
  "JSON.parse ตรงๆ: ผ่าน",
  `zod: ผ่าน ${Q2_FILTER}`,
  `เจอสินค้า: ${count(Q2_FILTER)} ชิ้น`,
  `--- คำถามที่ 3: ${QUESTIONS[2]} ---`,
  "คำตอบดิบ: ```json {\"category\":\"shoes\"} ```",
  "JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)",
  "แกะเอาเฉพาะ {...} แล้ว: ผ่าน",
  "zod: ไม่ผ่าน",
  "  ✖ ตัวเลือกไม่ถูกต้อง: ควรเป็นหนึ่งใน \"beans\"|…",
  "    → at category",
  `สรุป: zod ผ่าน ${x}/3`,
];
const EXAMPLE = [...STEP1, ...STEP2(2)].join("\n");

// คำถามข้อ 3 ที่โมเดลตอบเป็นข้อความล้วน: JSON.parse ไม่ผ่านทั้งสองทาง จึงไม่มีบรรทัด zod: เลย
const STEP2_PROSE = [
  "--- ขั้นที่ 2: ขอ JSON จากโมเดลจริง ---",
  `--- คำถามที่ 1: ${QUESTIONS[0]} ---`,
  `คำตอบดิบ: ${Q1_FILTER}`,
  "JSON.parse ตรงๆ: ผ่าน",
  `zod: ผ่าน ${Q1_FILTER}`,
  `เจอสินค้า: ${count(Q1_FILTER)} ชิ้น`,
  `--- คำถามที่ 2: ${QUESTIONS[1]} ---`,
  `คำตอบดิบ: ${Q2_FILTER}`,
  "JSON.parse ตรงๆ: ผ่าน",
  `zod: ผ่าน ${Q2_FILTER}`,
  `เจอสินค้า: ${count(Q2_FILTER)} ชิ้น`,
  `--- คำถามที่ 3: ${QUESTIONS[2]} ---`,
  "คำตอบดิบ: ขออภัยครับ ผมขอตอบเป็นข้อความธรรมดา ไม่ได้ให้ JSON",
  "JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)",
  "แกะเอาเฉพาะ {...} แล้ว: ไม่ผ่าน",
  "สรุป: zod ผ่าน 2/3",
];
const EXAMPLE_PROSE = [...STEP1, ...STEP2_PROSE].join("\n");

describe("เกณฑ์ตรวจบท 020 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และรับ CRLF", () => {
    expect(() => check(run(EXAMPLE))).not.toThrow();
    expect(() => checks["example.google"].check(run(EXAMPLE))).not.toThrow();
    expect(() => check(run(EXAMPLE.replace(/\n/g, "\r\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 จำนวนสินค้าไม่ตรงกับ searchProducts ของ JSON ที่พิมพ์", () => {
    expect(() => check(run(EXAMPLE.replace(`เจอสินค้า: ${DRIP} ชิ้น`, `เจอสินค้า: ${DRIP + 1} ชิ้น`)))).toThrow();
    expect(() => check(run(EXAMPLE.replace(`เจอสินค้า: ${DRINKWARE} ชิ้น`, `เจอสินค้า: ${DRINKWARE - 1} ชิ้น`)))).toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 ไม่ได้พิสูจน์ว่า JSON ที่ถูกห่อด้วย code fence ต้องแกะก่อน", () => {
    expect(() => check(run(EXAMPLE.replace("JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)", "JSON.parse ตรงๆ: ผ่าน")))).toThrow();
    expect(() => check(run(EXAMPLE.replace("แกะเอาเฉพาะ {...} แล้ว: ผ่าน", "แกะเอาเฉพาะ {...} แล้ว: ไม่ผ่าน")))).toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 ไม่ได้รายงาน type ผิดหรือ null ตามที่ต้องได้", () => {
    expect(() => check(run(EXAMPLE.replace("→ at maxPrice", "→ at keyword")))).toThrow(/maxPrice/);
    expect(() => check(run(EXAMPLE.replace("ไม่มีค่า (null)", "ไม่มีค่า")))).toThrow();
  });
  it("ไม่ผ่านเมื่อจำนวนสินค้าของขั้นที่ 2 ไม่ตรงกับ JSON ที่พิมพ์", () => {
    expect(() => check(run(EXAMPLE.replace(`เจอสินค้า: ${count(Q1_FILTER)} ชิ้น`, `เจอสินค้า: ${count(Q1_FILTER) + 1} ชิ้น`)))).toThrow(/ไม่ตรงกับ JSON/);
  });
  it("ไม่ผ่านเมื่อสรุปไม่ตรงกับจำนวนบรรทัด zod: ผ่าน หรือผ่านน้อยกว่า 2", () => {
    expect(() => check(run(EXAMPLE.replace("สรุป: zod ผ่าน 2/3", "สรุป: zod ผ่าน 3/3")))).toThrow(/ไม่ตรงกับจำนวน/);
    const onePass = EXAMPLE
      .replace(`zod: ผ่าน ${Q1_FILTER}\nเจอสินค้า: ${count(Q1_FILTER)} ชิ้น`, "zod: ไม่ผ่าน\n  ✖ ตัวเลือกไม่ถูกต้อง\n    → at category")
      .replace("สรุป: zod ผ่าน 2/3", "สรุป: zod ผ่าน 1/3");
    expect(() => check(run(onePass))).toThrow(/อย่างน้อย 2/);
  });
  it("ผ่านเมื่อข้อหนึ่งโมเดลตอบเป็นข้อความล้วน (JSON.parse ไม่ผ่านทั้งสองทาง จึงไม่มีบรรทัด zod:)", () => {
    expect(() => check(run(EXAMPLE_PROSE))).not.toThrow();
    expect(() => checks["example.google"].check(run(EXAMPLE_PROSE))).not.toThrow();
    // ไม่Blanket: ถ้าไม่มีทั้งบรรทัด zod: และบรรทัดที่บอกว่าแปลง JSON ไม่ผ่าน ยังต้องล้ม
    const silent = EXAMPLE_PROSE.replace("JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)\nแกะเอาเฉพาะ {...} แล้ว: ไม่ผ่าน\n", "");
    expect(() => check(run(silent))).toThrow(/อย่างใดอย่างหนึ่ง/);
  });
  it("ไม่ผ่านเมื่อไม่มีหัวข้อคำถามตามลำดับ หรือ exit code ไม่ใช่ 0", () => {
    expect(() => check(run(EXAMPLE.replace(`--- คำถามที่ 2: ${QUESTIONS[1]} ---`, "--- คำถามที่ 2 ---")))).toThrow();
    expect(() => check({ ...run(EXAMPLE), exitCode: 1 })).toThrow();
  });
});

const ORDER_SAMPLES = [
  'ตรวจตัวอย่าง: {"action":"cancel","orderId":"O1002"} → ผ่าน',
  'ตรวจตัวอย่าง: {"action":"delete","orderId":"O1002"} → ไม่ผ่าน',
  'ตรวจตัวอย่าง: {"action":"cancel","orderId":"1002"} → ไม่ผ่าน',
];
const status = (id: string): string => `สถานะ: ${expectedStatusLine(id)}`;
const GOOD1 = [
  ...ORDER_SAMPLES,
  "--- คำถามที่ 1: ขอยกเลิกคำสั่งซื้อ O1003 เพราะสั่งผิด ---",
  'คำตอบดิบ: {"action":"cancel","orderId":"O1003","reason":"สั่งผิด"}',
  'zod: ผ่าน {"action":"cancel","orderId":"O1003","reason":"สั่งผิด"}',
  status("O1003"),
  "--- คำถามที่ 2: คำสั่งซื้อ O1002 ถึงไหนแล้ว ---",
  'คำตอบดิบ: {"action":"status","orderId":"O1002"}',
  'zod: ผ่าน {"action":"status","orderId":"O1002"}',
  status("O1002"),
  "--- คำถามที่ 3: ขอคืนเงิน O1001 ของแตก ---",
  'คำตอบดิบ: {"action":"refund","orderId":"O1001","reason":"ของแตก"}',
  "zod: ไม่ผ่าน",
  "  ✖ ตัวเลือกไม่ถูกต้อง: ควรเป็นหนึ่งใน \"cancel\"|…",
  "    → at action",
  "สรุป: zod ผ่าน 2/3",
].join("\n");

describe("เกณฑ์ตรวจบท 020 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider", () => {
    expect(() => check(run(GOOD1))).not.toThrow();
    expect(() => checks["exercise-1.google"].check(run(GOOD1))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม buildSchema (ดูบรรทัดที่มี 👉)"))).toThrow();
  });
  it("ไม่ผ่านเมื่อบรรทัด ตรวจตัวอย่าง เป็นคำตอบคงที่ (ผ่านทั้ง 3 ข้อ หรือ ไม่ผ่านทั้ง 3 ข้อ)", () => {
    expect(() => check(run(GOOD1.replace('{"action":"delete","orderId":"O1002"} → ไม่ผ่าน', '{"action":"delete","orderId":"O1002"} → ผ่าน')))).toThrow(/ตรวจตัวอย่าง/);
    expect(() => check(run(GOOD1.replace('{"action":"cancel","orderId":"1002"} → ไม่ผ่าน', '{"action":"cancel","orderId":"1002"} → ผ่าน')))).toThrow(/ตรวจตัวอย่าง/);
  });
  it("ไม่ผ่านเมื่อ action หรือ orderId ของข้อที่ผ่านไม่ตรงตามลำดับข้อ", () => {
    expect(() => check(run(GOOD1.replace('zod: ผ่าน {"action":"status","orderId":"O1002"}', 'zod: ผ่าน {"action":"cancel","orderId":"O1002"}')))).toThrow(/คำถามที่ 2/);
    expect(() => check(run(GOOD1.replace('zod: ผ่าน {"action":"status","orderId":"O1002"}', 'zod: ผ่าน {"action":"status","orderId":"O1003"}')))).toThrow(/คำถามที่ 2/);
  });
  it("ไม่ผ่านเมื่อสถานะไม่ตรงกับ getOrder หรือสรุปไม่ตรงกับจำนวนบรรทัด zod: ผ่าน", () => {
    expect(() => check(run(GOOD1.replace(status("O1002"), `สถานะ: ${ORDER_STATUS_LABELS.pending}`)))).toThrow(/ต้องพิมพ์/);
    expect(() => check(run(GOOD1.replace("สรุป: zod ผ่าน 2/3", "สรุป: zod ผ่าน 3/3")))).toThrow(/ไม่ตรงกับจำนวน/);
  });
  it("คำสั่งซื้อของลูกค้าคนอื่นต้องได้ข้อความไม่พบ และห้ามพิมพ์สถานะจริง", () => {
    expect(getOrder("O1004", "C001")).toBeUndefined();
    expect(expectedStatusLine("O1004")).toBe("ไม่พบคำสั่งซื้อ O1004 ของลูกค้ารายนี้");
    expect(expectedStatusLine("O1003")).toBe(ORDER_STATUS_LABELS.paid);
    const leak = 'zod: ผ่าน {"action":"status","orderId":"O1004"}\nสถานะ: รอชำระเงิน';
    expect(() => expectNoStatusLeak(leak, "x")).toThrow(/ไม่พบคำสั่งซื้อ O1004/);
    expect(() => expectNoStatusLeak('zod: ผ่าน {"action":"status","orderId":"O1004"}\nสถานะ: ไม่พบคำสั่งซื้อ O1004 ของลูกค้ารายนี้', "x")).not.toThrow();
  });
});

const OPTIONS_OLLAMA = '{"format":"json"}';
const OPTIONS_GOOGLE = '{"responseMimeType":"application/json"}';
const GOOD2 = (options: string): string => [
  `ตรวจตัวอย่าง: ตัวเลือกที่เพิ่ม ${options}`,
  `--- คำถามที่ 1: ${QUESTIONS[0]} ---`,
  `คำตอบดิบ: ${Q1_FILTER}`,
  "JSON.parse ตรงๆ: ผ่าน",
  `zod: ผ่าน ${Q1_FILTER}`,
  `เจอสินค้า: ${count(Q1_FILTER)} ชิ้น`,
  `--- คำถามที่ 2: ${QUESTIONS[1]} ---`,
  `คำตอบดิบ: ${Q2_FILTER}`,
  "JSON.parse ตรงๆ: ผ่าน",
  `zod: ผ่าน ${Q2_FILTER}`,
  `เจอสินค้า: ${count(Q2_FILTER)} ชิ้น`,
  `--- คำถามที่ 3: ${QUESTIONS[2]} ---`,
  'คำตอบดิบ: {"keyword":"ของขวัญ","maxPrice":800}',
  "JSON.parse ตรงๆ: ผ่าน",
  'zod: ผ่าน {"keyword":"ของขวัญ","maxPrice":800}',
  `เจอสินค้า: ${count('{"keyword":"ของขวัญ","maxPrice":800}')} ชิ้น`,
  "JSON.parse ตรงๆ ผ่าน: 3/3",
  "zod ผ่าน: 3/3",
].join("\n");

describe("เกณฑ์ตรวจบท 020 (exercise-2)", () => {
  it("ผ่านเมื่อครบ ทั้งคู่ provider", () => {
    expect(() => checks["exercise-2.ollama"].check(run(GOOD2(OPTIONS_OLLAMA)))).not.toThrow();
    expect(() => checks["exercise-2.google"].check(run(GOOD2(OPTIONS_GOOGLE)))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม หรือตัวเลือกไม่ตรงกับ JSON mode ของ provider", () => {
    expect(() => checks["exercise-2.ollama"].check(run("👉 ยังไม่ได้เติม jsonModeOptions (ดูบรรทัดที่มี 👉)"))).toThrow();
    expect(() => checks["exercise-2.ollama"].check(run(GOOD2("{}")))).toThrow(/ตัวเลือกที่เพิ่ม/);
    expect(() => checks["exercise-2.google"].check(run(GOOD2(OPTIONS_OLLAMA)))).toThrow(/ตัวเลือกที่เพิ่ม/);
  });
  it("ไม่ผ่านเมื่อ JSON.parse ตรงๆ ไม่ครบ 3 หรือไม่ตรงกับบรรทัดที่นับเอง", () => {
    expect(() => checks["exercise-2.ollama"].check(run(GOOD2(OPTIONS_OLLAMA).replace("JSON.parse ตรงๆ ผ่าน: 3/3", "JSON.parse ตรงๆ ผ่าน: 2/3")))).toThrow(/3\/3/);
    expect(() => checks["exercise-2.ollama"].check(run(GOOD2(OPTIONS_OLLAMA).replace("JSON.parse ตรงๆ: ผ่าน\nzod: ผ่าน", "JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)\nzod: ผ่าน")))).toThrow(/ไม่ตรงกับจำนวน/);
  });
  it("ไม่ผ่านเมื่อ zod ผ่านไม่ตรงกับบรรทัดที่นับเอง หรือผ่านน้อยกว่า 2", () => {
    const mismatch = GOOD2(OPTIONS_OLLAMA).replace("zod ผ่าน: 3/3", "zod ผ่าน: 2/3");
    expect(() => checks["exercise-2.ollama"].check(run(mismatch))).toThrow(/ไม่ตรงกับจำนวน/);
    const low = GOOD2(OPTIONS_OLLAMA).replace("zod ผ่าน: 3/3", "zod ผ่าน: 1/3");
    expect(() => checks["exercise-2.ollama"].check(run(low))).toThrow(/อย่างน้อย 2/);
  });
  it("ไม่ผ่านเมื่อจำนวนสินค้าไม่ตรงกับ JSON ที่พิมพ์", () => {
    expect(() => checks["exercise-2.ollama"].check(run(GOOD2(OPTIONS_OLLAMA).replace(`เจอสินค้า: ${count(Q2_FILTER)} ชิ้น`, `เจอสินค้า: ${count(Q2_FILTER) + 1} ชิ้น`)))).toThrow(/ไม่ตรงกับ JSON/);
  });
});
