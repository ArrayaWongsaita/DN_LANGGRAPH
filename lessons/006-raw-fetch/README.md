# บท 006: เรียก LLM ด้วย `fetch` ตรงๆ

บทนี้เป็นบทแรกที่เรียก LLM จริง โดยยังไม่ใช้ไลบรารีใดเลย ใช้เวลาประมาณ 45-60 นาที ทำทั้งแบบ Ollama (ไฟล์ `.ollama.ts`) และแบบ Google (ไฟล์ `.google.ts`) เพื่อเทียบกัน

## จบบทนี้แล้วทำอะไรได้

- ส่งคำถามไปหา LLM ด้วย `fetch` และอ่านคำตอบจาก JSON ที่ได้กลับมา
- อธิบายได้ว่า request ของ LLM ประกอบด้วยอะไร: URL, headers, body
- รู้ว่า API key ส่งทาง header และต้องปิดค่าก่อนพิมพ์ขึ้นหน้าจอ
- อ่านจำนวน token ขาเข้า/ขาออกจาก response ดิบได้
- เห็นด้วยตัวเองว่าถามคำถามเดิมซ้ำ คำตอบเปลี่ยนได้

## เชื่อมกับที่รู้แล้ว

คุณเรียก REST API ด้วย `fetch` มาแล้ว การเรียก LLM ก็เหมือนกันทุกอย่าง:

| ที่คุ้นเคย | ในบทนี้ |
|---|---|
| `fetch(url, { method: "POST", headers, body })` | เหมือนเดิม |
| body เป็น JSON ที่ `JSON.stringify` | เหมือนเดิม |
| `await res.json()` แล้วได้ object | เหมือนเดิม แต่คำตอบอยู่ลึกใน object |
| ตรวจ `res.ok` แล้ว throw | เหมือนเดิม |
| Authorization header ส่ง token | Gemini ใช้ header `x-goog-api-key` ส่วน Ollama Cloud ใช้ `Authorization: Bearer` |

สิ่งที่ต่างคือ **คำตอบไม่เหมือนเดิมทุกครั้ง** (บท 001) และ response แต่ละเจ้ามีรูปร่างไม่เหมือนกัน ตอนนี้ยังไม่มีไลบรารีช่วย เราจะเห็นของจริงข้างใต้ก่อน

## เนื้อหา

บทนี้ต้องผ่านบท 003 หรือ 004 (สำหรับไฟล์ `.ollama.ts`) และบท 005 (สำหรับไฟล์ `.google.ts`) ก่อน ตรวจด้วย `pnpm preflight`

### 1. token คืออะไร

โมเดลไม่ได้อ่านเป็นตัวอักษร แต่อ่านเป็นชิ้นส่วนของข้อความเรียกว่า **token** (ประมาณ 1 คำ หรือชิ้นส่วนของคำ) ข้อความภาษาไทยมักใช้ token ต่อตัวอักษรมากกว่าภาษาอังกฤษ provider นับ token สองฝั่ง: **ขาเข้า** คือคำถามที่เราส่ง และ **ขาออก** คือคำตอบที่โมเดลสร้าง ค่าบริการและขีดจำกัดของ provider อ้างอิงจากจำนวนนี้ (บท 001 พูดถึงไว้แล้ว) บทนี้เราจะอ่านตัวเลขนี้จาก response ดิบ

### 2. ไฟล์ตัวอย่างมี 2 ขั้น

ทุกไฟล์ในช่วงทดลองแบ่งเป็น 2 ขั้น:

- **ขั้นที่ 1: ประกอบคำขอ** ฟังก์ชัน `buildRequest(question)` สร้าง URL, headers และ body แล้วพิมพ์ออกมา ขั้นนี้ไม่ยิงเน็ต ผลเหมือนกันทุกครั้ง
- **ขั้นที่ 2: ส่งจริง** ส่งด้วย `fetch` แล้วพิมพ์คำตอบ ขั้นนี้ผลเปลี่ยนได้ทุกครั้ง

