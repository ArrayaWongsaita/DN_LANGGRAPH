# บท 021: withStructuredOutput ให้ LangChain จัดการ schema ให้

บท 020 เรียงเองทุกขั้น: เขียน prompt ขอ JSON, `JSON.parse`, ตรวจด้วย zod ถ้าโมเดลตอบผิดรูปก็ต้องเขียนตัวแก้เอง LangChain มีทางลัดคือ `withStructuredOutput` ซึ่งรับ schema ของ zod แล้วจัดการให้ครบ: แปลง schema เป็น JSON Schema, ส่งเป็นเครื่องมือให้โมเดลกรอก, แปลงคำตอบกลับเป็น object และตรวจด้วย zod อีกชั้น บทนี้ใช้มันแปลงคำถามลูกค้าเป็นตัวกรองค้นสินค้า ใช้เวลาประมาณ 45-60 นาที ทำทั้งแบบ Ollama (`.ollama.ts`) และ Google (`.google.ts`)

## จบบทนี้แล้วทำอะไรได้

- ใช้ `model.withStructuredOutput(schema, options)` แล้วได้ object ที่มี type ตาม schema
- อ่าน JSON Schema ที่ LangChain ส่งให้โมเดลด้วย `z.toJSONSchema` และรู้ว่า `.describe()` ไปอยู่ตรงไหน
- อธิบายความต่างของ `method: "functionCalling"` กับ `method: "jsonSchema"` และข้อจำกัดของแต่ละ provider
- แยกกรณีไม่สำเร็จ 2 แบบ: โมเดลไม่เรียกเครื่องมือ (`undefined`) กับ args ไม่ตรง schema (`OutputParserException`)
- ใช้ `.refine()` ตรวจเงื่อนไขที่ schema บอกโมเดลไม่ได้ เช่นรหัสสินค้าต้องมีจริง

## เชื่อมกับที่รู้แล้ว

| ที่รู้แล้ว | ในบทนี้ |
|---|---|
| บท 020: JSON + zod, `.optional()`, `safeParse`, JSON mode | `withStructuredOutput` ทำงานเดียวกับบท 020 แต่ LangChain ทำให้ทั้งหมด |
| บท 018: ใส่ข้อมูลสินค้าลง prompt | แบบฝึกหัดใส่ `catalogLines()` ใน system ให้โมเดลเลือกรหัสที่มีจริง |
| บท 019: วัดผลด้วยตัวเลขสรุป | นับ `แปลงสำเร็จ X/3` จากบรรทัดรายข้อ |
| `src/shop/products.ts`: `searchProducts`, `getProduct` | เอาตัวกรองที่ได้ไปค้นสินค้า และตรวจรหัสสินค้าในแบบฝึกหัด |
| `src/shop/types.ts`: `CATEGORIES`, `CATEGORY_LABELS` | ค่าที่ `z.enum` รับ และคำอธิบายที่ต่อท้าย system |
| TypeScript: `z.infer`, `ReturnType<typeof fn>` | ชนิดของผลที่ได้จาก schema ในแบบฝึกหัด |

## เนื้อหา

บทนี้ต้องผ่านบท 020 ก่อน

### 1. withStructuredOutput ทำงานอะไรให้

`withStructuredOutput(schema, options)` คืน Runnable ตัวใหม่ที่ทำงาน 4 ขั้น:

1. แปลง zod schema เป็น JSON Schema (`z.toJSONSchema`)
2. ส่ง JSON Schema นั้นไปกับ **เครื่องมือ (tool)** ชื่อที่เราตั้งใน `options.name`
3. ให้โมเดลกรอก arguments ของเครื่องมือแทนการตอบข้อความ
4. แปลง arguments กลับเป็น object แล้วตรวจด้วย zod อีกครั้ง

ขั้นที่ 1 ของไฟล์พิมพ์ schema ที่ LangChain เห็น (ไม่ยิงเน็ต) ผลต้องตรงทุกตัว:

