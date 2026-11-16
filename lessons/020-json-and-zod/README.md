# บท 020: ให้โมเดลตอบเป็น JSON แล้วตรวจด้วย zod

ข้อความที่โมเดลตอบเอาไปใช้ต่อในโค้ดยาก เช่น "ราคา 380 บาทครับ" ต้องมาตัดคำเอง ถ้าให้ตอบเป็น JSON หน้าตาเดียวกันทุกครั้ง โค้ดก็ส่งต่อให้ฟังก์ชันอื่นได้ทันที แต่ JSON ที่โมเดลสร้างมาไม่น่าเชื่อถือ: อาจถูกห่อด้วย code fence, type ผิด หรือส่ง `null` มา บทนี้จึงสอนตรวจ JSON ด้วย **zod** ก่อนใช้ทุกครั้ง ใช้เวลาประมาณ 45-60 นาที ทำทั้งแบบ Ollama (`.ollama.ts`) และ Google (`.google.ts`)

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่าทำไมคำตอบแบบ JSON เอาไปใช้ต่อในโค้ดได้ง่ายกว่าข้อความธรรมดา
- เขียน schema ของ zod (`z.object`, `z.enum`, `.optional()`, `.describe()`) และอ่านชนิดผลลัพธ์ด้วย `z.infer`
- ตรวจคำตอบของโมเดลด้วย `safeParse` แทน `parse` แล้วพิมพ์ error ที่อ่านรู้เรื่องด้วย `z.prettifyError`
- แก้ปัญหา JSON ที่ถูกห่อด้วย ```` ```json ```` หรือมีข้อความนำด้วย `extractJson`
- เปิด JSON mode ของ provider และอธิบายได้ว่า JSON mode รับประกันแค่ว่าเป็น JSON ไม่ได้แปลว่าตรง schema

## เชื่อมกับที่รู้แล้ว

| ที่รู้แล้ว | ในบทนี้ |
|---|---|
| บท 017: system prompt บอกกฎ | บอกรูปแบบ JSON และค่าที่ `category` รับใน system prompt |
| บท 009: ข้อความ `system` / `user` | ส่งคำสั่งรูปแบบ JSON ไปใน system เหมือนเดิม |
| บท 014: เรียกโมเดลพร้อมกันได้ | ไม่ใช้ในบทนี้ เรียกทีละคำถามเพื่ออ่านผลง่ายๆ |
| `src/shop/products.ts`: `searchProducts` | ตัวกรองที่ได้จาก JSON ถูกส่งเข้า `searchProducts` ตรงๆ |
| `src/shop/types.ts`: `CATEGORIES`, `CATEGORY_LABELS` | ค่าที่ `z.enum` รับ และคำอธิบายไทยที่ต่อท้าย prompt |
| TypeScript: generic, `Record`, `unknown` | `z.ZodType<T>`, `z.infer` และผลของ `JSON.parse` ที่เป็น `any` |

## เนื้อหา

บทนี้ต้องผ่านบท 009 และ 017 ก่อน

### 1. ทำไมต้องเป็น JSON

เราอยากให้คำถาม "อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท" กลายเป็นตัวกรองที่เรียกฟังก์ชันได้:

```ts
export const SearchFilter = z
  .object({
    keyword: z.string().optional().describe("คำที่ใช้ค้นในชื่อสินค้า แท็ก หรือหมวดหมู่"),
    category: z.enum(CATEGORIES).optional().describe("หมวดหมู่สินค้า เลือกจากค่าที่กำหนดเท่านั้น"),
    maxPrice: z.number().optional().describe("ราคาสูงสุดที่ลูกค้ายอมจ่าย หน่วยเป็นบาท"),
  })
  .describe("ตัวกรองสำหรับค้นสินค้าในร้าน DN Shop");

export type SearchFilter = z.infer<typeof SearchFilter>;