ในไฟล์จะเห็น `await` อยู่นอกฟังก์ชัน (top-level await) ใช้ได้เพราะโปรเจกต์นี้เป็น ES module

### 3. คำขอของ Ollama

```
POST {OLLAMA_BASE_URL}/api/chat
```

body ที่ส่ง:

```json
{
  "model": "<ชื่อโมเดล>",
  "messages": [{ "role": "user", "content": "<คำถาม>" }],
  "stream": false
}
```

- `messages` คือรายการข้อความ แต่ละข้อความมี `role` และ `content` โดย `user` คือเรา (ยังมี `assistant` คือโมเดล และ `system` คือคำสั่งตั้งต้น ซึ่งจะใช้ในบทหลัง) **โมเดลจำการเรียกครั้งก่อนไม่ได้** ถ้าอยากให้จำ เราต้องส่งประวัติทั้งหมดไปใหม่ทุกครั้ง
- header `Content-Type: application/json` บอกเซิร์ฟเวอร์ว่า body เป็น JSON
- `stream: false` บอกให้ส่งคำตอบกลับมาทีเดียว (ถ้าไม่ใส่ Ollama จะส่งเป็นชิ้นๆ ต่อเนื่อง ซึ่งเราจะเรียนในช่วงหลัง)
- ถ้าตั้ง `OLLAMA_API_KEY` (ยิงตรงไป Ollama Cloud) ไฟล์จะใส่ header `Authorization: Bearer <key>` ให้ (`Bearer` คือรูปแบบมาตรฐานของการส่ง token ใน header) ถ้าไม่ตั้งก็ไม่ใส่
- คำตอบอยู่ที่ `message.content`
- จำนวน token อยู่ที่ `prompt_eval_count` (ขาเข้า) และ `eval_count` (ขาออก)

response ที่ได้กลับมา ตัดให้เหลือเฉพาะฟิลด์ที่เราใช้ (ของจริงมีฟิลด์อื่นอีก):

```json
{
  "message": { "role": "assistant", "content": "แนะนำ ดริปเปอร์กาแฟ ..." },
  "prompt_eval_count": 56,
  "eval_count": 543
}
```

### 4. คำขอของ Google (Gemini)

```
POST https://generativelanguage.googleapis.com/v1beta/models/{GOOGLE_MODEL}:generateContent
```

- key ส่งใน header `x-goog-api-key` **ไม่ใส่ใน URL** เพราะ URL มักถูกบันทึกลง log และลืมลบตอน commit ได้ง่าย
- body: `{ "contents": [{ "role": "user", "parts": [{ "text": "<คำถาม>" }] }] }`
- `role` และการที่โมเดลไม่จำการเรียกครั้งก่อน เหมือนที่อธิบายในหัวข้อ Ollama
- header `Content-Type: application/json` บอกเซิร์ฟเวอร์ว่า body เป็น JSON
- คำตอบอยู่ที่ `candidates[0].content.parts` ซึ่งเป็นรายการ ให้เอาแต่ละ part ที่ `thought` ไม่ใช่ `true` แล้วนำ `text` มาต่อกัน (ถ้ามี part ที่ `thought: true` คือส่วนที่โมเดลคิดในใจ ไม่ใช่คำตอบ ต้องข้าม) ถ้าไม่มีข้อความเลย (เช่นถูกบล็อก หรือตอบไม่จบ) ไฟล์ตัวอย่างจะ throw พร้อม `finishReason` และ `promptFeedback` ให้อ่านเหตุผล
- จำนวน token ขาเข้าอยู่ที่ `usageMetadata.promptTokenCount` ส่วน **ขาออกในบทนี้ = `candidatesTokenCount` + `thoughtsTokenCount`** (ถ้าไม่มีฟิลด์ไหนให้ถือเป็น 0) เพราะโมเดลแบบคิดก่อนตอบใช้ token ไปกับการคิดด้วย ซึ่งนับเป็นขาออกเช่นเดียวกับ `eval_count` ของ Ollama ตามที่เอกสาร usage ของ Gemini ระบุ แต่กฎการคิดเงินที่แน่นอนให้ตรวจที่หน้า pricing ของ Google อีกครั้ง

