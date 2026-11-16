import { getOrder, orderTotal } from "../../src/shop/orders";
import { ORDER_STATUS_LABELS } from "../../src/shop/types";
import { CheckFailure, expectIncludes, expectMatches, expectNoSecrets, expectSuccess, expectThai, extractSection } from "../verify/expect";
import type { FileCheck, RunResult } from "../verify/types";

const CUSTOMER_ID = "C001";
const STEP1 = "--- ขั้นที่ 1: args ที่โมเดลอาจส่งมา (ข้อมูลปลอม) ---";
const STEP2 = "--- ขั้นที่ 2: แยกประเภทคำถามจริง 6 ข้อ (includeRaw) ---";
const TOTAL = 6;
const MAX_ATTEMPTS = 3;

function common(run: RunResult, label: string): void {
  expectSuccess(run);
  expectNoSecrets(run, label);
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const linesOf = (s: string): string[] => norm(s).split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");

// สถานะของคำสั่งซื้อที่ลูกค้าคนนี้เห็น (รูปแบบบรรทัดของขั้นที่ 2 ใน example):
// ของคนอื่นต้องได้ข้อความ "ไม่พบ" เหมือนคำสั่งซื้อที่ไม่มีอยู่จริง
export function expectedStatusLine(orderId: string): string {
  const order = getOrder(orderId, CUSTOMER_ID);
  return order === undefined
    ? `ไม่พบคำสั่งซื้อ ${orderId} ของลูกค้ารายนี้`
    : `สถานะคำสั่งซื้อ ${orderId}: ${ORDER_STATUS_LABELS[order.status]}`;
}

// บรรทัดข้อมูลคำสั่งซื้อที่ contextFor ของแบบฝึกหัด 3 ต้องคืน (ต้องมีสถานะและยอดรวมจาก src/shop เท่านั้น)
export function expectedOrderContext(orderId: string): string {
  const order = getOrder(orderId, CUSTOMER_ID);
  return order === undefined
    ? `ไม่พบคำสั่งซื้อ ${orderId} ของลูกค้ารายนี้`
    : `คำสั่งซื้อ ${orderId} สถานะ: ${ORDER_STATUS_LABELS[order.status]} ยอดรวม ${orderTotal(order)} บาท`;
}

// ทุกบรรทัดที่บอกสถานะคำสั่งซื้อต้องคำนวณจาก getOrder(id, C001) เท่านั้น: คำสั่งซื้อของลูกค้าคนอื่น
// (เช่น O1004 ของ C002) ต้องพิมพ์ "ไม่พบ" ไม่ใช่สถานะจริง กันการเผยสถานะของคนอื่นออกจอ
export function expectNoStatusLeak(text: string, label: string): void {
  for (const raw of linesOf(text)) {
    // บรรทัดสถานะพิมพ์ย่อหน้าไว้ จึงตัดช่องว่างหัวบรรทัดก่อนเทียบ
    const line = raw.trim();
    const missing = /^ไม่พบคำสั่งซื้อ (O\d{4}) ของลูกค้ารายนี้$/.exec(line);
    if (missing !== null) {
      if (getOrder(missing[1], CUSTOMER_ID) !== undefined) {
        throw new CheckFailure(`${label}: ${missing[1]} เป็นคำสั่งซื้อของลูกค้ารายนี้ ต้องพิมพ์สถานะ ไม่ใช่ ไม่พบ`);
      }
      continue;
    }
    const status = /^สถานะคำสั่งซื้อ (O\d{4}): (.+)$/.exec(line);
    if (status === null) continue;
    const want = expectedStatusLine(status[1]);
    if (line !== want) throw new CheckFailure(`${label}: ${status[1]} ต้องพิมพ์ "${want}" (ได้ "${line}")`);
  }
}

// เลขข้อที่พิมพ์ออกมาต้องครบ 1..TOTAL พอดี (แต่ละข้อมีบรรทัดเดียว)
function expectEveryItem(numbers: number[], label: string): void {
  const want = Array.from({ length: TOTAL }, (_, i) => i + 1).join(",");
  const got = [...numbers].sort((a, b) => a - b).join(",");
  if (got !== want) throw new CheckFailure(`${label}: ต้องมีบรรทัดของข้อ 1-${TOTAL} ครบข้อละ 1 บรรทัด (ได้ ${got || "ไม่มีเลย"})`);
}

// อ่าน "แปลงสำเร็จ: N/6" แล้วคืน N พร้อมตรวจว่าหารด้วย 6 ตามจำนวนข้อความของบท
function expectSummary(text: string, label: string): number {
  const m = expectMatches(text, /^แปลงสำเร็จ: (\d+)\/(\d+)$/m, `${label} (แปลงสำเร็จ: N/${TOTAL})`);
  if (Number(m[2]) !== TOTAL) throw new CheckFailure(`${label}: ต้องมี ${TOTAL} ข้อ (ได้ ${m[2]})`);
  return Number(m[1]);
}

interface Block {
  n: number;
  body: string[];
}

// แยกส่วนที่ขึ้นต้นด้วย "args ที่ N: …" ต้องมีเลขครบ 1, 2, 3 ตามลำดับ
function splitArgs(text: string, label: string): Block[] {
  const matches = [...text.matchAll(/^args ที่ (\d+): .*$/gm)];
  const got = matches.map((m) => Number(m[1]));
  if (got.join(",") !== "1,2,3") throw new CheckFailure(`${label}: ต้องมีหัวข้อ args ที่ 1, 2, 3 ตามลำดับ (ได้ ${got.join(", ") || "ไม่มีเลย"})`);
  return matches.map((m, i) => ({
    n: Number(m[1]),
    body: linesOf(text.slice((m.index ?? 0) + m[0].length, matches[i + 1]?.index ?? text.length)).map((l) => l.trim()),
  }));
}

const example = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);

    // ขั้นที่ 1: args ปลอม 3 ก้อน ผลของ safeParse ต้องตรงกับข้อมูลปลอมนั้น (enum ผิด และขาด urgent)
    const step1 = extractSection(out, STEP1, STEP2, label);
    const blocks = splitArgs(step1, label);
    if (!blocks[0].body.includes("ผ่าน → ประเภท order")) {
      throw new CheckFailure(`${label}: args ที่ 1 ต้องพิมพ์ "ผ่าน → ประเภท order" (ได้ "${blocks[0].body.join(" / ")}")`);
    }
    if (!blocks[1].body.some((l) => l.includes("→ at category"))) {
      throw new CheckFailure(`${label}: args ที่ 2 (enum ผิด) ต้องมี "→ at category" (ได้ "${blocks[1].body.join(" / ")}")`);
    }
    if (!blocks[2].body.some((l) => l.includes("→ at urgent"))) {
      throw new CheckFailure(`${label}: args ที่ 3 (ขาด urgent) ต้องมี "→ at urgent" (ได้ "${blocks[2].body.join(" / ")}")`);
    }

    // ขั้นที่ 2: ทุกข้อมีบรรทัดของตัวเอง และสรุปตรงกับจำนวนข้อที่แปลงสำเร็จ
    const step2 = extractSection(out, STEP2, null, label);
    const ok = expectSummary(step2, label);
    if (ok < TOTAL - 1) throw new CheckFailure(`${label}: ต้องแปลงสำเร็จอย่างน้อย ${TOTAL - 1}/${TOTAL} (ได้ ${ok}/${TOTAL})`);
    const classified = [...step2.matchAll(/^ข้อ (\d+): ([a-z]+) \| orderId: (\S+) \| ด่วน: (?:ใช่|ไม่) \|/gm)].map((m) => ({
      n: Number(m[1]),
      category: m[2],
      orderId: m[3],
    }));
    const failed = [...step2.matchAll(/^ข้อ (\d+): แปลงไม่สำเร็จ$/gm)].map((m) => Number(m[1]));
    if (classified.length !== ok) {
      throw new CheckFailure(`${label}: แปลงสำเร็จ ${ok}/${TOTAL} ไม่ตรงกับจำนวนบรรทัด "ข้อ N: <category> |" (${classified.length})`);
    }
    expectEveryItem([...classified.map((c) => c.n), ...failed], label);

    // นับตามประเภทต้องครบทั้ง 4 ประเภทและผลรวมเท่ากับจำนวนข้อที่แปลงสำเร็จ
    const counts = expectMatches(step2, /^นับตามประเภท: product (\d+) · order (\d+) · policy (\d+) · other (\d+)$/m, `${label} (นับตามประเภท)`);
    const sum = [1, 2, 3, 4].reduce((total, i) => total + Number(counts[i]), 0);
    if (sum !== ok) throw new CheckFailure(`${label}: นับตามประเภทได้ ${sum} ข้อ ไม่ตรงกับแปลงสำเร็จ ${ok}/${TOTAL}`);

    // ข้อ 2 ("คำสั่งซื้อ O1002 ถึงไหนแล้ว รอนานมาก") ต้องเป็น order ของ O1002 พร้อมสถานะที่คำนวณจาก getOrder
    const second = classified.find((c) => c.n === 2);
    if (second === undefined || second.category !== "order" || second.orderId !== "O1002") {
      throw new CheckFailure(`${label}: ข้อ 2 ต้องแปลงสำเร็จเป็น order ของ O1002 (ได้ ${second === undefined ? "แปลงไม่สำเร็จ" : `${second.category} ${second.orderId}`})`);
    }
    expectIncludes(step2, expectedStatusLine("O1002"), `${label} (ข้อ 2 สถานะคำสั่งซื้อ)`);
    expectNoStatusLeak(step2, label);
  },
});

