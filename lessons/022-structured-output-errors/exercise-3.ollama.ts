// แบบฝึกหัด 3 ⭐: แชทบอทร้าน DN Shop รุ่นแยกประเภทได้ (รวมบท 016–022 เข้าด้วยกัน)
//
// โจทย์: เติม contextFor(question, customerId) ให้ประกอบข้อมูลจากร้านที่ตรงกับคำถาม แล้วไฟล์จะใส่ข้อมูลนี้ใน system ของทุกตา
// ไฟล์แยกประเภทคำถามด้วย includeRaw ก่อนตอบ และพิมพ์ประเภทกับข้อมูลที่ส่งให้โมเดล เพื่อให้ตรวจย้อนหลังได้ว่าตาไหนผิด
//
// แนวทาง:
// 1. product: วน question.keywords แล้ว searchProducts({ keyword }) รวมผลไม่ซ้ำด้วย Map (ตาม id) ไม่เกิน 5 ชิ้น บรรทัดละ "<id> <ชื่อ> ราคา <price> บาท สต็อก <stock>" ถ้าไม่เจอเลยคืน "ไม่พบสินค้าที่ตรงกับคำค้น"
// 2. order: ไม่มี orderId ใช้ listOrders(customerId) บรรทัดละ "<id> <ป้ายสถานะ>" · มี orderId ใช้ getOrder(orderId, customerId) เจอให้คืน "คำสั่งซื้อ <id> สถานะ: <ป้าย> ยอดรวม <orderTotal> บาท" ไม่เจอให้คืน "ไม่พบคำสั่งซื้อ <id> ของลูกค้ารายนี้" (เพิ่ม import จาก src/shop: searchProducts, getOrder, listOrders, orderTotal, ORDER_STATUS_LABELS และ type Product ถ้าใช้ Map)
// 3. policy / other คืน "" · จุด 👉: เขียนตัวฟังก์ชัน ตอนนี้ contextFor คืน "" (ไฟล์จึงหยุดแล้วพิมพ์ 👉 ก่อนเรียกโมเดล)
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 022 exercise-3.ollama
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { ask } from "../../src/lib/ask";
import { env, optionalEnv } from "../../src/lib/env";
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
  void question; // ลบบรรทัด void ทั้ง 2 เมื่อเริ่มใช้ตัวแปร
  void customerId;
  // 👉 ประกอบข้อมูลจากร้านตาม question.category (แทนบรรทัด return "")
  return "";
}

export async function main(): Promise<void> {
  // บล็อกนี้กันไม่ให้เรียกโมเดลทั้งที่ contextFor ยังไม่ทำงาน (ไม่เสีย token)
  if (contextFor(SAMPLE, CUSTOMER_ID) === "") {
    console.log("👉 ยังไม่ได้เติม contextFor (ดูบรรทัดที่มี 👉)");
    return;
  }

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