response ของ Gemini (ตัดเหลือฟิลด์ที่ใช้ ตามเอกสาร):

```json
{
  "candidates": [{ "content": { "parts": [{ "text": "แนะนำ ..." }] }, "finishReason": "STOP" }],
  "usageMetadata": { "promptTokenCount": 56, "candidatesTokenCount": 120, "thoughtsTokenCount": 300 }
}
```

### 5. ทำไมประกาศ interface ของ response

`await res.json()` ให้ค่าชนิด `any` ซึ่งปิดการตรวจชนิดของ TypeScript ทิ้ง เราจึงบอกรูปร่างเองด้วย `interface` เล็กๆ เฉพาะฟิลด์ที่ใช้ แล้ว cast ด้วย `as` (response ของ provider ส่งฟิลด์อื่นมาอีกมาก เราไม่ต้องประกาศทั้งหมด) ฟิลด์ที่อาจไม่มีใส่ `?` และใช้ `??` ตั้งค่าตั้งต้น ข้อควรระวัง: `as` เป็นแค่การบอก TypeScript ไม่ได้ตรวจว่า response หน้าตาตรงจริง ถ้า provider เปลี่ยนรูปแบบ โค้ดจะพังตอนรันโดย TypeScript ไม่เตือน

## จุดที่มักพลาด

- **ลืม `await res.json()`:** ได้ `Promise` แทน object แล้วอ่าน `data.message` ได้ `undefined` จำไว้ว่าทั้ง `fetch` และ `res.json()` ต้อง `await`
- **URL มี `/` ซ้ำ:** `OLLAMA_BASE_URL` ที่ลงท้ายด้วย `/` ทำให้ได้ `//api/chat` (`env()` ตัด `/` ท้ายให้แล้ว แต่ถ้าต่อ URL เอง ระวังเรื่องนี้)
- **ใส่ `models/` นำหน้าชื่อโมเดลของ Google:** `GOOGLE_MODEL` ให้ใส่ชื่อเปล่า เช่นไม่ใช่ `models/ชื่อ` (ไฟล์ในบทนี้ตัด `models/` นำหน้าให้ แต่บทหลังอาจไม่ตัด)
- **ใส่ key ใน URL แล้วเผลอ commit:** เช่น `...:generateContent?key=...` ใช้ header `x-goog-api-key` เสมอ และเก็บ key ใน `.env` เท่านั้น
- **ลืมเปิด Ollama:** ถ้าใช้ Ollama ในเครื่อง จะเจอ `fetch failed` หรือ `ECONNREFUSED` ให้เปิดแอป Ollama (บท 003)
- **ชื่อโมเดลไม่ตรงกับ `ollama list`:** ได้ error 404 `model not found` ให้เทียบ `OLLAMA_MODEL` ใน `.env` กับชื่อใน `ollama list` ทีละตัวอักษร
- **เจอ 429:** แปลว่าเรียกถี่เกินโควต้า รอสักครู่แล้วรันใหม่ (Google ฟรีมีโควต้าต่อนาทีและต่อวัน) ไฟล์ตัวอย่างจะ throw พร้อมสถานะและข้อความเต็มจาก provider ให้อ่านได้
- **พิมพ์ headers ทั้งก้อนโดยไม่ปิด key:** ไฟล์ตัวอย่างมีฟังก์ชัน `maskHeaders` ปิดค่า key เป็น `***` ก่อนพิมพ์ ถ้าเขียนเองต้องทำแบบนี้ด้วย

## วิธีรัน

Ollama (ในเครื่องหรือ Cloud ตามที่ตั้งไว้ใน `.env`):

```bash
pnpm lesson 006 example.ollama
pnpm lesson 006 exercise-1.ollama
pnpm lesson 006 exercise-2.ollama
pnpm lesson 006 exercise-3.ollama
```

