import { createInterface } from "node:readline/promises";

// ถามผู้ใช้ทีละบรรทัด ใช้ได้ทั้งพิมพ์เองและ pipe จาก `pnpm verify`
// คืน null เมื่อ input หมด (EOF) และถามต่อก็ได้ null เสมอ
let lines: AsyncIterator<string> | undefined;
let ended = false;

export async function ask(prompt: string): Promise<string | null> {
  if (ended) return null;
  process.stdout.write(prompt);
  // ไม่ส่ง output ให้ readline: ให้ OS จัดการ echo และการลบตัวอักษรไทยเอง
  // อ่านผ่าน async iterator (ไม่ใช้ rl.question) เพื่อไม่ให้บรรทัดที่มาพร้อมกันหาย
  lines ??= createInterface({ input: process.stdin, crlfDelay: Infinity })[Symbol.asyncIterator]();
  process.stdin.resume();
  const next = await lines.next();
  process.stdin.pause(); // ปล่อย stdin เพื่อให้โปรแกรมจบเองได้ แม้ stdin ยังเปิดอยู่
  if (next.done) {
    ended = true;
    process.stdout.write("\n");
    return null;
  }
  // stdin ไม่ใช่ terminal: echo บรรทัดที่อ่านเพื่อให้ผลที่เก็บดูเหมือนคนพิมพ์
  if (!process.stdin.isTTY) process.stdout.write(next.value + "\n");
  return next.value.trim();
}
