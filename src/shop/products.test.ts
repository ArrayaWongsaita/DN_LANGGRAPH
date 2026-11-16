import { beforeEach, describe, expect, it } from "vitest";
import { CATEGORIES } from "./types";
import { getProduct, getStock, listProducts, searchProducts } from "./products";
import { resetShop } from "./reset";

beforeEach(resetShop);

describe("products", () => {
  it("ข้อมูลครบและถูกรูปแบบ", () => {
    const all = listProducts();
    const ids = Array.from({ length: 24 }, (_, i) => `P${String(i + 1).padStart(3, "0")}`);
    expect(all.map((p) => p.id)).toEqual(ids);
    for (const c of CATEGORIES) expect(all.filter((p) => p.category === c).length).toBeGreaterThanOrEqual(4);
    for (const p of all) {
      expect(Number.isInteger(p.price) && p.price > 0).toBe(true);
      expect(Number.isInteger(p.stock) && p.stock >= 0).toBe(true);
      expect(p.description).not.toBe("");
      expect([...new Intl.Segmenter("th").segment(p.description)].length).toBeLessThanOrEqual(80);
      expect(p.description).not.toMatch(/model:/);
    }
    expect(all.filter((p) => p.stock === 0).map((p) => p.id)).toEqual(["P004", "P010", "P012", "P019"]);
    expect(all.filter((p) => p.price === 380).map((p) => p.id)).toEqual(["P001"]);
  });

  it.each([
    [{ keyword: "ดริปซอง" }, ["P006", "P007", "P008", "P009", "P010"]],
    [{ keyword: "คั่วเข้ม" }, ["P002", "P004", "P007"]],
    [{ keyword: "คั่วเข้ม", category: "beans" }, ["P002", "P004"]],
    [{ keyword: "เมล็ดกาแฟ คั่วเข้ม" }, ["P002", "P004"]],
    [{ keyword: "ดริป", maxPrice: 200 }, ["P006", "P007", "P013"]],
    [{ category: "drinkware", maxPrice: 300 }, ["P017"]],
    [{ maxPrice: 150 }, ["P013", "P015", "P021"]],
    [{ keyword: "dn shop" }, ["P017", "P023"]],
    [{ keyword: "ของขวัญ" }, ["P021", "P022", "P023", "P024"]],
    [{ keyword: "คั่วเข้ม", category: "beans", maxPrice: 400 }, ["P002"]],
  ] as const)("searchProducts(%j)", (q, ids) => expect(searchProducts(q).map((p) => p.id)).toEqual(ids));

  it("null, undefined และคำค้นว่าง = ไม่กรอง", () => {
    expect(searchProducts({})).toHaveLength(24);
    expect(searchProducts({ keyword: null, category: null, maxPrice: null })).toHaveLength(24);
    expect(searchProducts({ keyword: "   " })).toHaveLength(24);
  });

  it("getProduct / getStock", () => {
    expect(getProduct(" p001 ")?.price).toBe(380);
    expect(getProduct("P999")).toBeUndefined();
    expect(getStock("P004")).toBe(0);
    expect(getStock("P999")).toBeUndefined();
  });

  it("คืนสำเนา แก้แล้วไม่กระทบข้อมูลร้าน", () => {
    const before = structuredClone(getProduct("P001"));
    for (const p of [listProducts()[0], getProduct("P001")!, searchProducts({ keyword: "ดอยช้าง" })[0]]) {
      p.price = 1;
      p.tags.push("x");
    }
    expect(getProduct("P001")).toEqual(before);
  });
});