const exercise1 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const lines = linesOf(out);

    // ตัวอย่างปลอม 2 ก้อน: ไม่มี tool call และ args ผิด schema
    const sample1 = lines.find((l) => l.startsWith("ตรวจตัวอย่าง 1:"));
    if (sample1 === undefined || !sample1.includes("ไม่ได้เรียกเครื่องมือ")) {
      throw new CheckFailure(`${label}: ตรวจตัวอย่าง 1 ต้องบอกว่าไม่ได้เรียกเครื่องมือ (ได้ "${sample1 ?? "ไม่มีเลย"}")`);
    }
    const sample2 = lines.find((l) => l.startsWith("ตรวจตัวอย่าง 2:"));
    if (sample2 === undefined || !sample2.includes("category")) {
      throw new CheckFailure(`${label}: ตรวจตัวอย่าง 2 ต้องบอกว่าผิดที่ field category (ได้ "${sample2 ?? "ไม่มีเลย"}")`);
    }

    // สรุปต้องตรงกับจำนวนบรรทัดของแต่ละข้อ และจำนวนบรรทัด "เหตุที่ไม่ผ่าน" ต้องเท่ากับข้อที่ล้มเหลว
    const ok = expectSummary(out, label);
    const categories = [...out.matchAll(/^ข้อ (\d+): ([a-z]+)$/gm)].map((m) => Number(m[1]));
    const failures = [...out.matchAll(/^ข้อ (\d+): แปลงไม่สำเร็จ$/gm)].map((m) => Number(m[1]));
    if (categories.length !== ok) throw new CheckFailure(`${label}: แปลงสำเร็จ ${ok}/${TOTAL} ไม่ตรงกับจำนวนบรรทัด "ข้อ N: <category>" (${categories.length})`);
    expectEveryItem([...categories, ...failures], label);
    const prefix = "เหตุที่ไม่ผ่าน:";
    const reasons = lines.filter((l) => l.trim().startsWith(prefix));
    if (reasons.length !== TOTAL - ok) {
      throw new CheckFailure(`${label}: ต้องมีบรรทัด "เหตุที่ไม่ผ่าน:" ${TOTAL - ok} บรรทัด (ได้ ${reasons.length})`);
    }
    for (const line of reasons) {
      const reason = line.slice(line.indexOf(prefix) + prefix.length).trim();
      if (reason === "") throw new CheckFailure(`${label}: บรรทัด "เหตุที่ไม่ผ่าน:" ต้องมีเหตุผลตามหลังทุกบรรทัด`);
    }
  },
});