Google:

```bash
pnpm lesson 006 example.google
pnpm lesson 006 exercise-1.google
pnpm lesson 006 exercise-2.google
pnpm lesson 006 exercise-3.google
```

คำสั่งเหมือนกันทั้ง macOS และ PowerShell

**ไฟล์แบบฝึกที่ยังไม่ได้เติมจะไม่ยิง API:** ตอนรันครั้งแรก `exercise-1.*` จะพิมพ์ข้อความที่ขึ้นต้น 👉 บอกว่ายังต้องเติมอะไร แล้วจบโดยไม่ส่งคำขอและไม่เสีย token (ในไฟล์มีบล็อก `if` สั้นๆ ทำหน้าที่นี้ ลบทิ้งได้เมื่อเติมเสร็จ) แบบฝึกในบทต่อไปจะใช้วิธีเดียวกัน 

ถ้ารันแล้วเจอ error เรื่อง `.env` ให้รัน `pnpm preflight` ดูว่าขาดอะไร

## ผลที่ควรเห็น

### ขั้นที่ 1: ต้องตรงทุกตัว

ส่วนนี้ไม่ขึ้นกับโมเดล ต้องเหมือนกันทุกครั้ง (ยกเว้นส่วนที่เป็นค่าของคุณ ซึ่งแสดงด้วย `<...>`)

`pnpm lesson 006 example.ollama` (Ollama ในเครื่อง ไม่มี `OLLAMA_API_KEY`):

```
--- ขั้นที่ 1: คำขอที่จะส่ง ---
URL: http://localhost:11434/api/chat
headers: {
  "Content-Type": "application/json"
}
body: {
  "model": "<ค่า OLLAMA_MODEL ของคุณ>",
  "messages": [
    {
      "role": "user",
      "content": "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง"
    }
  ],
  "stream": false
}
--- ขั้นที่ 2: ส่งด้วย fetch ---
```

ถ้าคุณตั้ง `OLLAMA_API_KEY` (Ollama Cloud) `URL` จะเป็น `https://ollama.com/api/chat` และ headers จะมีบรรทัดเพิ่ม `"Authorization": "Bearer ***"` (ค่า key ถูกปิดเป็น `***` เสมอ)

`pnpm lesson 006 example.google`:

```
--- ขั้นที่ 1: คำขอที่จะส่ง ---
URL: https://generativelanguage.googleapis.com/v1beta/models/<ค่า GOOGLE_MODEL ของคุณ>:generateContent
headers: {
  "Content-Type": "application/json",
  "x-goog-api-key": "***"
}
body: {
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "แนะนำของขวัญราคาไม่เกิน 500 บาทให้เพื่อนที่ชอบกาแฟ 1 อย่าง"
        }
      ]
    }
  ]
}
--- ขั้นที่ 2: ส่งด้วย fetch ---
```

### ขั้นที่ 2: เทียบกับ checklist

ต่อจากบรรทัด `--- ขั้นที่ 2 ---` จะเป็นคำตอบของโมเดล ซึ่ง **เปลี่ยนไปทุกครั้งที่รัน** ตัวอย่างที่เห็นตอนทดสอบกับ Ollama:

```
คำตอบ: แนะนำ **ดริปเปอร์กาแฟ V60 ขนาด 1–2 คัพ** ราคาประมาณ **250–500 บาท**
เหมาะกับเพื่อนที่ชอบกาแฟ เพราะใช้ทำกาแฟดริปได้จริง ใช้งานง่าย และเป็นของขวัญที่ดูตั้งใจแต่ไม่แพงเกินงบค่ะ
```

อย่าเทียบตัวอักษร ให้ตรวจตาม checklist นี้:

