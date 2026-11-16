import { describe, expect, it } from "vitest";
import { getOrder, orderTotal } from "../../src/shop/orders";
import { ORDER_STATUS_LABELS } from "../../src/shop/types";
import checks, { expectedOrderContext, expectedStatusLine, expectNoStatusLeak, extractReplies } from "../checks/022";
import type { RunResult } from "./types";

function run(stdout: string): RunResult {
  return {
    lesson: "022", file: "x", provider: "opencode-dev", attempt: 1, env: {}, stdout, stderr: "",
    exitCode: 0, timedOut: false, durationMs: 1, usage: null,
  };
}

interface Item {
  n: number;
  category: string;
  orderId: string;
  urgent: string;
  summary: string;
}

const ITEMS: readonly Item[] = [
  { n: 1, category: "product", orderId: "-", urgent: "ไม่", summary: "ลูกค้าถามหาเมล็ดกาแฟคั่วอ่อน" },
  { n: 2, category: "order", orderId: "O1002", urgent: "ใช่", summary: "ลูกค้าถามสถานะ O1002 และรอนาน" },
  { n: 3, category: "policy", orderId: "-", urgent: "ไม่", summary: "ลูกค้าถามระยะเวลาส่งต่างจังหวัด" },
  { n: 4, category: "order", orderId: "O1003", urgent: "ไม่", summary: "ลูกค้าขอยกเลิก O1003" },
  { n: 5, category: "other", orderId: "-", urgent: "ไม่", summary: "ลูกค้าถามร้านอาหารนอกขอบเขต" },
  { n: 6, category: "product", orderId: "-", urgent: "ไม่", summary: "ลูกค้าถามราคาแก้วมัค" },
];
const COUNTS = "product 2 · order 2 · policy 1 · other 1";

const step1 = (): string[] => [
  "--- ขั้นที่ 1: args ที่โมเดลอาจส่งมา (ข้อมูลปลอม) ---",
  'args ที่ 1: {"category":"order","keywords":[],"orderId":"O1002","urgent":true,"summary":"ถามสถานะคำสั่งซื้อ"}',
  "  ผ่าน → ประเภท order",
  'args ที่ 2: {"category":"shipping","keywords":[],"urgent":false,"summary":"ถามค่าส่ง"}',
  "  ไม่ผ่าน",
  '  ✖ ตัวเลือกไม่ถูกต้อง: ควรเป็นหนึ่งใน "product"|"order"|"policy"|"other"',
  "    → at category",
  'args ที่ 3: {"category":"product","keywords":["แก้ว"],"summary":"ถามเรื่องแก้ว"}',
  "  ไม่ผ่าน",
  "  ✖ ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น boolean แต่ได้รับ undefined",
  "    → at urgent",
];

const itemLine = (item: Item): string =>
  `ข้อ ${item.n}: ${item.category} | orderId: ${item.orderId} | ด่วน: ${item.urgent} | ${item.summary}`;

const EXAMPLE = (): string => [
  ...step1(),
  "--- ขั้นที่ 2: แยกประเภทคำถามจริง 6 ข้อ (includeRaw) ---",
  ...ITEMS.map((item) => itemLine(item)),
  `  ${expectedStatusLine("O1002")}`,
  `  ${expectedStatusLine("O1003")}`,
  "แปลงสำเร็จ: 6/6",
  `นับตามประเภท: ${COUNTS}`,
].join("\n");

