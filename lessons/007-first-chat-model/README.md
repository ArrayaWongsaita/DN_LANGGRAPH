# บท 007: คุยกับโมเดลผ่าน LangChain ครั้งแรก

บทนี้เป็นบทแรกที่ใช้ LangChain: เรียกโมเดลด้วย `ChatOllama` (ไฟล์ `.ollama.ts`) และ `ChatGoogle` (ไฟล์ `.google.ts`) แทนการเขียน `fetch` เอง ใช้เวลาประมาณ 40-50 นาที ทำทั้ง 2 แบบเพื่อเทียบกัน

## จบบทนี้แล้วทำอะไรได้

- สร้างโมเดลด้วย `ChatOllama` หรือ `ChatGoogle` โดยอ่านชื่อโมเดลและ key จาก `.env`
- เรียกโมเดลด้วย `await model.invoke(คำถาม)` แล้วอ่านคำตอบด้วย `.text`
- อธิบายได้ว่าทำไมต้องอ่านด้วย `.text` ไม่ใช่ `.content` ตรงๆ
- เทียบได้ว่าโค้ดสั้นลงจากบท 006 ตรงไหน

## เชื่อมกับที่รู้แล้ว

บท 006 เราเรียกโมเดลด้วย `fetch` เอง ต้องรู้ URL, header, รูปร่าง body และต้องขุดคำตอบออกจาก JSON ของแต่ละเจ้า บทนี้ให้ไลบรารีทำส่วนนั้นแทน:

| ในบท 006 (เขียนเอง) | ในบท 007 (LangChain ทำให้) |
|---|---|
| ประกอบ URL เช่น `/api/chat` หรือ `:generateContent` | ไม่ต้องเขียน มี `baseUrl` ของ Ollama หรือ `model` ของ Google ก็พอ |
| ประกอบ `headers` และใส่ key เอง | ส่ง `apiKey` (Google) หรือ `headers` (Ollama Cloud) ให้ตอนสร้างโมเดลครั้งเดียว |
| ประกอบ `body` (`messages` หรือ `contents`/`parts`) | ส่งคำถามเป็น string ธรรมดาเข้า `invoke` |
| `fetch`, ตรวจ `res.ok`, `res.json()` | `await model.invoke(...)` บรรทัดเดียว |
| ขุดคำตอบเอง (`message.content` หรือ `candidates[0].content.parts`) | อ่าน `res.text` เหมือนกันทุกเจ้า |
| ตัว response แต่ละเจ้ารูปร่างต่างกัน | ทุกเจ้าคืน `AIMessage` หน้าตาเดียวกัน |

สิ่งที่ยังเหมือนเดิม: โมเดลยังไม่จำการเรียกครั้งก่อน และคำตอบยังเปลี่ยนไปทุกครั้ง (บท 001)

## เนื้อหา

บทนี้ต้องผ่านบท 003 หรือ 004 (สำหรับไฟล์ `.ollama.ts`) และบท 005 (สำหรับไฟล์ `.google.ts`) ก่อน ตรวจด้วย `pnpm preflight`

### 1. LangChain คืออะไร และแพ็กเกจที่ใช้

**LangChain** คือไลบรารีที่ห่อการเรียกโมเดลของหลายเจ้าให้ใช้ท่าเดียวกัน (ท่านี้เรียกว่า interface กลาง) ถ้าเปลี่ยนเจ้าที่ใช้ โค้ดส่วนที่เหลือแทบไม่ต้องเปลี่ยน แพ็กเกจที่ใช้ในบทนี้ติดตั้งไว้ใน `package.json` แล้ว (รัน `pnpm install` ถ้ายังไม่ได้ติดตั้ง):

| แพ็กเกจ | ให้อะไร |
|---|---|
| `@langchain/core` | ชนิดกลาง เช่น `AIMessage` (ข้อความที่โมเดลตอบ) |
| `@langchain/ollama` | `ChatOllama` สำหรับเรียก Ollama |
| `@langchain/google` | `ChatGoogle` สำหรับเรียก Gemini |

คำว่า **chat model** คือโมเดลที่รับ "ข้อความ" เข้าไปและตอบเป็น "ข้อความ" ออกมา ซึ่งคือโมเดลที่เราใช้มาตลอด (บท 006 ก็ส่ง `messages` ไปเหมือนกัน)

