// เฉลยแบบฝึกหัด 3 ⭐: แชทบอทร้าน DN Shop รุ่นแยกประเภทได้ (รวมบท 016–022 เข้าด้วยกัน)
//
// โจทย์: เติม contextFor(question, customerId) ให้ประกอบข้อมูลจากร้านที่ตรงกับคำถาม แล้วไฟล์จะใส่ข้อมูลนี้ใน system ของทุกตา
// ไฟล์แยกประเภทคำถามด้วย includeRaw ก่อนตอบ และพิมพ์ประเภทกับข้อมูลที่ส่งให้โมเดล เพื่อให้ตรวจย้อนหลังได้ว่าตาไหนผิด
// รัน: pnpm lesson 022 exercise-3.ollama
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { ask } from "../../src/lib/ask";
import { env, optionalEnv } from "../../src/lib/env";
import { getOrder, listOrders, orderTotal } from "../../src/shop/orders";
import { searchProducts } from "../../src/shop/products";
import { ORDER_STATUS_LABELS, type Product } from "../../src/shop/types";
import { CLASSIFY_SYSTEM, CUSTOMER_ID, CustomerQuestion, oneLine } from "./customer-question";

const TOOL = "classify_question";

// system 4 ส่วนแบบบท 017
const PARTS = {
  role: "คุณคือผู้ช่วยร้าน DN Shop ร้านขายกาแฟและอุปกรณ์ชงกาแฟออนไลน์",
  scope: [
    "ตอบเรื่องสินค้า วิธีชงกาแฟ การสั่งซื้อ และการจัดส่ง โดยใช้ข้อมูลจากระบบร้านด้านล่างเท่านั้น",
    "ถ้าข้อมูลจากระบบร้านไม่มีสิ่งที่ลูกค้าถาม ให้บอกว่าไม่มีข้อมูล แล้วเสนอเรื่องที่ช่วยได้",
  ],
  tone: ["ตอบภาษาไทย สุภาพ ไม่เกิน 3 ประโยค", "ลงท้ายด้วย ครับ"],
  forbidden: [
    "ห้ามบอกสถานะหรือยอดรวมของคำสั่งซื้อที่ไม่มีอยู่ในข้อมูลจากระบบร้าน",
    "ห้ามแต่งราคา โปรโมชัน หรือส่วนลดที่ไม่มีในข้อมูล",
  ],
};

// ประกอบ 4 ส่วนเป็น prompt ก้อนเดียวเหมือนบท 017 แล้วต่อท้ายด้วยข้อมูลจากระบบร้านแบบบท 018
function buildSystem(context: string): string {
  const list = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");
  return [
    `## บทบาท\n${PARTS.role}`,
    `## ขอบเขต\n${list(PARTS.scope)}`,
    `## น้ำเสียง\n${list(PARTS.tone)}`,
    `## สิ่งที่ห้ามตอบ\n${list(PARTS.forbidden)}`,
    `## ข้อมูลจากระบบร้าน\n${context === "" ? "ไม่มี" : context}`,
  ].join("\n\n");
}

// ตัวอย่างสำหรับตรวจ contextFor: O1002 เป็นคำสั่งซื้อของ C001 (ตัวจริงมาจากการ login ไม่ได้มาจากโมเดล)
const SAMPLE: CustomerQuestion = { category: "order", keywords: [], orderId: "O1002", urgent: false, summary: "x" };

const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});

