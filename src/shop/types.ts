export const CATEGORIES = ["beans", "drip-bags", "equipment", "drinkware", "gifts"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
  beans: "เมล็ดกาแฟและกาแฟบด",
  "drip-bags": "กาแฟดริปซอง",
  equipment: "อุปกรณ์ชงกาแฟ",
  drinkware: "แก้วกาแฟ",
  gifts: "ของขวัญและของที่ระลึก",
};

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  description: string;
  tags: string[];
}

export interface ProductQuery {
  keyword?: string | null;
  category?: Category | null;
  maxPrice?: number | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
}

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระเงินแล้ว รอจัดส่ง",
  shipped: "กำลังจัดส่ง",
  delivered: "จัดส่งแล้ว",
  cancelled: "ยกเลิกแล้ว",
  refunded: "คืนเงินแล้ว",
};

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string; // "YYYY-MM-DD"
}

export type OrderResult = { ok: true; order: Order } | { ok: false; reason: string };
export type RefundResult = { ok: true; order: Order; amount: number } | { ok: false; reason: string };
