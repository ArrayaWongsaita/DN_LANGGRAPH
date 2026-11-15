// บท 002: ตรวจว่าโปรเจกต์รันได้ และอ่านค่าจากไฟล์ .env ได้
// ไฟล์นี้พิมพ์แค่สถานะของแต่ละตัวแปร ไม่พิมพ์ค่าจริง (กันไม่ให้ key หลุดขึ้นหน้าจอ)
import { optionalEnv, type EnvName } from "../../src/lib/env";

console.log("สวัสดีจาก DN_LANGGRAPH");
console.log(`Node ${process.version}`);

// ตัวแปรของช่วงที่ 1 (บท 003–005)
const names: EnvName[] = ["OLLAMA_BASE_URL", "OLLAMA_API_KEY", "OLLAMA_MODEL", "GOOGLE_API_KEY", "GOOGLE_MODEL"];

for (const name of names) {
  try {
    // optionalEnv คืน undefined ถ้ายังไม่ตั้ง และ throw ถ้าตั้งแล้วแต่รูปแบบผิด
    const value = optionalEnv(name);
    console.log(`${name}: ${value === undefined ? "ยังไม่ได้ตั้ง" : "ตั้งแล้ว"}`);
  } catch {
    console.log(`${name}: ค่าไม่ถูกต้อง`);
  }
}