**`example.*`**
- [ ] จบด้วยบรรทัดที่ขึ้นต้น `คำตอบ: ` ตามด้วยข้อความภาษาไทย ยาว 20 ตัวอักษรขึ้นไป
- [ ] ขั้นที่ 1 มี `/api/chat` และ `"stream": false` (Ollama) หรือ `:generateContent` (Google)
- [ ] ไม่มีค่า key จริงอยู่ในผลที่พิมพ์

**`exercise-1.*`**
- [ ] พิมพ์ `คำตอบ: ` ตามด้วยข้อความภาษาไทยยาว 20 ตัวอักษรขึ้นไป (ข้อความคำตอบอย่างเดียว ไม่ใช่ JSON)

**`exercise-2.*`**
- [ ] มีบรรทัด `token ขาเข้า: N` และ `token ขาออก: N` โดย N เป็นเลขมากกว่า 0 (ตัวอย่าง: `token ขาเข้า: 56` และ `token ขาออก: 543` เลขจริงขึ้นกับโมเดลและความยาวคำตอบ)

**`exercise-3.*`**
- [ ] มี `ครั้งที่ 1:`, `ครั้งที่ 2:`, `ครั้งที่ 3:` ตามลำดับ แต่ละครั้งเป็นภาษาไทย ไม่ว่าง
- [ ] ทุกครั้งตามด้วยบรรทัด `(token N→M)` โดย N และ M มากกว่า 0
- [ ] ไม่ต้องกังวลถ้า 3 คำตอบไม่เหมือนกัน นั่นคือเรื่องปกติจากบท 001

> โมเดลอาจใส่เครื่องหมาย `**` (Markdown ตัวหนา) มาในคำตอบ ไม่ใช่บั๊ก

> หมายเหตุ: ผลของไฟล์ `.google.ts` ในบทนี้ยังไม่ได้ทดสอบกับ key ของ Google จริง ตัวอย่างข้างบนของขั้นที่ 2 มาจากการรันแบบ Ollama

## แบบฝึกหัด

ทำทั้งแบบ `.ollama.ts` และ `.google.ts` ของแต่ละข้อ เพื่อเทียบว่า 2 เจ้าต่างกันตรงไหน

1. **`exercise-1.*`:** มี 👉 2 จุด จุดแรกเติม `body` ให้มีคำถาม จุดที่สองดึงข้อความคำตอบออกจาก `data` ผลที่ต้องเห็นคือ `คำตอบ: ...`
2. **`exercise-2.*`:** ส่งคำถามแล้วอ่านจำนวน token จาก response ดิบ พิมพ์ `token ขาเข้า: N` และ `token ขาออก: N` (ฟิลด์อยู่ตรงไหนดูในหัวข้อเนื้อหา ขาออกของ Google ต้องบวก `thoughtsTokenCount` ด้วย ตอนเริ่มไฟล์จะพิมพ์ response ดิบให้ดูก่อน)
3. **`exercise-3.*` ⭐:** เขียนฟังก์ชัน `ask(question)` ที่คืน `{ text, inputTokens, outputTokens }` แล้วถามคำถามเดิม 3 รอบต่อกัน (รอบถัดไปเริ่มเมื่อรอบก่อนจบ ไม่ยิงพร้อมกัน) ดูว่าคำตอบเปลี่ยนไหม และจำนวน token เท่ากันทุกรอบไหม (ขาเข้ามักเท่ากัน ขาออกต่างกัน)

ไฟล์แบบฝึกมี 👉 ใส่ค่าชั่วคราวไว้ให้รันได้ (ข้อ 1 จะหยุดและบอกว่าต้องเติมอะไร ตามที่อธิบายในหัวข้อวิธีรัน) แต่ผลจะยังไม่ผ่าน checklist จนกว่าจะแก้ครบ ถ้าติด ลองเปิดไฟล์ `example.*` ข้างๆ และอ่านเฉลยบน branch `solutions` เมื่อทำเองแล้ว

## อ่านเพิ่ม

- [Ollama: API `/api/chat`](https://docs.ollama.com/api/chat)
- [Gemini API: `generateContent`](https://aistudio.google.com/api-reference/generate-content)
