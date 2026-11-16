import { adjustStock } from "./products";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderResult,
  type RefundResult,
} from "./types";

const o = (
  id: string, customerId: string, status: Order["status"], createdAt: string,
  items: [string, number, number][],
): Order => ({
  id, customerId, status, createdAt,
  items: items.map(([productId, quantity, unitPrice]) => ({ productId, quantity, unitPrice })),
});

const INITIAL_ORDERS: readonly Order[] = [
  o("O1001", "C001", "delivered", "2026-10-20", [["P001", 1, 380], ["P017", 2, 250]]),
  o("O1002", "C001", "shipped", "2026-11-10", [["P011", 1, 890]]),
  o("O1003", "C001", "paid", "2026-11-14", [["P006", 2, 189], ["P015", 1, 95]]),
  o("O1004", "C002", "pending", "2026-11-15", [["P014", 1, 1290]]),
  o("O1005", "C002", "delivered", "2026-10-28", [["P008", 1, 229], ["P021", 1, 120]]),
  o("O1006", "C002", "cancelled", "2026-11-02", [["P003", 1, 520]]),
  o("O1007", "C003", "refunded", "2026-10-15", [["P018", 1, 450]]),
  o("O1008", "C003", "shipped", "2026-11-12", [["P009", 1, 299], ["P013", 1, 150]]),
  o("O1009", "C004", "paid", "2026-11-13", [["P022", 1, 790]]),
  o("O1010", "C004", "delivered", "2026-11-01", [["P002", 2, 360]]),
];

let orders: Order[] = structuredClone([...INITIAL_ORDERS]);

const normalize = (id: string) => id.trim().toUpperCase();

function find(orderId: string, customerId: string): Order | undefined {
  const id = normalize(orderId);
  return orders.find((x) => x.id === id && x.customerId === customerId);
}

export function listOrders(customerId: string): Order[] {
  return structuredClone(orders.filter((x) => x.customerId === customerId));
}

export function getOrder(orderId: string, customerId: string): Order | undefined {
  const found = find(orderId, customerId);
  return found && structuredClone(found);
}

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
}

export function cancelOrder(orderId: string, customerId: string): OrderResult {
  const id = normalize(orderId);
  const found = find(id, customerId);
  if (!found) return { ok: false, reason: `ไม่พบคำสั่งซื้อ ${id} ของลูกค้ารายนี้` };
  if (found.status !== "pending" && found.status !== "paid") {
    return {
      ok: false,
      reason: `ยกเลิกคำสั่งซื้อ ${id} ไม่ได้ เพราะสถานะตอนนี้คือ "${ORDER_STATUS_LABELS[found.status]}" (ยกเลิกได้เฉพาะ รอชำระเงิน หรือ ชำระเงินแล้ว)`,
    };
  }
  found.status = "cancelled";
  for (const i of found.items) adjustStock(i.productId, i.quantity);
  return { ok: true, order: structuredClone(found) };
}

export function refund(orderId: string, customerId: string): RefundResult {
  const id = normalize(orderId);
  const found = find(id, customerId);
  if (!found) return { ok: false, reason: `ไม่พบคำสั่งซื้อ ${id} ของลูกค้ารายนี้` };
  if (found.status !== "delivered") {
    return {
      ok: false,
      reason: `คืนเงินคำสั่งซื้อ ${id} ไม่ได้ เพราะสถานะตอนนี้คือ "${ORDER_STATUS_LABELS[found.status]}" (คืนเงินได้เฉพาะ จัดส่งแล้ว)`,
    };
  }
  found.status = "refunded";
  return { ok: true, order: structuredClone(found), amount: orderTotal(found) };
}

export function resetOrders(): void {
  orders = structuredClone([...INITIAL_ORDERS]);
}