describe("เกณฑ์ตรวจบท 022 (example)", () => {
  const check = checks["example.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และรับ CRLF", () => {
    expect(() => check(run(EXAMPLE()))).not.toThrow();
    expect(() => checks["example.google"].check(run(EXAMPLE()))).not.toThrow();
    expect(() => check(run(EXAMPLE().replace(/\n/g, "\r\n")))).not.toThrow();
  });
  it("ผ่านเมื่อมีข้อแปลงไม่สำเร็จ 1 ข้อ (พิมพ์คำตอบดิบแล้วเดินต่อ ไม่ throw ทั้งไฟล์)", () => {
    const partial = EXAMPLE()
      .replace(itemLine(ITEMS[4]), "ข้อ 5: แปลงไม่สำเร็จ\n  คำตอบดิบ: {\"category\":\"food\"}")
      .replace("แปลงสำเร็จ: 6/6", "แปลงสำเร็จ: 5/6")
      .replace(COUNTS, "product 2 · order 2 · policy 1 · other 0");
    expect(() => check(run(partial))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อขั้นที่ 1 ไม่ได้พิสูจน์ enum ผิด หรือขาด field ที่บังคับ", () => {
    expect(() => check(run(EXAMPLE().replace("ผ่าน → ประเภท order", "ไม่ผ่าน")))).toThrow(/args ที่ 1/);
    expect(() => check(run(EXAMPLE().replace("→ at category", "→ at field")))).toThrow(/category/);
    expect(() => check(run(EXAMPLE().replace("→ at urgent", "→ at summary")))).toThrow(/urgent/);
  });
  it("ไม่ผ่านเมื่อขาดบรรทัดสำคัญของขั้นที่ 2 (สถานะของ O1002)", () => {
    const noStatus = EXAMPLE().replace(`  ${expectedStatusLine("O1002")}\n`, "");
    expect(() => check(run(noStatus))).toThrow(/O1002/);
    expect(() => check(run(EXAMPLE().replace(/^นับตามประเภท: .*$/m, "")))).toThrow(/นับตามประเภท/);
  });
  it("ไม่ผ่านเมื่อสรุปไม่ตรงกับจำนวนบรรทัดของแต่ละข้อ หรือผลรวมใน นับตามประเภท ไม่เท่ากับ N", () => {
    expect(() => check(run(EXAMPLE().replace("แปลงสำเร็จ: 6/6", "แปลงสำเร็จ: 5/6")))).toThrow(/ไม่ตรงกับจำนวนบรรทัด/);
    expect(() => check(run(EXAMPLE().replace(COUNTS, "product 2 · order 1 · policy 1 · other 1")))).toThrow(/ไม่ตรงกับแปลงสำเร็จ/);
    expect(() => check(run(EXAMPLE().replace("แปลงสำเร็จ: 6/6", "แปลงสำเร็จ: 4/6")))).toThrow(/อย่างน้อย 5/);
  });
  it("ไม่ผ่านเมื่อข้อ 2 ไม่ใช่ order O1002 หรือพิมพ์สถานะของลูกค้าคนอื่น", () => {
    expect(() => check(run(EXAMPLE().replace(itemLine(ITEMS[1]), itemLine({ ...ITEMS[1], orderId: "O1004" }))))).toThrow(/ข้อ 2/);
    const leak = EXAMPLE().replace(`  ${expectedStatusLine("O1003")}`, `  สถานะคำสั่งซื้อ O1004: ${ORDER_STATUS_LABELS.pending}`);
    expect(() => check(run(leak))).toThrow(/O1004/);
    expect(() => check({ ...run(EXAMPLE()), exitCode: 1 })).toThrow(/exit code/);
  });
});

describe("เกณฑ์ตรวจบท 022 (กันสถานะของคำสั่งซื้อคนอื่นหลุด)", () => {
  it("expectedStatusLine คำนวณจาก getOrder(id, C001) เท่านั้น", () => {
    expect(getOrder("O1004", "C001")).toBeUndefined();
    expect(expectedStatusLine("O1004")).toBe("ไม่พบคำสั่งซื้อ O1004 ของลูกค้ารายนี้");
    expect(expectedStatusLine("O1002")).toBe(`สถานะคำสั่งซื้อ O1002: ${ORDER_STATUS_LABELS.shipped}`);
  });
  it("expectNoStatusLeak ปฏิเสธสถานะจริงของ O1004 และรับข้อความ ไม่พบ", () => {
    expect(() => expectNoStatusLeak(`สถานะคำสั่งซื้อ O1004: ${ORDER_STATUS_LABELS.pending}`, "x")).toThrow(/O1004/);
    expect(() => expectNoStatusLeak("ไม่พบคำสั่งซื้อ O1004 ของลูกค้ารายนี้", "x")).not.toThrow();
    expect(() => expectNoStatusLeak("ไม่พบคำสั่งซื้อ O1002 ของลูกค้ารายนี้", "x")).toThrow(/ต้องพิมพ์สถานะ/);
  });
});

const GOOD1 = (): string => [
  "ตรวจตัวอย่าง 1: ไม่ได้เรียกเครื่องมือ ตอบเป็นข้อความ: ขอโทษครับ ผมไม่แน่ใจ",
  "ตรวจตัวอย่าง 2: args ไม่ตรง schema: ✖ ตัวเลือกไม่ถูกต้อง: ควรเป็นหนึ่งใน \"product\"|… → at category",
  "ข้อ 1: product",
  "ข้อ 2: แปลงไม่สำเร็จ",
  "  เหตุที่ไม่ผ่าน: args ไม่ตรง schema: ✖ เกินกำหนด: string ควรมีไม่เกิน 15 ตัวอักษร → at summary",
  "ข้อ 3: policy",
  "ข้อ 4: order",
  "ข้อ 5: other",
  "ข้อ 6: แปลงไม่สำเร็จ",
  "  เหตุที่ไม่ผ่าน: args ไม่ตรง schema: ✖ ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น boolean แต่ได้รับ undefined → at urgent",
  "แปลงสำเร็จ: 4/6",
].join("\n");

describe("เกณฑ์ตรวจบท 022 (exercise-1)", () => {
  const check = checks["exercise-1.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และรับ CRLF", () => {
    expect(() => check(run(GOOD1()))).not.toThrow();
    expect(() => checks["exercise-1.google"].check(run(GOOD1()))).not.toThrow();
    expect(() => check(run(GOOD1().replace(/\n/g, "\r\n")))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม describeFailure (ดูบรรทัดที่มี 👉)"))).toThrow();
  });
  it("ไม่ผ่านเมื่อบรรทัด ตรวจตัวอย่าง อธิบายผิดกรณี", () => {
    expect(() => check(run(GOOD1().replace("ไม่ได้เรียกเครื่องมือ ตอบเป็นข้อความ", "args ไม่ตรง schema")))).toThrow(/ตรวจตัวอย่าง 1/);
    expect(() => check(run(GOOD1().replace("→ at category", "→ at urgent")))).toThrow(/category/);
  });
  it("ไม่ผ่านเมื่อข้อที่ล้มเหลวไม่มีเหตุผล หรือจำนวนบรรทัด เหตุที่ไม่ผ่าน ไม่ตรงกับ 6 - N", () => {
    const empty = GOOD1().replace("  เหตุที่ไม่ผ่าน: args ไม่ตรง schema: ✖ เกินกำหนด: string ควรมีไม่เกิน 15 ตัวอักษร → at summary", "  เหตุที่ไม่ผ่าน:");
    expect(() => check(run(empty))).toThrow(/ต้องมีเหตุผล/);
    const missing = GOOD1().replace("\n  เหตุที่ไม่ผ่าน: args ไม่ตรง schema: ✖ ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น boolean แต่ได้รับ undefined → at urgent", "");
    expect(() => check(run(missing))).toThrow(/2 บรรทัด/);
  });
  it("ไม่ผ่านเมื่อสรุปไม่ตรงกับจำนวนบรรทัดของแต่ละข้อ หรือเลขข้อไม่ครบ", () => {
    expect(() => check(run(GOOD1().replace("แปลงสำเร็จ: 4/6", "แปลงสำเร็จ: 5/6")))).toThrow(/ไม่ตรงกับจำนวนบรรทัด/);
    expect(() => check(run(GOOD1().replace("ข้อ 6: แปลงไม่สำเร็จ", "ข้อ 4: แปลงไม่สำเร็จ")))).toThrow(/ข้อ 1-6/);
    expect(() => check(run(GOOD1().replace("แปลงสำเร็จ: 4/6", "แปลงสำเร็จ: 2/6")))).toThrow(/ไม่ตรงกับจำนวนบรรทัด/);
  });
  it("ไม่ผ่านเมื่อโปรแกรมล้มด้วย stack trace แทนที่จะพิมพ์เหตุผลเป็นภาษาไทย", () => {
    const crashed: RunResult = { ...run(GOOD1()), exitCode: 1, stderr: "TypeError: Cannot read properties of undefined\n    at describeFailure" };
    expect(() => check(crashed)).toThrow(/exit code 1/);
  });
});

const GOOD2 = (): string => [
  "ตรวจตัวอย่าง: ได้ผลในครั้งที่ 2",
  "ตรวจตัวอย่าง: ลองครบ 3 ครั้งแล้วยังไม่ได้",
  ...ITEMS.map((item) => `ข้อ ${item.n}: ${item.category} (ครั้งที่ 1)`),
  "แปลงสำเร็จ: 6/6",
].join("\n");

describe("เกณฑ์ตรวจบท 022 (exercise-2)", () => {
  const check = checks["exercise-2.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และผ่านเมื่อมีข้อที่ลองครบแล้วยังไม่ได้", () => {
    expect(() => check(run(GOOD2()))).not.toThrow();
    expect(() => checks["exercise-2.google"].check(run(GOOD2()))).not.toThrow();
    const partial = GOOD2()
      .replace("ข้อ 5: other (ครั้งที่ 1)", "ข้อ 5: แปลงไม่สำเร็จ (ลอง 3 ครั้ง)")
      .replace("แปลงสำเร็จ: 6/6", "แปลงสำเร็จ: 5/6");
    expect(() => check(run(partial))).not.toThrow();
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม หรือบรรทัด ตรวจตัวอย่าง เป็นคำตอบคงที่", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม classifyWithRetry (ดูบรรทัดที่มี 👉)"))).toThrow();
    const constant = GOOD2().replace("ตรวจตัวอย่าง: ลองครบ 3 ครั้งแล้วยังไม่ได้", "ตรวจตัวอย่าง: ได้ผลในครั้งที่ 2");
    expect(() => check(run(constant))).toThrow(/ตรวจตัวอย่าง/);
    expect(() => check(run(GOOD2().replace("ตรวจตัวอย่าง: ได้ผลในครั้งที่ 2", "ตรวจตัวอย่าง: ได้ผลในครั้งที่ 1")))).toThrow(/ตรวจตัวอย่าง/);
  });
  it("ไม่ผ่านเมื่อจำนวนครั้งไม่อยู่ใน 1 ถึง 3 หรือสรุปไม่ตรงกับจำนวนข้อ", () => {
    expect(() => check(run(GOOD2().replace("ข้อ 6: product (ครั้งที่ 1)", "ข้อ 6: product (ครั้งที่ 4)")))).toThrow(/1-3/);
    expect(() => check(run(GOOD2().replace("แปลงสำเร็จ: 6/6", "แปลงสำเร็จ: 5/6")))).toThrow(/ไม่ตรงกับจำนวนบรรทัด/);
    expect(() => check(run(GOOD2().replace("แปลงสำเร็จ: 6/6", "แปลงสำเร็จ: 4/6")))).toThrow(/อย่างน้อย 5/);
  });
});