const filter: SearchFilter = { keyword: "คั่วเข้ม", maxPrice: 400 };
const found = searchProducts(filter); // ส่งได้ตรงๆ ไม่ต้องแปลงอะไรอีก
```

ถ้าโมเดลตอบเป็นประโยค เราไม่มีทางรู้ว่าตัวเลขในประโยคคือราคาหรือจำนวนชิ้น และถ้าโมเดลเปลี่ยนถ้อยคำในรอบถัดไปโค้ดที่ตัดข้อความก็พัง JSON กำหนด **รูปทรง** ของข้อมูลให้คงที่: ชื่อ field, ชนิด, ค่าที่อนุญาต

`CATEGORY_GUIDE` ใน `search-filter.ts` สร้างจาก `CATEGORY_LABELS` เช่น `beans = เมล็ดกาแฟและกาแฟบด, drip-bags = กาแฟดริปซอง, …` แล้วต่อท้าย system prompt ให้โมเดลเห็นว่าค่าที่ถูกมีอะไรบ้าง ไม่ต้องพิมพ์รายการเองใน prompt

### 2. ขั้นที่ 1: ตรวจ JSON ด้วย zod (ข้อความตายตัว)

ขั้นนี้ไม่เรียกโมเดล ใช้ข้อความ 4 ก้อนที่ครอบปัญหาที่เจอบ่อย ผลต้องตรงทุกบรรทัด:

````
--- ขั้นที่ 1: ตรวจ JSON ด้วย zod (ข้อความตายตัว) ---
ข้อความที่ 1: {"keyword":"ดริป","maxPrice":200}
JSON.parse ตรงๆ: ผ่าน
zod: ผ่าน {"keyword":"ดริป","maxPrice":200}
เจอสินค้า: 3 ชิ้น
ข้อความที่ 2: ```json {"category":"drinkware"} ```
JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)
แกะเอาเฉพาะ {...} แล้ว: ผ่าน
zod: ผ่าน {"category":"drinkware"}
เจอสินค้า: 4 ชิ้น
ข้อความที่ 3: {"keyword":"แก้ว","maxPrice":"300"}
JSON.parse ตรงๆ: ผ่าน
zod: ไม่ผ่าน
  ✖ ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น ตัวเลข แต่ได้รับ string
    → at maxPrice
ข้อความที่ 4: {"keyword":null,"category":"gifts"}
JSON.parse ตรงๆ: ผ่าน
zod: ไม่ผ่าน
  ✖ ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น string แต่ได้รับ ไม่มีค่า (null)
    → at keyword
````

สิ่งที่เห็นจากทั้ง 4 ก้อน:

| ปัญหา | ข้อความที่ | ตัวจับ |
|---|---|---|
| JSON ถูกต้อง | 1 | `JSON.parse` ผ่าน แล้ว zod ผ่าน ได้จำนวนสินค้าจริง 3 ชิ้น (P006, P007, P013) |
| ถูกห่อด้วย ```` ```json ```` | 2 | `JSON.parse` ไม่ผ่าน (`SyntaxError`) แล้ว `extractJson` แกะเฉพาะ `{...}` ทำให้ผ่าน ได้ 4 ชิ้น (หมวด drinkware) |
| type ผิด (`"300"` แทน `300`) | 3 | zod ไม่ผ่าน ชี้ `→ at maxPrice` |
| ส่ง `null` ใน field ที่ `.optional()` | 4 | zod ไม่ผ่าน บอก `ไม่มีค่า (null)` |

`z.prettifyError` พิมพ์ error ทุกจุดพร้อมตำแหน่ง field และ `z.config(z.locales.th())` ที่เรียกครั้งเดียวหลัง import ทำให้ข้อความเป็นภาษาไทย ทั้งไฟล์ที่พิมพ์ error ของ zod ต้องเรียกบรรทัดนี้ ไม่งั้นข้อความจะเป็นภาษาอังกฤษ

### 3. ขั้นที่ 2: ขอ JSON จากโมเดลจริง

`SYSTEM` บอกรูปแบบ JSON ด้วยมือ (`{"keyword": …, "category": …, "maxPrice": …}`) ใส่ `CATEGORY_GUIDE` และบอกว่า "ไม่ใส่ field ที่ลูกค้าไม่ได้พูดถึง" แล้วถาม `QUESTIONS` 3 ข้อ:

1. `อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท`
2. `มีแก้วกาแฟอะไรบ้าง`
3. `ของขวัญให้แฟนที่ชอบกาแฟ ราคาไม่เกิน 800`

แต่ละข้อพิมพ์ `--- คำถามที่ N: … ---`, `คำตอบดิบ:` (บรรทัดเดียว ไม่เกิน 200 ตัวอักษร) แล้วตรวจด้วยลำดับเดียวกับขั้นที่ 1: `JSON.parse` ตรงๆ → ถ้าไม่ผ่าน `extractJson` → `zod.safeParse` → `searchProducts` นับสินค้า ท้ายสุด `สรุป: zod ผ่าน X/3`

เลข X คือจำนวนข้อที่ zod ผ่าน เกณฑ์ตรวจต้องการอย่างน้อย 2/3 และตัวเลขสรุปต้องเท่ากับจำนวนบรรทัด `zod: ผ่าน` ที่พิมพ์จริง