### 2. ไฟล์ตัวอย่างมี 2 ขั้น

- **ขั้นที่ 1: `content` กับ `.text`** สร้าง `AIMessage` เอง 2 แบบแล้วพิมพ์ ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
- **ขั้นที่ 2: ถามโมเดลจริง** ส่งคำถามเดียวกับบท 006 แล้วพิมพ์คำตอบ ผลเปลี่ยนได้ทุกครั้ง

ไฟล์เขียนเป็นฟังก์ชัน `export async function main()` ตัวรันของคอร์สจะเรียก `main()` ให้เอง (ใน `pnpm lesson ...`)

### 3. สร้างโมเดล

Ollama:

```ts
const apiKey = optionalEnv("OLLAMA_API_KEY");
const model = new ChatOllama({
  model: env("OLLAMA_MODEL"),
  baseUrl: env("OLLAMA_BASE_URL"),
  headers: apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
});
```

Google:

```ts
const model = new ChatGoogle({ model: env("GOOGLE_MODEL"), apiKey: env("GOOGLE_API_KEY") });
```

- `env("...")` คือฟังก์ชันของคอร์สอ่านค่าจาก `.env` ถ้ายังไม่ได้ตั้งจะบอกว่าต้องไปดูบทไหน
- **ห้ามเขียนชื่อโมเดลในโค้ด** ให้อ่านจาก `.env` เสมอ (`pnpm check` จะจับให้) ชื่อโมเดลเปลี่ยนบ่อย เปลี่ยนที่เดียวใน `.env` แล้วทุกบทใช้ตามได้
- `OLLAMA_API_KEY` ใช้เฉพาะตอนยิง Ollama Cloud ตรง (บท 004) ถ้าไม่ตั้งก็ไม่ใส่ header เหมือนในบท 006
- สร้างโมเดลครั้งเดียวไว้บนสุดของไฟล์ แล้วเรียก `invoke` กี่ครั้งก็ได้ การสร้างโมเดลไม่ได้ยิงเน็ต แค่เก็บค่าตั้งไว้

### 4. `invoke` และ `AIMessage`

```ts
const res = await model.invoke("แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง");
console.log(res.text);
```

- `invoke` คือคำสั่ง "ส่งไปหนึ่งครั้ง รอคำตอบเต็ม" ส่ง string ได้เลย LangChain ห่อเป็นข้อความ role `user` ให้เอง (เหมือน `messages: [{ role: "user", content: ... }]` ในบท 006)
- ต้อง `await` เพราะ `invoke` คืน `Promise`
- สิ่งที่ได้กลับมาคือ **`AIMessage`** หนึ่งก้อน ข้อมูลของคำตอบทั้งหมดอยู่ในนั้น (บท 008 จะแกะทีละฟิลด์) บทนี้ใช้แค่ข้อความคำตอบ

### 5. `.content` กับ `.text` ต่างกันอย่างไร

`AIMessage` เก็บข้อความไว้ที่ `content` ซึ่งเป็นได้ **2 แบบ**:

```
content แบบข้อความ: "สวัสดีครับ"
content แบบ array: [{"type":"text","text":"สวัสดี"},{"type":"text","text":"ครับ"}]
```

- **แบบข้อความ** คือ string ธรรมดา (Ollama มักเป็นแบบนี้)
- **แบบ array** คือรายการของชิ้นข้อความ (block) แต่ละชิ้นมี `type` กับ `text` (Gemini บางครั้งคืนแบบนี้ ขึ้นกับโมเดลและโหมดที่ใช้)
- ถ้าเขียน `console.log(res.content)` กับแบบ array จะได้ `[object Object]` หรือ array ทั้งก้อน ไม่ใช่ข้อความที่อ่านได้ และ TypeScript ก็บอกว่า `content` เป็นชนิด `string | array` ใช้เป็น string ตรงๆ ไม่ได้
- **`res.text` ต่อข้อความของทุกชิ้นเป็น string เดียวให้เสมอ** ไม่ว่า `content` จะเป็นแบบไหน (ชิ้นที่ไม่ใช่ข้อความ เช่น ความคิดของโมเดล จะไม่ถูกรวม) ดังนั้น **ใช้ `.text` เสมอ** เมื่อต้องการข้อความคำตอบ

