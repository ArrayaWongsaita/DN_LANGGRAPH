import { resetOrders } from "./orders";
import { resetProducts } from "./products";

export function resetShop(): void {
  resetProducts();
  resetOrders();
}
