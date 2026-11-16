import type { Customer } from "./types";

const CUSTOMERS: readonly Customer[] = [
  { id: "C001", name: "สมชาย ใจดี", email: "somchai@example.com" },
  { id: "C002", name: "สมหญิง รักกาแฟ", email: "somying@example.com" },
  { id: "C003", name: "มานี มีนา", email: "manee@example.com" },
  { id: "C004", name: "ปิติ ชูใจ", email: "piti@example.com" },
];

export function listCustomers(): Customer[] {
  return structuredClone([...CUSTOMERS]);
}

export function getCustomer(id: string): Customer | undefined {
  const c = CUSTOMERS.find((x) => x.id === id.trim().toUpperCase());
  return c && structuredClone(c);
}