```
--- ขั้นที่ 1: schema ที่ LangChain ส่งให้โมเดล ---
ชื่อเครื่องมือ: search_filter
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "keyword": {
      "description": "คำที่ใช้ค้นในชื่อสินค้า แท็ก หรือหมวดหมู่",
      "type": "string"
    },
    "category": {
      "description": "หมวดหมู่สินค้า เลือกจากค่าที่กำหนดเท่านั้น",
      "type": "string",
      "enum": [
        "beans",
        "drip-bags",
        "equipment",
        "drinkware",
        "gifts"
      ]
    },
    "maxPrice": {
      "description": "ราคาสูงสุดที่ลูกค้ายอมจ่าย หน่วยเป็นบาท",
      "type": "number"
    }
  },
  "additionalProperties": false,
  "description": "ตัวกรองสำหรับค้นสินค้าในร้าน DN Shop"
}
```

สังเกตว่า **`.describe()` คือคำอธิบายที่โมเดลเห็น** ทั้ง 3 field และตัว object มี `description` รวม 4 จุด ถ้าไม่ใส่ คำอธิบายจะว่างและโมเดลเดาความหมาย field เอง `.refine()` ต่างกัน: มันตรวจตอนรับผลบนเครื่องเรา ไม่ถูกส่งไปใน JSON Schema (ดูหัวข้อ 3)

### 2. เลือก method ตาม provider

`options.method` บอก LangChain ว่าจะส่ง schema ไปทางไหน:

| provider | ค่าเริ่มต้น | ใช้ได้กับ | บังคับเรียกเครื่องมือ |
|---|---|---|---|
| `ChatOllama` | `jsonSchema` (ส่ง schema ใน field `format`) | Ollama ในเครื่อง | ไม่ได้ |
| `ChatOllama` + `method: "functionCalling"` | function calling | Ollama ในเครื่องและ Ollama Cloud | ไม่ได้ (Ollama ไม่มี `tool_choice`) |
| `ChatGoogle` | `functionCalling` | Gemini | บังคับ (`tool_choice`) |

Ollama Cloud ไม่รองรับการส่ง schema ทาง `format` คอร์สจึงใช้ `method: "functionCalling"` กับ `.ollama.ts` ทุกไฟล์ ซึ่งใช้ได้ทั้งในเครื่องและ Cloud แต่เพราะบังคับให้เรียกเครื่องมือไม่ได้ โมเดลอาจตอบเป็นข้อความธรรมดาแล้ว LangChain คืน `undefined` (หัวข้อ 4) ไฟล์ `.google.ts` จึงส่งแค่ `{ name: "search_filter" }` เพราะค่าเริ่มต้นเป็น `functionCalling` ที่บังคับอยู่แล้ว

`TODO(6b): ยืนยันกับ Ollama Cloud และ Gemini จริง`

### 3. `.describe()` กับ `.refine()` ต่างกัน

- `.describe("…")` ไปอยู่ใน JSON Schema ที่โมเดลเห็น ช่วยให้โมเดลเลือกค่าและกรอก field ได้ถูก
- `.refine(fn, { message })` ทำงานหลังโมเดลตอบ บนเครื่องเรา ไม่ไปถึงโมเดล ใช้ตรวจเงื่อนไขที่ JSON Schema พูดไม่ได้ เช่น "รหัสสินค้านี้ต้องมีอยู่ในร้าน"

แบบฝึกหัดข้อ 1 ใช้ `.refine((id) => getProduct(id) !== undefined)` กับ `productId` เพราะ JSON Schema บอกได้แค่ว่าเป็น string ไม่รู้ว่ามีสินค้ารหัสนั้นจริงไหม ถ้าโมเดลเดารหัสที่ไม่มี `.refine` จะทำให้ `safeParse` ไม่ผ่านแล้ว LangChain throw `OutputParserException` แทนที่จะส่งรหัสผิดเข้าไปในตะกร้า

### 4. ไม่สำเร็จได้ 2 แบบ

