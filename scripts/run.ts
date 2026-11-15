import { pathToFileURL } from "node:url";

// โหลดไฟล์ของบท: เรียก main() ถ้ามี ไม่งั้นโค้ดบนสุดของไฟล์ทำงานตอน import อยู่แล้ว
export async function runModule(file: string): Promise<void> {
  const mod = (await import(pathToFileURL(file).href)) as { main?: unknown };
  if (typeof mod.main === "function") await (mod.main as () => unknown)();
}