function contextFor(question: CustomerQuestion, customerId: string): string {
  // เฉลยจุดที่ 1: เลือกข้อมูลตามประเภทที่โมเดลบอก แต่เจ้าของคำสั่งซื้อใช้ customerId ที่ระบบส่งมาเท่านั้น
  if (question.category === "product") {
    // ค้นทีละ keyword แล้วรวมผลด้วย Map ตาม id: searchProducts บังคับให้ตรงทุกคำใน keyword เดียว
    // การยิงทั้งประโยคเป็น keyword เดียวจึงมักไม่เจออะไรเลย ขณะที่การแยกคำได้ผลตรงกว่า
    // Map กันสินค้าซ้ำเมื่อหลาย keyword เจอชิ้นเดียวกัน แล้วตัดเหลือ 5 ชิ้นเพื่อไม่ให้ prompt ยาวโดยไม่จำเป็น (บท 018)
    const found = new Map<string, Product>();
    for (const keyword of question.keywords) {
      for (const product of searchProducts({ keyword })) {
        if (!found.has(product.id)) found.set(product.id, product);
      }
    }
    if (found.size === 0) return "ไม่พบสินค้าที่ตรงกับคำค้น";
    // บรรทัดละ 1 ชิ้น มี id ชื่อ ราคา และสต็อก: ค่าทุกตัวมาจากข้อมูลร้าน ไม่พิมพ์เอง
    return [...found.values()]
      .slice(0, 5)
      .map((product) => `${product.id} ${product.name} ราคา ${product.price} บาท สต็อก ${product.stock}`)
      .join("\n");
  }

  if (question.category === "order") {
    if (question.orderId === undefined) {
      // ไม่มีรหัสในข้อความ: เปิดรายการคำสั่งซื้อของลูกค้าคนนี้ (listOrders กรองเจ้าของให้แล้ว)
      const orders = listOrders(customerId);
      if (orders.length === 0) return "ไม่มีคำสั่งซื้อของลูกค้ารายนี้";
      return orders.map((order) => `${order.id} ${ORDER_STATUS_LABELS[order.status]}`).join("\n");
    }
    // มีรหัส: ใช้ getOrder(orderId, customerId) ที่ตรวจเจ้าของเสมอ ห้ามเชื่อรหัสลูกค้าจากโมเดล
    // ถ้าโมเดลเลือกเจ้าของได้ มันจะขอดูคำสั่งซื้อของคนอื่นได้ (รหัสลูกค้ามาจากการ login เท่านั้น)
    // "ไม่พบ" ของคนอื่นต้องเหมือนกับ "ไม่มีอยู่จริง": ถ้าตอบต่างกัน ผู้ใช้จะเดาได้ว่ารหัสนั้นมีอยู่จริง (Review Focus 1)
    const order = getOrder(question.orderId, customerId);
    if (order === undefined) return `ไม่พบคำสั่งซื้อ ${question.orderId} ของลูกค้ารายนี้`;
    return `คำสั่งซื้อ ${order.id} สถานะ: ${ORDER_STATUS_LABELS[order.status]} ยอดรวม ${orderTotal(order)} บาท`;
  }

  // policy / other: ไม่ต้องเปิดข้อมูลจากร้านเลย ตอบจาก system 4 ส่วนได้โดยไม่ต้องใส่ข้อมูลเพิ่ม
  return "";
}

export async function main(): Promise<void> {
  // บรรทัดที่พิมพ์นี้ใช้ตรวจว่า contextFor เปิดคำสั่งซื้อของลูกค้าคนนี้จริง
  console.log(`ตรวจตัวอย่าง: ${oneLine(contextFor(SAMPLE, CUSTOMER_ID), 120)}`);

  const classify = model.withStructuredOutput(CustomerQuestion, { name: TOOL, method: "functionCalling", includeRaw: true });
  console.log("--- แชทบอท DN Shop รุ่นแยกประเภทได้ (พิมพ์ จบ เพื่อออก) ---");
  const history: BaseMessage[] = [];
  while (true) {
    const line = await ask("คุณ: ");
    if (line === null || line === "จบ") break;
    if (line === "") continue;
    history.push(new HumanMessage(line));

    // ทุกตา: แยกประเภทก่อน แล้วจึงเลือกข้อมูลจากร้านที่ตรงกับคำถาม
    const { parsed } = await classify.invoke([
      { role: "system", content: CLASSIFY_SYSTEM },
      { role: "user", content: line },
    ]);
    const question = parsed ?? null;
    console.log(
      question === null
        ? "(ประเภท: แปลงไม่สำเร็จ)"
        : `(ประเภท: ${question.category}${question.orderId === undefined ? "" : ` ${question.orderId}`})`,
    );
    const context = question === null ? "" : contextFor(question, CUSTOMER_ID);
    console.log(`(ข้อมูลที่ส่งให้โมเดล: ${context === "" ? "ไม่มี" : oneLine(context.split("\n").filter((l) => l !== "").join(" / "), 120)})`);

    process.stdout.write("ผู้ช่วย: ");
    let reply = "";
    for await (const chunk of await model.stream([new SystemMessage(buildSystem(context)), ...history])) {
      process.stdout.write(chunk.text);
      reply += chunk.text;
    }
    process.stdout.write("\n");
    history.push(new AIMessage(reply));
  }
  console.log("ลาก่อนครับ");
}