const exercise2 = (label: string): FileCheck => ({
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    const samples = linesOf(out).filter((l) => l.startsWith("ตรวจตัวอย่าง:"));
    const want = ["ตรวจตัวอย่าง: ได้ผลในครั้งที่ 2", "ตรวจตัวอย่าง: ลองครบ 3 ครั้งแล้วยังไม่ได้"];
    if (samples.join("\n") !== want.join("\n")) {
      throw new CheckFailure(`${label}: บรรทัด ตรวจตัวอย่าง ต้องเป็น\n${want.join("\n")}\n(ได้\n${samples.join("\n") || "ไม่มีเลย"})`);
    }

    const ok = expectSummary(out, label);
    if (ok < TOTAL - 1) throw new CheckFailure(`${label}: ต้องแปลงสำเร็จอย่างน้อย ${TOTAL - 1}/${TOTAL} (ได้ ${ok}/${TOTAL})`);
    const done = [...out.matchAll(/^ข้อ (\d+): ([a-z]+) \(ครั้งที่ (\d+)\)$/gm)].map((m) => ({
      n: Number(m[1]),
      attempts: Number(m[3]),
    }));
    const failed = [...out.matchAll(/^ข้อ (\d+): แปลงไม่สำเร็จ \(ลอง (\d+) ครั้ง\)$/gm)].map((m) => ({
      n: Number(m[1]),
      attempts: Number(m[2]),
    }));
    if (done.length !== ok) throw new CheckFailure(`${label}: แปลงสำเร็จ ${ok}/${TOTAL} ไม่ตรงกับจำนวนบรรทัด "(ครั้งที่ k)" (${done.length})`);
    expectEveryItem([...done.map((d) => d.n), ...failed.map((d) => d.n)], label);
    for (const item of [...done, ...failed]) {
      if (item.attempts < 1 || item.attempts > MAX_ATTEMPTS) {
        throw new CheckFailure(`${label}: ข้อ ${item.n} ต้องลอง 1-${MAX_ATTEMPTS} ครั้ง (ได้ ${item.attempts})`);
      }
    }
  },
});

