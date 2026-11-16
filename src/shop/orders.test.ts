import { beforeEach, describe, expect, it } from "vitest";
import { listCustomers } from "./customers";
import { cancelOrder, getOrder, listOrders, orderTotal, refund } from "./orders";
import { getProduct, getStock } from "./products";
import { resetShop } from "./reset";
import { ORDER_STATUSES } from "./types";

beforeEach(resetShop);

const own = (id: string) => {
  const o = listCustomers().flatMap((c) => listOrders(c.id)).find((x) => x.id === id);
  return o!;
};

describe("orders", () => {
  it("ข้อมูลครบและสอดคล้องกัน", () => {
    const customers = listCustomers();
    expect(customers.map((c) => c.id)).toEqual(["C001", "C002", "C003", "C004"]);
    const orders = customers.flatMap((c) => listOrders(c.id));
    expect(orders).toHaveLength(10);
    for (const s of ORDER_STATUSES) expect(orders.some((o) => o.status === s)).toBe(true);
    for (const c of customers) expect(listOrders(c.id).length).toBeGreaterThanOrEqual(2);
    for (const o of orders) {
      expect(o.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const it of o.items) expect(getProduct(it.productId)?.price).toBe(it.unitPrice);
    }
  });

  it("orderTotal", () => {
    expect(orderTotal(own("O1001"))).toBe(880);
    expect(orderTotal(own("O1003"))).toBe(473);
    expect(orderTotal(own("O1005"))).toBe(349);
    expect(orderTotal(own("O1008"))).toBe(449);
  });

  it("getOrder ของตัวเอง ตัดช่องว่างและไม่สนตัวพิมพ์", () => {
    expect(getOrder(" o1002 ", "C001")?.status).toBe("shipped");
  });

  it("คำสั่งซื้อของลูกค้าอื่นได้ undefined เหมือนไม่มีอยู่จริง", () => {
    expect(getOrder("O1004", "C001")).toBeUndefined();
    expect(getOrder("O9999", "C001")).toBeUndefined();
    expect(getOrder("O1004", "C002")?.status).toBe("pending");
  });

  it("ยกเลิกได้เมื่อชำระแล้วและคืนสต็อก", () => {
    expect(getStock("P006")).toBe(40);
    expect(getStock("P015")).toBe(60);
    const r = cancelOrder("O1003", "C001");
    expect(r.ok).toBe(true);
    expect(getOrder("O1003", "C001")?.status).toBe("cancelled");
    expect(getStock("P006")).toBe(42);
    expect(getStock("P015")).toBe(61);
    const again = cancelOrder("O1003", "C001");
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.reason).toContain("ยกเลิกแล้ว");
  });

  it("ยกเลิกคำสั่งซื้อที่กำลังจัดส่งไม่ได้", () => {
    expect(cancelOrder("O1002", "C001")).toEqual({ ok: false, reason: 'ยกเลิกคำสั่งซื้อ O1002 ไม่ได้ เพราะสถานะตอนนี้คือ "กำลังจัดส่ง" (ยกเลิกได้เฉพาะ รอชำระเงิน หรือ ชำระเงินแล้ว)' });
  });

  it("ยกเลิกคำสั่งซื้อของคนอื่นไม่ได้และไม่เปลี่ยนสถานะ", () => {
    expect(cancelOrder("O1004", "C001")).toEqual({ ok: false, reason: "ไม่พบคำสั่งซื้อ O1004 ของลูกค้ารายนี้" });
    expect(getOrder("O1004", "C002")?.status).toBe("pending");
  });

  it("คืนเงิน", () => {
    const r = refund("O1001", "C001");
    expect(r).toMatchObject({ ok: true, amount: 880 });
    expect(getOrder("O1001", "C001")?.status).toBe("refunded");
    expect(getStock("P001")).toBe(25);
    expect(refund("O1002", "C001")).toEqual({ ok: false, reason: 'คืนเงินคำสั่งซื้อ O1002 ไม่ได้ เพราะสถานะตอนนี้คือ "กำลังจัดส่ง" (คืนเงินได้เฉพาะ จัดส่งแล้ว)' });
  });

  it("resetShop คืนค่าเดิม และผลที่คืนเป็นสำเนา", () => {
    cancelOrder("O1003", "C001");
    refund("O1001", "C001");
    resetShop();
    expect(getOrder("O1003", "C001")?.status).toBe("paid");
    expect(getOrder("O1001", "C001")?.status).toBe("delivered");
    expect(getStock("P006")).toBe(40);
    getOrder("O1001", "C001")!.items[0].quantity = 99;
    listOrders("C001")[0].items.push({ productId: "P001", quantity: 1, unitPrice: 1 });
    expect(orderTotal(getOrder("O1001", "C001")!)).toBe(880);
  });
});