const GOOD3 = (): string => [
  `ตรวจตัวอย่าง: ${expectedOrderContext("O1002")}`,
  "--- แชทบอท DN Shop รุ่นแยกประเภทได้ (พิมพ์ จบ เพื่อออก) ---",
  "คุณ: มีเมล็ดกาแฟคั่วเข้มไหม",
  "(ประเภท: product)",
  "(ข้อมูลที่ส่งให้โมเดล: P002 เมล็ดกาแฟคั่วเข้ม ดอยสะเก็ด 250 กรัม ราคา 360 บาท สต็อก 18)",
  "ผู้ช่วย: มีครับ เมล็ดกาแฟคั่วเข้ม ดอยสะเก็ด ราคา 360 บาทครับ",
  "คุณ: คำสั่งซื้อ O1002 ถึงไหนแล้ว",
  "(ประเภท: order O1002)",
  `(ข้อมูลที่ส่งให้โมเดล: ${expectedOrderContext("O1002")})`,
  "ผู้ช่วย: คำสั่งซื้อ O1002 อยู่ระหว่างจัดส่งครับ",
  "คุณ: ขอดูคำสั่งซื้อ O1004 หน่อย",
  "(ประเภท: order O1004)",
  `(ข้อมูลที่ส่งให้โมเดล: ${expectedOrderContext("O1004")})`,
  "ผู้ช่วย: ไม่พบคำสั่งซื้อ O1004 ของคุณครับ",
  "คุณ: จบ",
  "ลาก่อนครับ",
].join("\n");