## จุดที่มักพลาด

- **ใช้ `res.content` แทน `res.text`:** กับ Ollama มักดูเหมือนใช้ได้ แต่พอสลับไปใช้ Gemini อาจได้ array โค้ดจะพังเงียบๆ
- **ลืม `await`:** ได้ `Promise` แทน `AIMessage` แล้ว `res.text` เป็น `undefined`
- **เขียนชื่อโมเดลในโค้ด:** ใช้ `env("OLLAMA_MODEL")` หรือ `env("GOOGLE_MODEL")` เสมอ
- **ใส่ `models/` นำหน้า `GOOGLE_MODEL`:** ใส่ชื่อเปล่า เหมือนบท 006
- **ลืมเปิด Ollama:** ถ้าใช้ Ollama ในเครื่อง จะเจอ `fetch failed` ให้เปิดแอป Ollama (บท 003)
- **ชื่อโมเดลไม่ตรงกับ `ollama list`:** ได้ error 404 `model not found` ให้เทียบ `OLLAMA_MODEL` ใน `.env` กับ `ollama list`
- **ยังไม่ได้ตั้ง `GOOGLE_API_KEY`:** ไฟล์ `.google.ts` จะหยุดพร้อมบอกให้ไปดูบท 005
- **เจอ 429:** เรียกถี่เกินโควต้า รอสักครู่แล้วรันใหม่

## วิธีรัน

Ollama (ในเครื่องหรือ Cloud ตามที่ตั้งไว้ใน `.env`):

```bash
pnpm lesson 007 example.ollama
pnpm lesson 007 exercise-1.ollama
pnpm lesson 007 exercise-2.ollama
pnpm lesson 007 exercise-3.ollama
```

Google:

```bash
pnpm lesson 007 example.google
pnpm lesson 007 exercise-1.google
pnpm lesson 007 exercise-2.google
pnpm lesson 007 exercise-3.google
```

คำสั่งเหมือนกันทั้ง macOS และ PowerShell

**ไฟล์แบบฝึกที่ยังไม่ได้เติมจะไม่เรียกโมเดล:** ตอนรันครั้งแรก `exercise-*` จะพิมพ์ข้อความที่ขึ้นต้น 👉 บอกว่ายังต้องเติมอะไร แล้วจบโดยไม่เสีย token (ในไฟล์มีบล็อก `if` สั้นๆ ทำหน้าที่นี้ ลบทิ้งได้เมื่อเติมเสร็จ) แบบฝึกในบทต่อไปใช้วิธีเดียวกัน

ถ้ารันแล้วเจอ error เรื่อง `.env` ให้รัน `pnpm preflight` ดูว่าขาดอะไร

## ผลที่ควรเห็น

### ขั้นที่ 1: ต้องตรงทุกตัว

ส่วนนี้ไม่ขึ้นกับโมเดล ต้องเหมือนกันทุกครั้ง ทั้ง `example.ollama` และ `example.google`:

```
--- ขั้นที่ 1: content กับ .text ---
content แบบข้อความ: "สวัสดีครับ"
content แบบ array: [{"type":"text","text":"สวัสดี"},{"type":"text","text":"ครับ"}]
.text ของทั้งสองแบบ: สวัสดีครับ | สวัสดีครับ
```

ดูบรรทัดสุดท้าย: 2 แบบของ `content` ที่หน้าตาต่างกัน ได้ `.text` เหมือนกัน

### ขั้นที่ 2: เทียบกับ checklist

ต่อจากบรรทัด `--- ขั้นที่ 2: ถามด้วย ChatOllama ---` (ไฟล์ google เป็น `ChatGoogle`) จะเป็นคำตอบของโมเดล ซึ่ง **เปลี่ยนไปทุกครั้งที่รัน** ตัวอย่างที่เห็นตอนทดสอบกับ Ollama:

```
--- ขั้นที่ 2: ถามด้วย ChatOllama ---
คำตอบ: แนะนำ **ดริปเปอร์กาแฟ V60 ขนาด 1–2 คัพ** ราคาประมาณ **250–500 บาท**
เหมาะกับเพื่อนที่ชอบกาแฟ เพราะใช้ทำกาแฟดริปได้จริง ใช้งานง่าย และเป็นของขวัญที่ดูตั้งใจแต่ไม่แพงเกินงบค่ะ
```

