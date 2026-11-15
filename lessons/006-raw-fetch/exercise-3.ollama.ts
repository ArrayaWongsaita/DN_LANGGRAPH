// แบบฝึกหัด 3 ⭐: ห่อการเรียกเป็นฟังก์ชัน ask แล้วถามคำถามเดิม 3 รอบ
//
// โจทย์: เขียน ask(question) ที่ส่งคำถามไป Ollama แล้วคืน { text, inputTokens, outputTokens }
// จากนั้น main ถามคำถามเดิม 3 รอบ ทีละรอบต่อกัน (ไม่ยิงพร้อมกัน) พิมพ์รอบละ 2 บรรทัด:
//   ครั้งที่ 1: <คำตอบ>
//   (token <ขาเข้า>→<ขาออก>)
// คำตอบของแต่ละรอบอาจไม่เหมือนกัน เหมือนที่เรียนในบท 001 ไม่ต้องกังวล
//
// แนวทาง:
// 1. ย้ายโค้ด fetch จาก exercise-1 และ exercise-2 มาไว้ในตัว ask
// 2. จุด 👉 ที่ 1: เขียนตัว ask
// 3. จุด 👉 ที่ 2: เขียนลูป 3 รอบใน main ด้วย for และ await ในลูป
// 4. ลบ 👉 ออกเมื่อเสร็จ แล้วรัน: pnpm lesson 006 exercise-3.ollama
const QUESTION = "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง";

export interface OllamaChatResponse {
  message: { role: string; content: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

interface Answer {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

// 👉 เขียนตัว ask: สร้าง headers (ใส่ Authorization ถ้ามี OLLAMA_API_KEY), fetch, ตรวจ res.ok, อ่าน JSON
function ask(question: string): Promise<Answer> {
  // ค่าชั่วคราว ลบเมื่อเขียนเสร็จ (เพิ่ม import env, optionalEnv ที่หัวไฟล์ด้วย)
  return Promise.resolve({ text: `(ยังไม่ได้เขียน ask) ${question}`, inputTokens: 0, outputTokens: 0 });
}

export async function main(): Promise<void> {
  // 👉 วนถาม 3 รอบ (i = 1, 2, 3) แล้วพิมพ์ 2 บรรทัดต่อรอบตามรูปแบบในโจทย์
  const first = await ask(QUESTION);
  console.log(`ครั้งที่ 1: ${first.text}`);
  console.log(`(token ${first.inputTokens}→${first.outputTokens})`);
}