**ผลของโมเดลอ้างอิง:** ในการทดลองของผู้สอนกับโมเดลที่ใช้พัฒนา โมเดลตอบ JSON เปล่าโดยไม่ห่อ code fence 5/5 ครั้ง ทั้งเปิดและไม่เปิด JSON mode แต่โมเดลอื่นห่อ ```` ```json ```` หรือมีข้อความนำได้บ่อย จึงต้องมี `extractJson` ไว้เสมอ ไม่ใช่เพราะโมเดลอ้างอิงทำ

### 4. ทวน zod ที่ใช้ในบทนี้

| วิธี | ทำอะไร |
|---|---|
| `z.object({...})` | กำหนดรูปทรง object และ field ที่รู้จัก |
| `z.enum(CATEGORIES)` | รับเฉพาะค่าที่อยู่ในรายการ (สังเกตว่าค่าที่รับได้ต้องบอกโมเดลใน prompt ด้วย) |
| `.optional()` | field นั้นไม่มีก็ได้ แต่ถ้าส่งมาต้องถูกชนิด — **ไม่รับ `null`** |
| `.nullish()` | ไม่มีก็ได้หรือเป็น `null` ก็ได้ ใช้เมื่อ provider ส่ง `null` บ่อย (ผลทดลองยังไม่ต้องใช้) |
| `.describe("…")` | คำอธิบาย field ที่ไปอยู่ใน JSON Schema ให้โมเดลเห็น (บท 021) |
| `z.infer<typeof S>` | แปลง schema เป็น type ของ TypeScript |
| `schema.safeParse(value)` | คืน `{ success, data }` หรือ `{ success, error }` ไม่ throw |
| `schema.parse(value)` | คืนข้อมูลหรือ throw — ไม่ควรใช้กับคำตอบโมเดลเพราะพังทั้งโปรแกรม |
| `z.prettifyError(error)` | พิมพ์ error หลายบรรทัดพร้อมตำแหน่ง field |
| `z.config(z.locales.th())` | เปลี่ยนข้อความ error เป็นภาษาไทย (เรียกครั้งเดียวหลัง import) |

`JSON.parse` คืน `any` — TypeScript ไม่ช่วยตรวจอะไรเลย ต้องเอาผลลัพธ์ไปผ่าน `safeParse` ทุกครั้ง การเขียน `JSON.parse(text) as SearchFilter` แล้วใช้ต่อทันทีคือการปิดตาเชื่อโมเดล

### 5. JSON mode รับประกันแค่ "เป็น JSON"

`exercise-2` เปิด JSON mode ของ provider (`format: "json"` บน Ollama, `responseMimeType: "application/json"` บน Gemini) แล้วถามชุดคำถามเดิม **โดยไม่ใช้ `extractJson`** เพื่อดูว่า `JSON.parse` ตรงๆ ผ่านกี่ข้อ

JSON mode ช่วยลดข้อความนำและ code fence แต่ไม่ได้ตรวจ schema: โมเดลยังส่ง type ผิดหรือ `null` ได้ และยังตอบ field แปลกๆ ได้ เพราะฉะนั้นยังต้อง `safeParse` เหมือนเดิม การรับประกันรูปทรงข้อมูลต้องใช้ structured output ของบท 021

## จุดที่มักพลาด

- **ใช้ `.optional()` แล้วเจอ `null`:** `.optional()` หมายถึง "ไม่ส่ง field นี้" ไม่ใช่ "ส่ง `null`" ถ้า provider ส่ง `null` บ่อยให้เปลี่ยนเป็น `.nullish()` (ผลทดลองของผู้สอนเจอ `null` 0 ครั้ง จึงยังใช้ `.optional()`)
- **ลืมบอกค่าที่ enum รับ:** ถ้า prompt ไม่ได้บอกว่า `category` มีค่าอะไร โมเดลจะเดาคำ เช่น `shoes` หรือ `เครื่องดื่ม` แล้ว zod ไม่ผ่าน
- **ลืมคำว่า JSON ใน prompt ตอนเปิด JSON mode:** provider บางเจ้าต้องเห็นคำว่า JSON ในข้อความจึงจะทำงานถูก (system ของบทนี้มีคำว่า JSON)
- **เชื่อ `JSON.parse` ว่าได้ type ตามที่หวัง:** มันคืน `any` ต้องตรวจด้วย zod ทุกครั้ง
- **ใช้ `parse` แทน `safeParse`:** คำตอบโมเดลผิดได้ทุกครั้ง ถ้า throw โปรแกรมทั้งโปรแกรมตาย ให้ใช้ `safeParse` แล้วพิมพ์เหตุเป็นภาษาไทย
- **ลืม `z.config(z.locales.th())`:** error ของ zod จะเป็นภาษาอังกฤษ และ `z.prettifyError` จะไม่ตรงกับผลที่ควรเห็น
- **คิดว่า JSON mode แก้ schema ให้:** JSON mode รับประกันแค่ว่า parse ได้ ไม่ได้ตรวจชื่อ field หรือชนิดข้อมูล

## วิธีรัน

Ollama (ในเครื่องหรือ Cloud ตามที่ตั้งไว้ใน `.env`):

```bash
pnpm lesson 020 example.ollama
pnpm lesson 020 exercise-1.ollama
pnpm lesson 020 exercise-2.ollama
```

Google:

```bash
pnpm lesson 020 example.google
pnpm lesson 020 exercise-1.google
pnpm lesson 020 exercise-2.google
```

คำสั่งเหมือนกันทั้ง macOS และ PowerShell ไฟล์แบบฝึกหัดที่ยังไม่ได้เติมจะพิมพ์ข้อความที่ขึ้นต้น 👉 แล้วจบโดยไม่เรียกโมเดล

## ผลที่ควรเห็น

### ขั้นที่ 1: ต้องตรงทุกตัว

ทั้ง `example.ollama` และ `example.google` พิมพ์ 20 บรรทัดตามที่แสดงในหัวข้อ 2 (บรรทัด `ข้อความที่ N:` มี JSON ยุบเป็นบรรทัดเดียว และ `z.prettifyError` ย่อหน้า 2 ช่อง)

### ขั้นที่ 2: เทียบกับ checklist

```
--- ขั้นที่ 2: ขอ JSON จากโมเดลจริง ---
--- คำถามที่ 1: อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท ---
คำตอบดิบ: <JSON ที่โมเดลตอบ บรรทัดเดียว>
JSON.parse ตรงๆ: ผ่าน
zod: ผ่าน {"keyword":"เมล็ดกาแฟคั่วเข้ม","category":"beans","maxPrice":400}
เจอสินค้า: 1 ชิ้น
...
สรุป: zod ผ่าน 3/3
```

**`example.ollama` และ `example.google`**
- [ ] ขั้นที่ 1 ตรงกับข้างบนทุกบรรทัด
- [ ] ขั้นที่ 1 มี `JSON.parse ตรงๆ: ไม่ผ่าน (SyntaxError)` 1 ครั้ง, `zod: ไม่ผ่าน` 2 ครั้ง, `เจอสินค้า: 3 ชิ้น` และ `เจอสินค้า: 4 ชิ้น`
- [ ] ขั้นที่ 1 มี `→ at maxPrice` และ `ไม่มีค่า (null)`
- [ ] ขั้นที่ 2 มี 3 ส่วนคำถามตามลำดับ แต่ละส่วนมี `คำตอบดิบ:` และ `zod: ผ่าน` หรือ `zod: ไม่ผ่าน`
- [ ] ทุกบรรทัด `zod: ผ่าน <JSON>` ตามด้วย `เจอสินค้า: N ชิ้น` ที่ N เท่ากับจำนวนสินค้าที่ `searchProducts(JSON นั้น)` คืนมา
- [ ] `สรุป: zod ผ่าน X/3` โดย X อย่างน้อย 2 และเท่ากับจำนวนบรรทัด `zod: ผ่าน`

**`exercise-1.*`**

```
ตรวจตัวอย่าง: {"action":"cancel","orderId":"O1002"} → ผ่าน
ตรวจตัวอย่าง: {"action":"delete","orderId":"O1002"} → ไม่ผ่าน
ตรวจตัวอย่าง: {"action":"cancel","orderId":"1002"} → ไม่ผ่าน
--- คำถามที่ 1: ขอยกเลิกคำสั่งซื้อ O1003 เพราะสั่งผิด ---
คำตอบดิบ: <JSON>
zod: ผ่าน {"action":"cancel","orderId":"O1003","reason":"สั่งผิด"}
สถานะ: ชำระเงินแล้ว รอจัดส่ง
--- คำถามที่ 2: คำสั่งซื้อ O1002 ถึงไหนแล้ว ---
...
--- คำถามที่ 3: ขอคืนเงิน O1001 ของแตก ---
...
สรุป: zod ผ่าน X/3
```

- [ ] บรรทัด `ตรวจตัวอย่าง:` ตรงทั้ง 3 บรรทัดตามลำดับ (ตัวอย่างที่ถูกต้องผ่าน ตัวอย่าง action ผิดไม่ผ่าน และ orderId ที่ไม่มี O ไม่ผ่าน)
- [ ] มี 3 ส่วนคำถามตามลำดับ ข้อที่ zod ผ่านได้ `action`/`orderId` เป็น `cancel O1003`, `status O1002`, `refund O1001` ตามลำดับข้อ
- [ ] ข้อที่ผ่านมีบรรทัด `สถานะ:` เท่ากับป้ายของ `getOrder(orderId, "C001")` เช่น O1003 คือ `ชำระเงินแล้ว รอจัดส่ง`
- [ ] คำสั่งซื้อที่ลูกค้าคนนี้ไม่มี (เช่น O1004 ของ C002) ต้องได้ `ไม่พบคำสั่งซื้อ O1004 ของลูกค้ารายนี้` เท่านั้น **ห้ามมีป้ายสถานะจริง** เพราะไฟล์ถามด้วย `getOrder(orderId, "C001")`
- [ ] `สรุป: zod ผ่าน X/3` โดย X อย่างน้อย 2 และเท่ากับจำนวนบรรทัด `zod: ผ่าน`

**`exercise-2.*`**

```
ตรวจตัวอย่าง: ตัวเลือกที่เพิ่ม {"format":"json"}
--- คำถามที่ 1: อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท ---
คำตอบดิบ: <JSON>
JSON.parse ตรงๆ: ผ่าน
zod: ผ่าน <JSON>
เจอสินค้า: N ชิ้น
...
JSON.parse ตรงๆ ผ่าน: A/3
zod ผ่าน: X/3
```

- [ ] มีบรรทัด `ตรวจตัวอย่าง: ตัวเลือกที่เพิ่ม {"format":"json"}` (Google: `{"responseMimeType":"application/json"}`)
- [ ] `JSON.parse ตรงๆ ผ่าน: 3/3` และ A เท่ากับจำนวนบรรทัด `JSON.parse ตรงๆ: ผ่าน`
- [ ] `zod ผ่าน: X/3` โดย X อย่างน้อย 2 และเท่ากับจำนวนบรรทัด `zod: ผ่าน`
- [ ] ทุกบรรทัด `zod: ผ่าน` ตามด้วย `เจอสินค้า: N ชิ้น` ที่ N ตรงกับ JSON นั้น

> หมายเหตุ: ผลของไฟล์ `.google.ts` ในบทนี้ยังไม่ได้ทดสอบกับ key ของ Google จริง

## แบบฝึกหัด

1. **`exercise-1.*`:** เติม `buildSchema()` ให้คืน `z.ZodType<OrderRequest>` โดย `orderId` ต้องตรง `/^O\d{4}$/` และมี `.describe` ไฟล์ขอให้โมเดลแปลงข้อความลูกค้า 3 ข้อความเป็น `OrderRequest` (`action`, `orderId`, `reason`) ตรวจด้วย schema แล้วใช้ **เฉพาะ** `orderId` กับ `CUSTOMER_ID` ค้นสถานะด้วย `getOrder` ข้อความตัวอย่างเช่น `ขอยกเลิกคำสั่งซื้อ O1003 เพราะสั่งผิด`
2. **`exercise-2.*`:** เติม `jsonModeOptions()` ให้คืนตัวเลือกเปิด JSON mode (`format: "json"` สำหรับ Ollama, `responseMimeType: "application/json"` สำหรับ Google) ไฟล์สร้างโมเดลด้วยตัวเลือกเดิม + ตัวเลือกที่เพิ่ม แล้วถาม `QUESTIONS` ชุดเดียวกับตัวอย่างโดยไม่ใช้ `extractJson` ดูว่า `JSON.parse` ตรงๆ ผ่านกี่ข้อ

ไฟล์แบบฝึกมี 👉 และค่าชั่วคราวไว้ให้รันได้ แต่ผลจะยังไม่ผ่าน checklist จนกว่าจะแก้ครบ ถ้าติด เปิดไฟล์ `example.*` ข้างๆ และอ่านเฉลยบน branch `solutions` เมื่อทำเองแล้ว

## อ่านเพิ่ม

- [Zod: Basic usage](https://zod.dev/basics) `z.object`, `.optional()`, `safeParse` และการอ่าน error
- [Zod: JSON Schema](https://zod.dev/json-schema) `z.toJSONSchema` ที่บท 021 ใช้
- [LangChain.js: Structured output](https://docs.langchain.com/oss/javascript/langchain/structured-output) ทางที่บท 021 จะใช้แทนการเขียน prompt เอง
- [Ollama: Structured outputs](https://docs.ollama.com/capabilities/structured-outputs) JSON mode และ schema ที่ Ollama รับ
- [Gemini API: Structured output](https://ai.google.dev/gemini-api/docs/structured-output) `responseMimeType` และ `responseSchema`