// คำตอบ = ข้อความหลัง "ผู้ช่วย: " แต่ละครั้ง ถึงก่อน "\nคุณ: " หรือ "\nลาก่อนครับ" (แบบบท 016)
export function extractReplies(stdout: string): string[] {
  return [...norm(stdout).matchAll(/ผู้ช่วย: ([\s\S]*?)(?=\nคุณ: |\nลาก่อนครับ)/g)].map((m) => m[1].trim());
}

interface Turn {
  kind: string;
  data: string;
}

// จับคู่ "(ประเภท: …)" กับ "(ข้อมูลที่ส่งให้โมเดล: …)" ของแต่ละตา
function parseTurns(stdout: string, label: string): Turn[] {
  const turns: Turn[] = [];
  for (const line of linesOf(stdout)) {
    const kind = /^\(ประเภท: (.+)\)$/.exec(line);
    if (kind !== null) {
      turns.push({ kind: kind[1].trim(), data: "" });
      continue;
    }
    const data = /^\(ข้อมูลที่ส่งให้โมเดล: (.+)\)$/.exec(line);
    if (data !== null) {
      if (turns.length === 0) throw new CheckFailure(`${label}: พบ "(ข้อมูลที่ส่งให้โมเดล: …)" ก่อน "(ประเภท: …)"`);
      turns[turns.length - 1].data = data[1].trim();
    }
  }
  return turns;
}