`withStructuredOutput` ไม่ได้รับประกันว่าสำเร็จ 100% มีสองกรณีที่ต้องจัดการ:

| อาการ | เกิดเมื่อ | LangChain ทำอะไร | โค้ดของเราจัดการ |
|---|---|---|---|
| `undefined` | โมเดลตอบเป็นข้อความ ไม่ได้เรียกเครื่องมือ | คืน `undefined` (ไม่ throw) | พิมพ์ `แปลงไม่สำเร็จ: โมเดลไม่ได้เรียกเครื่องมือ` |
| `OutputParserException` | เรียกเครื่องมือแล้วแต่ args ไม่ตรง schema (enum ผิด, ขาด field, `maxPrice` เป็น string) | throw | พิมพ์ `แปลงไม่สำเร็จ: args ไม่ตรง schema → …` พร้อม `e.llmOutput` |

เพราะผลเป็น `SearchFilter | undefined` ต้องตรวจ `=== undefined` ก่อนใช้ทุกครั้ง และต้องครอบ `try/catch` เพื่อจับ `OutputParserException` (ถ้าปล่อยผ่าน โปรแกรมจะหยุดทั้งไฟล์) บท 022 จะเปิดดูคำตอบดิบของทั้งสองกรณีนี้

### 5. ขั้นที่ 2 และแบบฝึกหัด

ขั้นที่ 2 ถาม `QUESTIONS` 3 ข้อ โดย system คือ `แปลงคำถามของลูกค้าเป็นตัวกรองค้นสินค้า ใส่เฉพาะ field ที่ลูกค้าพูดถึง ตอบโดยเรียกเครื่องมือ search_filter เท่านั้น` ต่อด้วย `CATEGORY_GUIDE` แต่ละข้อพิมพ์อย่างใดอย่างหนึ่ง:

```
ตัวกรอง: {"keyword":"คั่วเข้ม","category":"beans","maxPrice":400}
เจอสินค้า: 1 ชิ้น: เมล็ดกาแฟคั่วเข้ม ดอยสะเก็ด 250 กรัม
```

หรือ `แปลงไม่สำเร็จ: …` แล้วสรุป `สรุป: แปลงสำเร็จ X/3`

แบบฝึกหัดต่อยอดสองเรื่อง: ข้อ 1 ใช้ `.refine` ตรวจรหัสสินค้าที่โมเดลแนะนำ ข้อ 2 ฝึกเขียน schema ของตะกร้าที่มี `.describe` ครบและตรวจจำนวนด้วย `.int().min(1)`

## จุดที่มักพลาด

- **ลืมตรวจ `undefined`:** Ollama บังคับเรียกเครื่องมือไม่ได้ ถ้าเอา `undefined` ไปใช้ต่อจะพังทันที
- **ไม่จับ `OutputParserException`:** args ที่ไม่ตรง schema ทำให้ throw ไม่ใช่คืน `undefined` สองกรณีนี้ต้องจัดการแยกกัน
- **ใช้ `method: "jsonSchema"` กับ Ollama Cloud:** Cloud ไม่รองรับการส่ง schema ทาง `format` ให้ใช้ `functionCalling` (หรือค่าเริ่มต้นของ `ChatGoogle`)
- **คิดว่า `.refine()` ช่วยให้โมเดลตอบถูก:** `.refine` ไม่ไปถึงโมเดล มันแค่ทำให้ผลที่ไม่ผ่านถูกปฏิเสธ ถ้าอยากให้โมเดลรู้เงื่อนไขต้องเขียนใน `.describe()` หรือ system ด้วย
- **ลืม `.describe()`:** โมเดลเห็นแค่ชื่อ field กับชนิด ไม่รู้ว่าต้องใส่อะไร
- **ประกาศชนิดผลผิด:** `withStructuredOutput` คืน `SearchFilter` ตาม type แต่ค่าจริงอาจเป็น `undefined` ต้องประกาศเป็น `SearchFilter | undefined`
- **ใส่ชื่อโมเดลในโค้ด:** อ่านจาก `.env` ผ่าน `env()` เหมือนทุกบท