describe("เกณฑ์ตรวจบท 022 (exercise-3)", () => {
  const check = checks["exercise-3.ollama"].check;
  it("ผ่านเมื่อครบ ทั้งคู่ provider และแยกคำตอบ 3 ตาได้", () => {
    expect(() => check(run(GOOD3()))).not.toThrow();
    expect(() => checks["exercise-3.google"].check(run(GOOD3()))).not.toThrow();
    expect(extractReplies(GOOD3())).toHaveLength(3);
  });
  it("ไม่ผ่านเมื่อแบบฝึกยังไม่เติม หรือตรวจตัวอย่างไม่ได้เปิดคำสั่งซื้อของลูกค้าคนนี้", () => {
    expect(() => check(run("👉 ยังไม่ได้เติม contextFor (ดูบรรทัดที่มี 👉)"))).toThrow();
    expect(() => check(run(GOOD3().replace(/^ตรวจตัวอย่าง: .*$/m, "ตรวจตัวอย่าง: กำลังจัดส่ง")))).toThrow(/O1002/);
  });
  it("ไม่ผ่านเมื่อข้อมูลตาที่ 3 เผยสถานะจริงของคำสั่งซื้อลูกค้าคนอื่น", () => {
    const leak = GOOD3().replace(
      `(ข้อมูลที่ส่งให้โมเดล: ${expectedOrderContext("O1004")})`,
      `(ข้อมูลที่ส่งให้โมเดล: คำสั่งซื้อ O1004 สถานะ: ${ORDER_STATUS_LABELS.pending} ยอดรวม 1290 บาท)`,
    );
    expect(() => check(run(leak))).toThrow(/รอชำระเงิน/);
    const replyLeak = GOOD3().replace("ไม่พบคำสั่งซื้อ O1004 ของคุณครับ", `คำสั่งซื้อ O1004 อยู่ระหว่าง${ORDER_STATUS_LABELS.pending}ครับ`);
    expect(() => check(run(replyLeak))).toThrow(/รอชำระเงิน/);
  });
  it("ไม่ผ่านเมื่อประเภทของ 3 ตาไม่ตรง หรือข้อมูลตาที่ 1 ไม่มีคำค้น", () => {
    expect(() => check(run(GOOD3().replace("(ประเภท: order O1004)", "(ประเภท: order O1002)")))).toThrow(/ประเภท/);
    expect(() => check(run(GOOD3().replace("P002 เมล็ดกาแฟคั่วเข้ม ดอยสะเก็ด 250 กรัม ราคา 360 บาท สต็อก 18", "P001 เมล็ดกาแฟคั่วกลาง")))).toThrow(/คั่วเข้ม/);
    expect(() => check(run(GOOD3().replace("(ประเภท: product)", "(ประเภท: แปลงไม่สำเร็จ)")))).toThrow(/ประเภท/);
  });
  it("ไม่ผ่านเมื่อจำนวนคำตอบไม่ครบ มีคำตอบที่ไม่ใช่ภาษาไทย หรือไม่มี ลาก่อนครับ", () => {
    expect(() => check(run(GOOD3().replace("ผู้ช่วย: ไม่พบคำสั่งซื้อ O1004 ของคุณครับ\n", "")))).toThrow(/3 คำตอบ/);
    expect(() => check(run(GOOD3().replace("ไม่พบคำสั่งซื้อ O1004 ของคุณครับ", "not found")))).toThrow(/ไทย/);
    expect(() => check(run(GOOD3().replace("ลาก่อนครับ", "บาย")))).toThrow(/ลาก่อนครับ/);
  });
  it("ลำดับของ 3 ตาต้องตรงกับ input ชุดที่ส่งเข้าไป", () => {
    expect(checks["exercise-3.ollama"].input).toEqual([
      "มีเมล็ดกาแฟคั่วเข้มไหม",
      "คำสั่งซื้อ O1002 ถึงไหนแล้ว",
      "ขอดูคำสั่งซื้อ O1004 หน่อย",
      "จบ",
    ]);
    expect(getOrder("O1004", "C001")).toBeUndefined();
    const order = getOrder("O1002", "C001");
    expect(order === undefined ? 0 : orderTotal(order)).toBe(890);
  });
});