อย่าเทียบตัวอักษร ให้ตรวจตาม checklist นี้:

**`example.*`**
- [ ] ขั้นที่ 1 ตรงกับด้านบนทุกตัวอักษร
- [ ] ขั้นที่ 2 มีบรรทัดที่ขึ้นต้น `คำตอบ: ` ตามด้วยข้อความภาษาไทย ยาว 20 ตัวอักษรขึ้นไป

**`exercise-1.*`**
- [ ] พิมพ์ `คำตอบ: ` ตามด้วยข้อความภาษาไทยยาว 20 ตัวอักษรขึ้นไป (โมเดลที่คุณสร้างเองต้องเรียกได้จริง)

**`exercise-2.*`**
- [ ] มีบรรทัด `ชนิดของ content: string` หรือ `ชนิดของ content: array` (Ollama มักได้ `string`)
- [ ] มีบรรทัด `text: ` ตามด้วยข้อความภาษาไทย

**`exercise-3.*`**
- [ ] มีบรรทัด `โมเดล: ` ตามด้วยชื่อที่ตรงกับ `OLLAMA_MODEL` (ไฟล์ ollama) หรือ `GOOGLE_MODEL` (ไฟล์ google) ใน `.env` ของคุณทุกตัวอักษร
- [ ] ตามด้วย `คำตอบ: ` ที่เป็นภาษาไทย

> โมเดลอาจใส่เครื่องหมาย `**` (Markdown ตัวหนา) มาในคำตอบ ไม่ใช่บั๊ก

> หมายเหตุ: ผลของไฟล์ `.google.ts` ในบทนี้ยังไม่ได้ทดสอบกับ key ของ Google จริง ตัวอย่างข้างบนของขั้นที่ 2 มาจากการรันแบบ Ollama

> TODO(6b): ตรวจว่า `ChatGoogle` คืน `content` เป็น string หรือ array ในโมเดลที่คอร์สใช้ แล้วแก้ข้อความ "Gemini บางครั้งคืนแบบนี้" ในหัวข้อ 5 ให้ตรงของจริง และตรวจว่า `model.model` ของ `ChatGoogle` เท่ากับ `GOOGLE_MODEL` (exercise-3)

## แบบฝึกหัด

ทำทั้งแบบ `.ollama.ts` และ `.google.ts` ของแต่ละข้อ

1. **`exercise-1.*`:** มี 👉 1 จุด เขียนฟังก์ชัน `createModel()` ให้สร้างโมเดลจาก `.env` เอง (ดู `example.*` ข้างๆ) แล้วถามคำถามเดิม ผลที่ต้องเห็นคือ `คำตอบ: ...` ต้องเพิ่ม `import` ของ `env` (และ `optionalEnv` สำหรับ Ollama) ที่หัวไฟล์เอง
2. **`exercise-2.*`:** เติม `contentKind(content)` ให้บอกว่า `content` เป็น `"string"` หรือ `"array"` (ใช้ `typeof` หรือ `Array.isArray`) แล้วพิมพ์ `ชนิดของ content: ...` และ `text: ...` ของคำตอบจริง
3. **`exercise-3.*` ⭐:** เติม `modelName(m)` ให้อ่านชื่อโมเดลจากตัวโมเดลเอง (ฟิลด์ `model`) แล้วพิมพ์ `โมเดล: ...` ตามด้วยคำตอบ ชื่อต้องตรงกับที่ตั้งใน `.env`

ไฟล์แบบฝึกมี 👉 และค่าชั่วคราวไว้ให้รันได้ (ตัวที่ยังไม่เติมจะหยุดและบอกว่าต้องเติมอะไร) แต่ผลจะยังไม่ผ่าน checklist จนกว่าจะแก้ครบ ถ้าติด ลองเปิดไฟล์ `example.*` ข้างๆ และอ่านเฉลยบน branch `solutions` เมื่อทำเองแล้ว

## อ่านเพิ่ม

- [LangChain.js: Chat models](https://docs.langchain.com/oss/javascript/langchain/models)
- [`@langchain/ollama` (ChatOllama)](https://docs.langchain.com/oss/javascript/integrations/chat/ollama)
- [`@langchain/google` (ChatGoogle)](https://docs.langchain.com/oss/javascript/integrations/chat/google)