const exercise3 = (label: string): FileCheck => ({
  input: ["มีเมล็ดกาแฟคั่วเข้มไหม", "คำสั่งซื้อ O1002 ถึงไหนแล้ว", "ขอดูคำสั่งซื้อ O1004 หน่อย", "จบ"],
  check: (run) => {
    common(run, label);
    const out = norm(run.stdout);
    expectIncludes(out, "ลาก่อนครับ", label);

    // ตรวจตัวอย่าง: contextFor ต้องเปิดคำสั่งซื้อ O1002 ของลูกค้าคนนี้ด้วยสถานะและยอดรวมจาก src/shop
    const sample = expectMatches(out, /^ตรวจตัวอย่าง: (.+)$/m, `${label} (ตรวจตัวอย่าง)`)[1];
    if (!sample.includes(ORDER_STATUS_LABELS.shipped)) {
      throw new CheckFailure(`${label}: ตรวจตัวอย่างต้องมี "${ORDER_STATUS_LABELS.shipped}" (ได้ "${sample}")`);
    }
    if (!sample.includes(expectedOrderContext("O1002"))) {
      throw new CheckFailure(`${label}: ตรวจตัวอย่างต้องมี "${expectedOrderContext("O1002")}" (ได้ "${sample}")`);
    }

    // 3 ตาตามลำดับ: product, order O1002, order O1004
    const turns = parseTurns(out, label);
    const want = ["product", "order O1002", "order O1004"];
    if (turns.map((t) => t.kind).join("\n") !== want.join("\n")) {
      throw new CheckFailure(`${label}: "(ประเภท: …)" 3 บรรทัดต้องเป็น ${want.join(", ")} (ได้ ${turns.map((t) => t.kind).join(", ") || "ไม่มีเลย"})`);
    }

    // ข้อมูลที่ส่งให้โมเดลต้องตรงกับคำถามของตา: ค้นสินค้าเจอ คำสั่งซื้อของตัวเองมีสถานะ และของคนอื่นต้องไม่พบ
    if (!turns[0].data.includes("คั่วเข้ม")) throw new CheckFailure(`${label}: ข้อมูลตาที่ 1 ต้องมี "คั่วเข้ม" (ได้ "${turns[0].data}")`);
    if (!turns[1].data.includes(expectedOrderContext("O1002"))) {
      throw new CheckFailure(`${label}: ข้อมูลตาที่ 2 ต้องมี "${expectedOrderContext("O1002")}" (ได้ "${turns[1].data}")`);
    }
    if (!turns[2].data.includes(expectedOrderContext("O1004"))) {
      throw new CheckFailure(`${label}: ข้อมูลตาที่ 3 ต้องมี "${expectedOrderContext("O1004")}" (ได้ "${turns[2].data}")`);
    }

    // คำตอบ 3 คำตอบ เป็นภาษาไทย และต้องไม่มีสถานะของคำสั่งซื้อคนอื่นหลุดออกมาที่ไหนเลย
    const replies = extractReplies(out);
    if (replies.length !== 3) throw new CheckFailure(`${label}: ต้องได้ 3 คำตอบ (ได้ ${replies.length})`);
    replies.forEach((reply, i) => {
      if (reply === "" || /^(undefined|null)$/.test(reply)) throw new CheckFailure(`${label}: คำตอบที่ ${i + 1} ว่างหรือเป็น ${reply}`);
      expectThai(reply, `${label} (คำตอบที่ ${i + 1})`);
    });
    if (out.includes(ORDER_STATUS_LABELS.pending)) {
      throw new CheckFailure(`${label}: ห้ามพิมพ์ "${ORDER_STATUS_LABELS.pending}" ของคำสั่งซื้อลูกค้าคนอื่นออกมาที่จอ`);
    }
  },
});

export default {
  "example.ollama": example("example.ollama"),
  "example.google": example("example.google"),
  "exercise-1.ollama": exercise1("exercise-1.ollama"),
  "exercise-1.google": exercise1("exercise-1.google"),
  "exercise-2.ollama": exercise2("exercise-2.ollama"),
  "exercise-2.google": exercise2("exercise-2.google"),
  "exercise-3.ollama": exercise3("exercise-3.ollama"),
  "exercise-3.google": exercise3("exercise-3.google"),
} satisfies Record<string, FileCheck>;