## วิธีรัน

Ollama (ในเครื่องหรือ Cloud ตามที่ตั้งไว้ใน `.env`):

```bash
pnpm lesson 021 example.ollama
pnpm lesson 021 exercise-1.ollama
pnpm lesson 021 exercise-2.ollama
```

Google:

```bash
pnpm lesson 021 example.google
pnpm lesson 021 exercise-1.google
pnpm lesson 021 exercise-2.google
```

คำสั่งเหมือนกันทั้ง macOS และ PowerShell ไฟล์แบบฝึกหัดที่ยังไม่ได้เติมจะพิมพ์ข้อความที่ขึ้นต้น 👉 แล้วจบโดยไม่เรียกโมเดล

## ผลที่ควรเห็น

### ขั้นที่ 1: ต้องตรงทุกตัว

ทั้ง `example.ollama` และ `example.google` พิมพ์ `ชื่อเครื่องมือ: search_filter` ตามด้วย JSON ตามที่แสดงในหัวข้อ 1 (ย่อหน้า 2 ช่องตาม `JSON.stringify(..., null, 2)`)

### ขั้นที่ 2: เทียบกับ checklist

```
--- ขั้นที่ 2: withStructuredOutput ---
--- คำถามที่ 1: อยากได้เมล็ดกาแฟคั่วเข้ม งบไม่เกิน 400 บาท ---
ตัวกรอง: {"keyword":"คั่วเข้ม","category":"beans","maxPrice":400}
เจอสินค้า: 1 ชิ้น: เมล็ดกาแฟคั่วเข้ม ดอยสะเก็ด 250 กรัม
--- คำถามที่ 2: มีแก้วกาแฟอะไรบ้าง ---
ตัวกรอง: {"category":"drinkware"}
เจอสินค้า: 4 ชิ้น: ...
--- คำถามที่ 3: ของขวัญให้แฟนที่ชอบกาแฟ ราคาไม่เกิน 800 ---
แปลงไม่สำเร็จ: โมเดลไม่ได้เรียกเครื่องมือ
สรุป: แปลงสำเร็จ 2/3
```

**`example.ollama` และ `example.google`**
- [ ] มีบรรทัด `ชื่อเครื่องมือ: search_filter`
- [ ] JSON หลังบรรทัดนั้นแปลงด้วย `JSON.parse` ได้ และมี `properties.keyword`, `properties.category`, `properties.maxPrice`
- [ ] ค่า enum ของ `properties.category` (อาจอยู่ใน `anyOf`) เท่ากับ `CATEGORIES` ทั้ง 5 ค่า
- [ ] JSON มี `"description"` 4 จุด (3 field กับตัว object)
- [ ] มี 3 ส่วนคำถามตามลำดับ แต่ละส่วนมี `ตัวกรอง:` หรือ `แปลงไม่สำเร็จ:`
- [ ] ทุกบรรทัด `ตัวกรอง: <JSON>` ตามด้วย `เจอสินค้า: N ชิ้น` ที่ N เท่ากับจำนวนที่ `searchProducts(JSON นั้น)` คืนมา
- [ ] `สรุป: แปลงสำเร็จ X/3` โดย X อย่างน้อย 2 และเท่ากับจำนวนบรรทัด `ตัวกรอง:`
- [ ] ถ้าคำถามที่ 1 แปลงสำเร็จ `maxPrice` ต้องเป็น 400

**`exercise-1.*`**

```
ตรวจตัวอย่าง: P001 → ผ่าน
ตรวจตัวอย่าง: P999 → ไม่ผ่าน
แนะนำ: P006 กาแฟดริปซอง คั่วกลาง 10 ซอง ราคา 189 บาท
เหตุผล: ดริปซองคั่วกลางชงง่าย เหมาะกับมือใหม่
```

- [ ] บรรทัด `ตรวจตัวอย่าง:` 2 บรรทัดตรงตามลำดับ (`P001 → ผ่าน`, `P999 → ไม่ผ่าน`)
- [ ] `แนะนำ:` มีรหัสสินค้าที่มีจริงใน `src/shop` ชื่อและราคาตรงกับ `getProduct` และราคาไม่เกิน 500 บาท
- [ ] `เหตุผล:` เป็นภาษาไทย

**`exercise-2.*`**

```
ตรวจตัวอย่าง: quantity 0 → ไม่ผ่าน
ตรวจตัวอย่าง: quantity 1.5 → ไม่ผ่าน
ตรวจตัวอย่าง: คำอธิบายใน schema 3 จุด
- P006 กาแฟดริปซอง คั่วกลาง 10 ซอง × 2 = 378 บาท
- P015 กระดาษกรองกาแฟ 100 แผ่น × 1 = 95 บาท
ตะกร้า: 2 รายการ รวม 473 บาท
```

- [ ] มี `ตรวจตัวอย่าง: quantity 0 → ไม่ผ่าน` และ `ตรวจตัวอย่าง: quantity 1.5 → ไม่ผ่าน`
- [ ] มี `ตรวจตัวอย่าง: คำอธิบายใน schema N จุด` โดย N อย่างน้อย 3
- [ ] มีรายการ `- <id> <ชื่อ> × <จำนวน> = <ราคารวม> บาท` โดยราคารวมเท่ากับราคาสินค้าคูณจำนวน
- [ ] รายการคือ P006 × 2 และ P015 × 1 (สลับลำดับได้) ไม่มีสินค้าอื่น
- [ ] มี `ตะกร้า: 2 รายการ รวม 473 บาท` (473 = 189 × 2 + 95)

> หมายเหตุ: ผลของไฟล์ `.google.ts` ในบทนี้ยังไม่ได้ทดสอบกับ key ของ Google จริง

## แบบฝึกหัด

1. **`exercise-1.*`:** เติม `productIdField()` ให้คืน `z.string()` ที่ `.refine` ว่า `getProduct(id) !== undefined` ข้อความ `ไม่มีสินค้ารหัสนี้ในร้าน` ไฟล์ให้โมเดลแนะนำสินค้า 1 ชิ้นผ่านเครื่องมือ `recommend_product` โดยมี `catalogLines()` ใน system แล้วพิมพ์รหัส ชื่อ ราคา และเหตุผล
2. **`exercise-2.*`:** เติม `cartSchema()` ให้ `items`, `productId`, `quantity` มี `.describe` และ `quantity` เป็น `.int().min(1)` ไฟล์ให้โมเดลแปลงข้อความสั่งซื้อ `ขอกาแฟดริปซองคั่วกลาง 2 กล่อง กับกระดาษกรองกาแฟ 1 แพ็ค` เป็นตะกร้าผ่านเครื่องมือ `build_cart` แล้วพิมพ์ราคารวมจาก `src/shop`

ไฟล์แบบฝึกมี 👉 และค่าชั่วคราวไว้ให้รันได้ แต่ผลจะยังไม่ผ่าน checklist จนกว่าจะแก้ครบ ถ้าติด เปิดไฟล์ `example.*` ข้างๆ และอ่านเฉลยบน branch `solutions` เมื่อทำเองแล้ว

## อ่านเพิ่ม

- [LangChain.js: Structured output](https://docs.langchain.com/oss/javascript/langchain/structured-output) `withStructuredOutput`, `includeRaw` และ method ของ provider
- [Zod: JSON Schema](https://zod.dev/json-schema) `z.toJSONSchema` และสิ่งที่ `.describe()`/`.refine()` ทำกับ schema
- [Ollama: Tool calling](https://docs.ollama.com/capabilities/tool-calling) เครื่องมือและข้อจำกัดของ Ollama
- [Gemini API: Function calling](https://ai.google.dev/gemini-api/docs/function-calling) `tool_choice` และโหมดบังคับเรียกเครื่องมือ
