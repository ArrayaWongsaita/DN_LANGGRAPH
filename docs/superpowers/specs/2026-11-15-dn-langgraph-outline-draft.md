# DN_LANGGRAPH — ร่างลำดับบทเรียน

> สถานะ: อนุมัติแล้ว · อัปเดต 2026-11-15 · ตรวจกับ `@langchain/langgraph` 1.7.4, `@langchain/core` 1.4.1, `langchain` 1.6.6, `@langchain/ollama` 1.3.0, `@langchain/google` 0.2.15

## ภาพรวม

- **ผู้เรียน:** เขียน TypeScript เป็น (และเคยใช้ Jest/Vitest) แต่ยังไม่เคยทำแอป LLM
- **รูปแบบ:** เหมือน DN_PLAYWRIGHT คือแต่ละบทมี README + ไฟล์ตัวอย่าง + แบบฝึกที่มี 👉 · ผู้เรียน **รันสคริปต์แล้วดูผลจริงจากโมเดล** (ไม่มี test อัตโนมัติตรวจคำตอบ)
- **ขนาด:** 152 บท 21 ช่วง + ภาคผนวก 3 บท · ทุกช่วงมีบท ⭐ ที่ได้ผลงานจับต้องได้
- **ผลงานสุดท้าย:** ผู้ช่วยร้าน DN Shop บนเว็บ ค้นสินค้า, ตอบนโยบายร้านจากเอกสาร, ดูคำสั่งซื้อ, ขอคืนเงินต้องมีคนอนุมัติ, จำลูกค้าได้, ไม่ล่มเมื่อ provider หลักพัง, มีชุดทดสอบ และ deploy ได้
- **Provider:** ใช้ API เป็นหลัก คือ Google AI Studio และ Ollama Cloud · Ollama ในเครื่องเป็นทางเลือกสำหรับคนที่เครื่องไหว · ช่วงแรกทำแบบฝึกทั้ง Ollama และ Google แล้วผู้เรียนเลือกเองตั้งแต่บท 028 · รอบสอนไหนใช้ Ollama Cloud ขึ้นกับช่วงเวลาที่สอนและ API ที่คุ้มค่าตอนนั้น

## สิ่งที่ต้องมี

| สิ่งที่ต้องมี | ใช้ตั้งแต่บท | ค่าใช้จ่าย |
|---|---|---|
| Node.js 24 ขึ้นไป, pnpm 12, Git, VS Code | 002 | ฟรี |
| Ollama ในเครื่อง (ทางเลือก ต้องใช้เครื่อง RAM 16 GB ขึ้นไป) | 003 | ฟรี |
| บัญชี Ollama + เครดิตสำหรับ Ollama Cloud (ทำบท 003 หรือ 004 อย่างน้อย 1 บท ตามที่ผู้สอนบอกในรอบนั้น) | 004 | จ่ายตาม token ไม่มีโควต้าฟรี |
| บัญชี Google + API key จาก AI Studio | 005 | มีแผนฟรีที่จำกัดรายวัน หรือเปิด billing |
| บัญชี LangSmith | 045 (ไม่บังคับ), 046 (บังคับ) | แผนฟรี 5,000 trace ต่อเดือน |
| พื้นฐาน React (ไม่บังคับ: repo เตรียมหน้าเว็บ Next.js ไว้ ผู้เรียนเติมเฉพาะส่วนที่ต่อกับ agent) | 142 | – |
| Docker หรือบัญชี Postgres ฟรีบน cloud | 146 | ฟรี |
| บัญชี hosting สำหรับ Next.js | 147 | ใช้แผนฟรี (เลือกเจ้าตอนสร้างคอร์ส) |
| coding agent ที่ต่อ MCP ได้ | 149 | บางตัวฟรี บางตัวต้องสมัคร |

## หลักการจัดลำดับ

1. **หนึ่งบทหนึ่งเรื่อง** ทุกบทใช้เฉพาะสิ่งที่สอนไปแล้วในบทก่อนหน้า
2. **ทุกบทได้เห็นผลจากโมเดลจริง** ยกเว้น 4 บท (002 และ 134–136) · ไม่ต้องคุมจำนวน token หรือจำนวนครั้งที่เรียก
3. **เรื่องใหม่สอนเป็น 2 ขั้นในบทเดียว:** ขั้นที่ 1 ดูกลไกด้วยฟังก์ชันธรรมดาสั้นๆ (ผลเหมือนเดิมทุกครั้ง) → ขั้นที่ 2 ใส่ LLM จริงเข้าไปในกลไกเดียวกัน · แบบฝึกส่วนใหญ่ทำกับ LLM จริง
4. **ตรวจผลด้วยโครง ไม่ใช่ถ้อยคำ:** ขั้นที่ 1 README ให้ผลที่ควรเห็นแบบตรงทุกตัว · ขั้นที่ 2 ให้ checklist เช่น "state มี `suggestions` 2 รายการ", "node ทำงานตามลำดับ A → B → C", "มี `tool_calls` ชื่อ `searchProducts`"
5. **ช่วงทดลอง (บท 006–027)** ทุกบทที่เรียก LLM มีไฟล์ `*.ollama.ts` และ `*.google.ts` ผู้เรียนทำทุกข้อทั้ง 2 แบบเพื่อเทียบผล · ไฟล์ `*.ollama.ts` รันได้ทั้ง Ollama ในเครื่องและ Ollama Cloud โดยเปลี่ยนแค่ `.env`
6. **ตั้งแต่บท 028** ผู้เรียนเลือก provider เอง แล้วทุกบทเรียก `getModel()` จากไฟล์กลาง
7. **ห้ามฝังชื่อโมเดลในโค้ด** อ่านจาก `.env` เสมอ (Ollama Cloud และ Gemini ถอดโมเดลรุ่นเก่าเป็นระยะ)
8. **งานที่เรียก LLM ขนานกัน** ตั้ง `maxConcurrency` เสมอ เพื่อไม่ให้โดน 429 (Gemini จำกัดต่อนาที, Ollama Cloud รับพร้อมกัน 3 request)
9. **ธีมเดียวทั้งคอร์ส: ผู้ช่วยร้าน DN Shop** ข้อมูลสินค้า/คำสั่งซื้อ/ลูกค้า/นโยบายร้านเก็บในหน่วยความจำ ไม่ต้องเปิดเว็บ
10. **⭐ = บทผลงานของช่วง** แบบฝึกข้อสุดท้ายรวมเรื่องหลักของช่วงนั้นและอัปเกรดผู้ช่วย DN Shop อีกขั้น · ถ้ามีบทต่อจาก ⭐ ในช่วงเดียวกัน บทนั้นเป็นเรื่องเสริมหรือเตรียมช่วงถัดไป (028 เลือก provider, 045–046 เครื่องมือดูผล, 060 อ่านโค้ดเก่า, 101 ความจำแบบค้นความหมาย, 119 Functional API, 133 Deep Agents, 148 แก้ graph ขณะมี run ค้าง)
11. **ชื่อโฟลเดอร์ใช้เลข 3 หลัก** (`001-...` ถึง `152-...`) เพื่อให้เรียงถูกในทุกโปรแกรม
12. **ล็อกเวอร์ชันแพ็กเกจ** (`~` + lockfile) README บอกว่าคอร์สทดสอบกับเวอร์ชันไหน เพราะ LangChain ออกเวอร์ชันใหม่บ่อย
13. **รองรับทั้ง macOS และ Windows PowerShell** ทุกคำสั่ง เหมือน DN_PLAYWRIGHT

## รูปแบบของแต่ละบท

**ไฟล์ในโฟลเดอร์บท**
- `README.md`
- `example.ts` ที่รันได้ทันที (บท 006–027 เป็น `example.ollama.ts` กับ `example.google.ts`)
- `exercise-1.ts`, `exercise-2.ts`, ... มีบรรทัด 👉 ให้เขียน (บท 006–027 มีคู่ `.ollama` / `.google`) · ข้อแรกใกล้ตัวอย่าง ข้อหลังยากขึ้น

**หัวข้อใน README** (ต่อยอดจาก DN_PLAYWRIGHT)
1. จบบทนี้แล้วทำอะไรได้
2. เชื่อมกับที่รู้แล้ว
3. เนื้อหา (ขั้นที่ 1 กลไก → ขั้นที่ 2 ใส่ LLM)
4. จุดที่มักพลาด
5. วิธีรัน (`pnpm lesson NNN`)
6. ผลที่ควรเห็น (ขั้นที่ 1 แบบตรงทุกตัว / ขั้นที่ 2 แบบ checklist)
7. เปิดดูใน Studio (ตั้งแต่บท 046)
8. แบบฝึกหัด
9. อ่านเพิ่ม (ลิงก์เอกสาร JavaScript ของ LangChain/LangGraph)

**เฉลย** อยู่บน branch `solutions` เปิดดูบนเว็บ GitHub ได้โดยไม่ต้อง checkout (แบบเดียวกับ DN_PLAYWRIGHT) มีคอมเมนต์อธิบายว่า "ทำไม" เขียนแบบนั้น · เฉลยขั้นที่ 2 เป็นแค่ตัวอย่างหนึ่ง เพราะโมเดลตอบไม่เหมือนกันทุกครั้ง

## ไฟล์กลางที่บทต่างๆ ใช้ร่วมกัน (ข้อเสนอ)

| ไฟล์ / ค่า | เกิดในบท | ใช้ทำอะไร |
|---|---|---|
| `.env` (`LLM_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_API_KEY`, `OLLAMA_MODEL`, `OLLAMA_NUM_CTX`, `GOOGLE_API_KEY`, `GOOGLE_MODEL` และตัวแปรของบทหลังๆ ดูครบในเอกสารออกแบบข้อ 5.3) | 002–005 | ตั้งค่า provider และชื่อโมเดล · `OLLAMA_BASE_URL` เป็น `http://localhost:11434` (ในเครื่อง หรือ cloud ผ่าน `ollama signin`) หรือ `https://ollama.com` (ยิงตรงด้วย API key) |
| `ask()` | 016 | รับข้อความที่ผู้เรียนพิมพ์ใน terminal (ใช้ต่อในแชทและ human-in-the-loop) |
| `getModel()` + `structured(schema)` | 028 | สร้างโมเดลตาม `.env` · ฝั่ง Ollama ในเครื่องตั้ง `numCtx` จาก `OLLAMA_NUM_CTX` เพราะค่าเริ่มต้นแค่ 4k · **ไม่ส่ง `temperature` ให้ Gemini** (รุ่นใหม่เลิกใช้แล้ว และรุ่นต่อไปจะตอบ error 400) · `structured` เลือกวิธีทำ structured output ให้ถูก provider (Ollama Cloud ต้องใช้ `method: "functionCalling"`) |
| `show()` | 030 | พิมพ์ state และข้อความทีละ node ให้อ่านง่ายใน terminal (แยกสีตามบทบาท, บอกชื่อ node) |
| `getEmbeddings()` | 091 | ค่าเริ่มต้นใช้ Google ผ่าน `@langchain/google-genai` (`@langchain/google` ไม่มี class embedding) เพราะทุกคนมี key ของ Google และใช้ตอน deploy ได้ · คนที่มี Ollama ในเครื่องเลือก `embeddinggemma` ได้ · Ollama Cloud ไม่มีโมเดล embedding |
| ข้อมูล DN Shop | 001 | สินค้า, คำสั่งซื้อ, ลูกค้า, คู่มือและนโยบายร้าน (ข้อมูลสมมติทั้งหมด) |

## สัญลักษณ์คอลัมน์ LLM

| ค่า | ความหมาย |
|---|---|
| **2 แบบ** | มีแบบฝึกทั้ง Ollama และ Google |
| **ใช้** | เรียกโมเดลที่ผู้เรียนเลือกไว้ในบท 028 |
| **Ollama ในเครื่อง / Ollama Cloud / Google** | บทตั้งค่าของเจ้านั้น (ได้คุยกับโมเดลจริงในบท) |
| **เลือก 1** | บท 028 เทียบผลแล้วเลือก provider ที่จะใช้ต่อทั้งคอร์ส |
| **บนเว็บ** | ลองคุยกับโมเดลผ่านหน้าเว็บ ยังไม่เขียนโค้ด |
| **–** | ไม่เรียก LLM มีแค่ 4 บท: 002 (เตรียมโปรเจกต์) และ 134–136 (unit test ที่จุดประสงค์คือทดสอบโดยไม่เรียกโมเดล) |

## ภาพรวมทุกช่วง

| ช่วง | บท | จบช่วงนี้ทำอะไรได้ | ผลงาน ⭐ |
|---|---|---|---|
| 1 | 001–006 | เรียก LLM ผ่าน Google และ Ollama ด้วยโค้ดตัวเอง รู้ข้อดีข้อจำกัดของแต่ละทาง | เรียก LLM ด้วย `fetch` |
| 2 | 007–016 | คุยกับโมเดลผ่าน LangChain, อ่านผล, รับมือ error และลิมิต | แชทบอทร้านใน terminal |
| 3 | 017–022 | คุมให้โมเดลตอบตามต้องการ ทั้งข้อความและ object ที่มี type | แยกประเภทคำถามลูกค้า |
| 4 | 023–028 | ให้โมเดลใช้ tool, เขียน agent loop เอง แล้วเลือก provider | agent ตัวแรก |
| 5 | 029–039 | สร้าง graph: state, node, edge, ทางแยก, วนซ้ำ | workflow คำสั่งซื้อ |
| 6 | 040–046 | ผู้ช่วยที่คุยได้และใช้ tool ใน graph · ดูการทำงานใน Studio | ผู้ช่วย DN Shop v1 |
| 7 | 047–060 | ออกแบบ state ซับซ้อน, ทำงานขนาน, แจกงาน, tool ที่อ่าน context อย่างปลอดภัย | สรุปรีวิวแบบขนาน |
| 8 | 061–067 | แสดงผลระหว่างทางแบบ real time | ตอบทีละคำพร้อมสถานะ tool |
| 9 | 068–077 | จำบทสนทนา, บันทึกถาวร, ดูและแก้ state ย้อนหลัง | คุยยาวแต่ยังจำเรื่องสำคัญ |
| 10 | 078–087 | ให้คนอนุมัติ/แก้ไขกลางทาง, ย้อนเวลา | คืนเงินต้องมีคนอนุมัติ |
| 11 | 088–090 | จำข้อมูลลูกค้าข้ามบทสนทนา | agent เลือกเองว่าจะจำอะไร |
| 12 | 091–101 | ให้ agent ค้นเอกสารร้านแล้วตอบได้ถูก | ตอบนโยบายร้านได้ |
| 13 | 102–108 | ออกแบบ graph เอง, แบ่ง subgraph, จัดไฟล์แบบโปรเจกต์จริง | ผู้ช่วยแบบหลายไฟล์ |
| 14 | 109–115 | graph ไม่ล่มเมื่อเจอ error, timeout หรือ provider พัง | สลับ provider เอง |
| 15 | 116–119 | ใช้รูปแบบ workflow มาตรฐาน | เขียนแล้วตรวจงานตัวเอง |
| 16 | 120–127 | ใช้ `createAgent`, middleware และ MCP | ผู้ช่วยเวอร์ชันสำเร็จรูป |
| 17 | 128–133 | ทำระบบหลาย agent | หัวหน้าแจกงาน 3 ฝ่าย |
| 18 | 134–138 | ทดสอบและประเมิน agent | ชุดทดสอบของผู้ช่วย |
| 19 | 139–148 | เปิด agent เป็น server, ทำหน้าเว็บ, deploy | ขึ้นเว็บจริง |
| 20 | 149–151 | ใช้ AI ช่วยเขียน LangGraph และตรวจโค้ดที่ AI เขียน | แก้ graph ที่ AI เขียน |
| 21 | 152 | สร้างผู้ช่วย DN Shop เต็มรูปด้วยตัวเอง | โปรเจกต์ปิดท้าย |

---

## ช่วงที่ 1: รู้จัก LLM และเตรียมเครื่อง

**จบช่วงนี้:** เรียก LLM ผ่าน Google และ Ollama (cloud หรือในเครื่อง) ด้วยโค้ดตัวเอง · บท 003 กับ 004 ทำอย่างน้อย 1 บท ตามที่ผู้สอนบอกในรอบนั้น · ทำบท 002–005 ให้เสร็จก่อนเข้าห้อง (ต้องสมัครบัญชี และถ้าใช้ Ollama ในเครื่องต้องโหลดโมเดลหลาย GB)

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 001 | `001-what-is-llm` | LLM คืออะไร, ทำไมตอบไม่เหมือนเดิมทุกครั้ง · token, context window, provider, API key · LangChain กับ LangGraph คืออะไร · รู้จักผู้ช่วย DN Shop ที่จะสร้าง · ลองถามคำถามเดิมหลายรอบบนเว็บ AI Studio แล้วดูว่าคำตอบเปลี่ยน | บนเว็บ |
| 002 | `002-setup-project` | clone, `pnpm install`, คัด `.env.example` เป็น `.env` · วิธีรันบท `pnpm lesson 002` · สคริปต์ตรวจว่าเครื่องพร้อม · ตั้ง terminal บน Windows ให้พิมพ์และแสดงภาษาไทยได้ (UTF-8) | – |
| 003 | `003-setup-ollama-local` (ทางเลือก) | ติดตั้ง Ollama, `ollama pull`, `ollama run` คุยใน terminal (ลองภาษาไทย) · `ollama ps` · เลือกขนาดโมเดลตาม RAM (เครื่องช้าให้เลือกรุ่นเล็ก เพราะทุกบทจะเรียกโมเดล) · **ขยาย context length** (ค่าเริ่มต้นแค่ 4k token บนเครื่องที่ VRAM ไม่ถึง 24 GB เอกสาร Ollama แนะนำ agent อย่างน้อย 64k) ผ่าน slider ในแอปหรือ `OLLAMA_CONTEXT_LENGTH` · context ยิ่งยาวยิ่งใช้ RAM ต้องบาลานซ์กับขนาดโมเดล · `ollama pull embeddinggemma` ถ้าอยากใช้ embedding ในเครื่องช่วง RAG · เครื่องช้าเกินไปให้ใช้ Ollama Cloud (บท 004) แทน | Ollama ในเครื่อง |
| 004 | `004-setup-ollama-cloud` | สมัครบัญชี · `ollama signin` แล้วใช้ชื่อ `:cloud` · สร้าง API key สำหรับยิงตรง · ดูราคาต่อ token และยอดเครดิต · ไม่มีโควต้าฟรี ต้องเติมเงิน · Ollama ไม่เอาข้อมูลไปเทรน | Ollama Cloud |
| 005 | `005-setup-google` | สร้าง API key ใน AI Studio, ใส่ใน `.env` · ดูหน้า rate limit (ลิมิตนับต่อโปรเจกต์, รีเซ็ตราวบ่าย 3 โมงเวลาไทย ช่วง daylight saving ของสหรัฐฯ เป็นบ่าย 2) · แผนฟรีมีลิมิตรายวัน ถ้าชนบ่อยให้เปิด billing หรือใช้ Ollama · ข้อมูลในแผนฟรีอาจถูกใช้เทรน ห้ามใส่ข้อมูลส่วนตัว · ห้าม commit key | Google |
| 006 ⭐ | `006-raw-fetch` | เรียก LLM ด้วย `fetch` ตรงๆ ทั้ง Ollama (ส่ง header `Authorization` เมื่อยิงตรงไป cloud) และ Gemini · เห็นว่าข้างใต้คือ HTTP + JSON | 2 แบบ |

## ช่วงที่ 2: คุยกับโมเดลผ่าน LangChain

**จบช่วงนี้:** คุยกับโมเดลผ่าน LangChain, อ่านผล, รับมือ error และลิมิต, ทำแชทบอทใน terminal

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 007 | `007-first-chat-model` | `ChatOllama` / `ChatGoogle`, `.invoke()` · อ่านคำตอบด้วย `.text` (Gemini บางครั้งคืน `content` เป็น array) · อ่านชื่อโมเดลจาก `.env` · เทียบกับบท 006 | 2 แบบ |
| 008 | `008-ai-message` | อ่าน `AIMessage`: `usage_metadata`, `response_metadata`, `contentBlocks` รูปแบบกลางของทุก provider | 2 แบบ |
| 009 | `009-messages-roles` | system / human / ai · รูปย่อ `{ role, content }` · system message เปลี่ยนนิสัยโมเดล | 2 แบบ |
| 010 | `010-model-params` | `temperature`, `maxTokens` · รันซ้ำแล้วดูความต่าง · **Gemini รุ่นใหม่เลิกใช้ `temperature`/`top_p`/`top_k` แล้ว (ส่งไปก็ไม่สน และรุ่นต่อไปจะ error 400)** ทำให้คำตอบนิ่งด้วย system prompt ที่ชัดแทน · ฝั่ง Ollama ยังใช้ได้ | 2 แบบ |
| 011 | `011-thinking` | โมเดลที่คิดก่อนตอบ · ฝั่ง Ollama `think: false` ปิดได้บางรุ่น รุ่นที่ปิดไม่ได้ (เช่น gpt-oss) จะลดเหลือระดับต่ำสุด และ `ChatOllama` รับแค่ true/false เลือกระดับไม่ได้ · ฝั่ง Gemini ตั้ง `thinkingLevel` (แต่ละรุ่นมีระดับต่างกัน บางรุ่นไม่มีระดับต่ำสุด) · ดู reasoning block · ผลต่อเวลาตอบ | 2 แบบ |
| 012 | `012-errors` | อ่าน error: ลืมเปิด Ollama, ยังไม่ได้ `pull` โมเดล, ชื่อโมเดลผิด, key ผิด, โมเดลไม่รองรับ tool | 2 แบบ |
| 013 | `013-quota-retry` | 429 ชนลิมิต, เครดิต Ollama Cloud หมด · `maxRetries`, `timeout` · ดูยอดที่ใช้ไปใน dashboard | 2 แบบ |
| 014 | `014-batch-concurrency` | `.batch()` ถามหลายคำถามพร้อมกัน · ยิงพร้อมกันเยอะแล้วโดน 429 แบบบท 013 · แก้ด้วย `maxConcurrency` | 2 แบบ |
| 015 | `015-streaming` | `.stream()` + `for await` แสดงคำตอบทีละส่วน · `.text` ของ chunk · หยุดกลางทางด้วย `AbortController` (`signal`) | 2 แบบ |
| 016 ⭐ | `016-terminal-chatbot` | โมเดลจำอะไรไม่ได้เอง ต้องส่งประวัติแชทไปทุกครั้ง · ตัวช่วย `ask()` · **แชทบอทร้าน DN Shop ตัวแรกใน terminal** (จำบทสนทนา + stream) | 2 แบบ |

## ช่วงที่ 3: ควบคุมคำตอบ

**จบช่วงนี้:** คุมให้โมเดลตอบตามต้องการ ทั้งข้อความและ object ที่มี type

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 017 | `017-system-prompt` | เขียน system prompt ของผู้ช่วยร้าน: บทบาท, ขอบเขต, น้ำเสียง, สิ่งที่ห้ามตอบ | 2 แบบ |
| 018 | `018-prompt-with-data` | ใส่ข้อมูลสินค้าลงใน prompt ด้วย template string · ใส่มากไปแล้วโมเดลตอบพลาดหรือเกิน context window · อาการ "โมเดลลืม system prompt" ฝั่ง Ollama ในเครื่องมักมาจาก context 4k ที่ตัดข้อความต้นๆ ทิ้งเงียบๆ (ย้อนดูบท 003) | 2 แบบ |
| 019 | `019-few-shot` | ยกตัวอย่างถาม-ตอบให้โมเดลดู | 2 แบบ |
| 020 | `020-json-and-zod` | ขอให้โมเดลตอบเป็น JSON แล้วตรวจเองด้วย zod (ทวน `object`, `enum`, `optional`, `describe`, `z.infer`) · เห็นว่าบางครั้งโมเดลตอบ JSON พัง | 2 แบบ |
| 021 | `021-structured-output` | `withStructuredOutput(schema)` ทำสิ่งที่บท 020 ทำเองให้ · Ollama Cloud ต้องใช้ `method: "functionCalling"` (เห็นว่าแต่ละ provider ต่างกัน) | 2 แบบ |
| 022 ⭐ | `022-structured-output-errors` | เมื่อโมเดลตอบไม่ตรง schema · `includeRaw` ดูคำตอบดิบ · **แยกประเภทคำถามลูกค้าออกมาเป็น object** | 2 แบบ |

## ช่วงที่ 4: ให้โมเดลใช้เครื่องมือ (tools)

**จบช่วงนี้:** ให้โมเดลใช้ tool, เขียน agent loop เอง แล้วเลือก provider ที่จะใช้ต่อ

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 023 | `023-define-tools` | `tool()` + zod schema + description · เรียก tool ด้วยมือ เห็นว่าเป็นฟังก์ชันธรรมดา · เอาผลจาก tool ใส่ prompt ให้โมเดลตอบลูกค้า (คนเลือก tool เอง) | 2 แบบ |
| 024 | `024-tool-calling` | `bindTools` ให้โมเดลเลือก tool เอง · อ่าน `tool_calls` · โมเดลแค่ "ขอให้เรียก" ไม่ได้รันเอง | 2 แบบ |
| 025 | `025-multiple-tools` | หลาย tool ให้เลือก · คำอธิบายดีกับไม่ดีให้ผลต่างกัน · โมเดลเล็กเลือกพลาด · `tool_choice` บังคับใช้ tool ได้ฝั่ง Google แต่ `ChatOllama` ไม่รองรับ | 2 แบบ |
| 026 | `026-tool-message` | รัน tool เอง → `ToolMessage` (`tool_call_id`) → ส่งกลับให้โมเดลตอบ | 2 แบบ |
| 027 ⭐ | `027-tool-loop-by-hand` | เขียน `while` loop เอง จำกัดจำนวนรอบ · **agent ตัวแรก ค้นสินค้าและเช็กสต็อกได้** | 2 แบบ |
| 028 | `028-choose-provider` | เทียบผลที่ลองมา (ความเร็ว, ความแม่นเรื่อง tool, ภาษาไทย, ลิมิตและค่าใช้จ่าย) · ตั้ง `LLM_PROVIDER` · สร้าง `getModel()` ด้วย `initChatModel` และ `structured(schema)` | เลือก 1 |

## ช่วงที่ 5: Graph แรก

**จบช่วงนี้:** สร้าง graph ได้เอง: state, node, edge, ทางแยก, วนซ้ำ

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 029 | `029-why-langgraph` | รัน agent บท 027 แล้วลองให้หยุดรอคนอนุมัติ, จำข้ามครั้ง, ทำสองงานพร้อมกัน เห็นว่า loop ที่เขียนเองทำยาก · state, node, edge · วาด flow ของ DN Shop บนกระดาษ | ใช้ |
| 030 | `030-first-graph` | `StateSchema` 1 field · `StateGraph`, `addNode`, `addEdge`, `START`/`END`, `compile`, `invoke` · ขั้น 1 node เป็นฟังก์ชันธรรมดา ขั้น 2 node เรียก `getModel()` · ตัวช่วย `show()` | ใช้ |
| 031 | `031-state-schema` | state หลาย field แบบ zod · `GraphNode<typeof State>` · กล่อง "เจอ `Annotation.Root` หรือโค้ด Python บนเน็ต ให้ดูบท 060" | ใช้ |
| 032 | `032-node-updates` | node คืนเฉพาะส่วนที่เปลี่ยน · ห้ามแก้ state ตรงๆ · ผลของ `invoke` คือ state ทั้งก้อน | ใช้ |
| 033 | `033-sequence` | หลาย node ต่อกัน (LLM เกลาคำถาม → ค้นสินค้า → LLM ตอบ) · `show()` ดู state ทีละ node · node แบบ `async` | ใช้ |
| 034 | `034-draw-graph` | `drawMermaid()` แล้วดูใน mermaid.live หรือ VS Code (ไม่ใช้ `drawMermaidPng` ที่ส่งไปเรนเดอร์ข้างนอก) · วาดแล้วรันเทียบกับรูป | ใช้ |
| 035 | `035-conditional-edges` | `addConditionalEdges` + ฟังก์ชันเลือกทาง (โค้ดตรวจคำตอบของ LLM แล้วแยกทาง) | ใช้ |
| 036 | `036-path-map` | path map, `ConditionalEdgeRouter` · แยกได้หลายทาง | ใช้ |
| 037 | `037-loops` | LLM เขียนคำตอบ → โค้ดตรวจ → ไม่ผ่านให้เขียนใหม่ · เงื่อนไขหยุด | ใช้ |
| 038 | `038-recursion-limit` | loop ที่ไม่จบเพราะ LLM ไม่ผ่านเกณฑ์ · `recursionLimit`, `GraphRecursionError` | ใช้ |
| 039 ⭐ | `039-order-workflow` | **workflow คำสั่งซื้อ DN Shop:** เช็กสต็อก → คิดราคา → ส่วนลด → แยกทางตามผล → LLM เขียนข้อความสรุปถึงลูกค้า | ใช้ |

## ช่วงที่ 6: Graph คุยได้และใช้เครื่องมือ

**จบช่วงนี้:** ทำผู้ช่วยที่คุยได้และใช้ tool ใน graph และดูการทำงานทีละ node ใน Studio

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 040 | `040-messages-value` | `MessagesValue` · แชทหลายรอบใน graph (เทียบกับประวัติแชทที่ทำเองในบท 016) | ใช้ |
| 041 | `041-llm-router` | `structured()` เลือกทาง: คำถามเรื่องสินค้า / คำสั่งซื้อ / เรื่องอื่น | ใช้ |
| 042 | `042-tool-node-by-hand` | เขียน node ที่รัน tool เอง (แบบ quickstart ของเอกสาร) | ใช้ |
| 043 | `043-tool-node` | `ToolNode`, `toolsCondition` ทำแทนบท 042 | ใช้ |
| 044 ⭐ | `044-agent-from-scratch` | model ↔ tools วนจนจบ เทียบกับบท 027 · **ผู้ช่วย DN Shop v1** | ใช้ |
| 045 | `045-langsmith-tracing` (ไม่บังคับ) | สมัคร LangSmith (ฟรี) · ดู trace ทุก node, prompt ที่ส่งจริง, token · เปิด tracing แล้ว prompt จะถูกส่งไปเก็บที่ LangSmith | ใช้ |
| 046 | `046-studio` | `langgraph.json` แบบสั้น · `npx @langchain/langgraph-cli dev` (ต้องมี LangSmith API key ซึ่งสมัครฟรี) · เปิด LangSmith Studio ดูผู้ช่วยทำงานทีละ node และดู state แต่ละขั้น · ตั้งแต่บทนี้ทุก README มีวิธีเปิดดูใน Studio | ใช้ |

## ช่วงที่ 7: State ขั้นลึก

**จบช่วงนี้:** ออกแบบ state ที่ซับซ้อน, ทำงานขนาน, แจกงาน, คุมเส้นทางด้วย `Command` และให้ tool อ่าน context อย่างปลอดภัย

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 047 | `047-reducers` | `ReducedValue` · ค่าเริ่มต้นคือเขียนทับ · LLM 2 node ช่วยกันเสนอสินค้าแนะนำต่อท้ายลิสต์ · `MessagesValue` ก็คือ reducer แบบหนึ่ง | ใช้ |
| 048 | `048-overwrite` | `Overwrite` ข้าม reducer | ใช้ |
| 049 | `049-reset-reducer` | ล้างค่า field ที่มี reducer | ใช้ |
| 050 | `050-input-output-schema` | แยก input / output schema | ใช้ |
| 051 | `051-private-state` | state ที่ใช้เฉพาะระหว่าง node · `UntrackedValue` | ใช้ |
| 052 | `052-parallel-branches` | LLM 3 node ทำพร้อมกัน (สรุป / จุดเด่น / ตั้งชื่อโปร) แล้วรวมกลับ · super-step | ใช้ |
| 053 | `053-parallel-conflicts` | `InvalidUpdateError` เมื่อสองทางเขียน key เดียวกัน · แก้ด้วย reducer · `defer` | ใช้ |
| 054 | `054-send` | `Send` แจกงานแบบไม่รู้จำนวนล่วงหน้า (map-reduce) | ใช้ |
| 055 | `055-max-concurrency` | ยิง LLM พร้อมกันจริง ดูเวลาและ 429 · `maxConcurrency` จำกัดงานพร้อมกัน | ใช้ |
| 056 | `056-command` | LLM ตัดสินใจแล้ว node คืน `Command({ update, goto })` | ใช้ |
| 057 | `057-runtime-context` | `contextSchema` · ส่ง `context` ตอน invoke (ชื่อลูกค้า, ภาษาที่ตอบ) · `runtime` ใน node | ใช้ |
| 058 | `058-tools-with-context` | tool อ่าน userId จาก `context` และอ่าน state ได้ · **ห้ามให้โมเดลเป็นคนส่ง userId** (ลองให้ลูกค้าพิมพ์ "ขอดูคำสั่งซื้อของลูกค้าคนอื่น" แล้วดูว่าแบบไหนรั่ว) · tool ตรวจสิทธิ์ว่าเป็นคำสั่งซื้อของลูกค้าคนนี้ · tool คืน `Command` เพื่ออัปเดต state | ใช้ |
| 059 ⭐ | `059-review-summary` | **สรุปรีวิวสินค้าทีละชิ้นด้วย `Send` + `maxConcurrency` แล้วรวมผล** | ใช้ |
| 060 | `060-legacy-code` | แปลงโค้ดเก่าที่เจอบนเน็ตแล้วรันกับโมเดลจริง: `Annotation.Root` → `StateSchema`, `MessagesAnnotation` → `MessagesValue`, `createReactAgent` → agent ที่เขียนเอง / `createAgent` · **อ่านโค้ด Python** ซึ่งเป็นตัวอย่างส่วนใหญ่บนเน็ต: `add_node` → `addNode`, `TypedDict` → `StateSchema`, `Annotated[list, add]` → `ReducedValue` | ใช้ |

## ช่วงที่ 8: Streaming

**จบช่วงนี้:** แสดงผลระหว่างทางแบบ real time ทั้ง state, คำตอบทีละคำ และสถานะ tool

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 061 | `061-stream-values` | `streamMode: "values"` เห็น state ทั้งก้อนทุกขั้น | ใช้ |
| 062 | `062-stream-updates` | `streamMode: "updates"` เห็นเฉพาะส่วนที่เปลี่ยน | ใช้ |
| 063 | `063-stream-tokens` | `streamMode: "messages"` แสดงคำตอบทีละคำ · กรองเฉพาะ node ที่ต้องการ · แยก reasoning ของโมเดลที่คิดก่อนตอบออก | ใช้ |
| 064 | `064-stream-custom` | ส่งข้อมูลของเราเองออกมาระหว่างทาง | ใช้ |
| 065 | `065-stream-tool-progress` | แสดงความคืบหน้าของ tool (mode `tools`) | ใช้ |
| 066 | `066-stream-multi-debug` | หลาย mode พร้อมกัน · mode `debug` | ใช้ |
| 067 ⭐ | `067-stream-events` | `streamEvents` เวอร์ชัน v3 · **ผู้ช่วยตอบทีละคำพร้อมบอกสถานะ tool ใน terminal** | ใช้ |

## ช่วงที่ 9: บันทึก state และความจำในบทสนทนา

**จบช่วงนี้:** ให้ graph จำบทสนทนา, บันทึกถาวร, ดูและแก้ state ย้อนหลัง, คุมความยาวของประวัติ

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 068 | `068-checkpointer` | `MemorySaver`, `thread_id` · แชทต่อเนื่องแล้วผู้ช่วยจำได้ | ใช้ |
| 069 | `069-threads` | ลูกค้า 2 คนคุยพร้อมกัน คนละ thread ไม่ปนกัน | ใช้ |
| 070 | `070-get-state` | `getState` หลังคุย · `StateSnapshot` (`values`, `next`, `tasks`, `config`) | ใช้ |
| 071 | `071-state-history` | `getStateHistory` ไล่ดูทุก checkpoint ของบทสนทนา | ใช้ |
| 072 | `072-update-state` | `updateState` แก้คำตอบของผู้ช่วยแล้วคุยต่อ · `asNode` | ใช้ |
| 073 | `073-sqlite-saver` | `SqliteSaver` ปิดโปรแกรมแล้วเปิดใหม่ ผู้ช่วยยังจำได้ (แพ็กเกจใช้ `better-sqlite3` มีหมายเหตุสำหรับ Windows) | ใช้ |
| 074 | `074-durability-modes` | durability modes: บันทึกเมื่อไหร่ แลกกับความเร็ว | ใช้ |
| 075 | `075-trim-messages` | คุยยาวจนเกิน context window (Ollama ในเครื่องจะตัดข้อความต้นๆ ทิ้งเอง ทำให้ลืม system prompt) · `trimMessages` คุมเองว่าจะตัดอะไร | ใช้ |
| 076 | `076-delete-messages` | `RemoveMessage` ลบข้อความออกจาก state | ใช้ |
| 077 ⭐ | `077-summarize-messages` | node สรุปบทสนทนาเก่าแทนการเก็บทั้งหมด · **ผู้ช่วยคุยได้ยาวๆ โดยยังจำเรื่องสำคัญ** | ใช้ |

## ช่วงที่ 10: ให้คนช่วยตัดสินใจ (Human-in-the-loop)

**จบช่วงนี้:** ให้คนอนุมัติหรือแก้ไขกลางทาง, รู้กฎที่ต้องระวัง, ย้อนเวลาไปลองทางใหม่

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 078 | `078-interrupt` | LLM ร่างคำตอบแล้ว `interrupt()` รอ · ต้องมี checkpointer · `Command({ resume })` · `__interrupt__` · **ตอน resume node จะรันใหม่ตั้งแต่ต้น** | ใช้ |
| 079 | `079-interrupt-terminal` | รับคำตอบด้วย `ask()` แล้ว resume วนจนจบใน terminal | ใช้ |
| 080 | `080-approve-reject` | อนุมัติก่อนยกเลิกคำสั่งซื้อหรือคืนเงิน | ใช้ |
| 081 | `081-review-edit` | ให้คนแก้คำตอบก่อนส่งถึงลูกค้า | ใช้ |
| 082 | `082-interrupt-in-tools` | `interrupt` ข้างใน tool | ใช้ |
| 083 | `083-validate-input` | ถามซ้ำจนได้ข้อมูลที่ถูกต้อง (เช่น เลขคำสั่งซื้อ) | ใช้ |
| 084 | `084-multiple-interrupts` | หลาย interrupt ใน run เดียว · resume ทีละตัว | ใช้ |
| 085 | `085-interrupt-rules` | เรียก LLM ก่อน interrupt แล้วดูว่าโดนเรียกซ้ำตอน resume · ห้ามครอบด้วย try/catch · ห้ามสลับลำดับ · ค่าที่ส่งต้องเป็นข้อมูลธรรมดา · งานก่อน interrupt ต้องรันซ้ำได้ไม่เกิดผลซ้อน | ใช้ |
| 086 | `086-time-travel-replay` | ย้อนรันจาก checkpoint เก่า | ใช้ |
| 087 ⭐ | `087-time-travel-fork` | แตกทางจาก checkpoint ไปลองเส้นทางใหม่ · **ผู้ช่วยขอคืนเงินต้องมีคนอนุมัติ และย้อนแก้ได้** | ใช้ |

## ช่วงที่ 11: ความจำระยะยาว

**จบช่วงนี้:** จำข้อมูลลูกค้าข้ามบทสนทนา และให้ agent เลือกเองว่าจะจำอะไร

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 088 | `088-store-basics` | `InMemoryStore`, namespace · `put` / `get` / `search` / `delete` · เอาสิ่งที่จำไว้ใส่ prompt แล้วดูว่าคำตอบเปลี่ยน · ปิดโปรแกรมแล้วความจำหาย (เก็บถาวรด้วย Postgres ในบท 146) | ใช้ |
| 089 | `089-store-in-graph` | `runtime.store` · จำข้อมูลลูกค้าข้าม thread ด้วย userId จาก context | ใช้ |
| 090 ⭐ | `090-memory-tools` | **agent ตัดสินใจเองว่าจะจำอะไร** (tool บันทึก/อ่านความจำ) | ใช้ |

## ช่วงที่ 12: RAG ให้ agent ค้นเอกสาร

**จบช่วงนี้:** ให้ agent ค้นคู่มือและนโยบายร้านแล้วตอบได้ถูก พร้อมบอกแหล่งที่มา

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 091 | `091-embeddings` | embedding คืออะไร · สร้าง `getEmbeddings()` · ค่าเริ่มต้นใช้ Google ผ่าน `@langchain/google-genai` (แพ็กเกจเก่าที่ยังใช้ได้ เพราะ `@langchain/google` ไม่มี embedding) · คนที่มี Ollama ในเครื่องเลือก `embeddinggemma` ได้ · Ollama Cloud ไม่มีโมเดล embedding คนที่ใช้ Cloud จึงใช้ Google | ใช้ |
| 092 | `092-similarity` | สร้าง embedding ของประโยคจริงแล้วคำนวณ cosine เอง · ประโยคความหมายใกล้กันได้คะแนนสูง | ใช้ |
| 093 | `093-load-documents` | โหลดคู่มือและนโยบายร้านเป็น `Document` · ลองยัดเอกสารทั้งก้อนใส่ prompt แล้วดูผล | ใช้ |
| 094 | `094-split-documents` | แบ่ง chunk ด้วย `@langchain/textsplitters` · ขนาด chunk และ overlap · **ภาษาไทยไม่เว้นวรรคระหว่างคำ** การตัดตามจำนวนตัวอักษรอาจตัดกลางคำ จึงตั้ง separators ให้ตัดตามหัวข้อและย่อหน้าก่อน · ส่งเฉพาะ chunk ที่เกี่ยวให้โมเดลแล้วเทียบกับบท 093 | ใช้ |
| 095 | `095-vector-store` | เก็บและค้นใน `MemoryVectorStore` (จาก `@langchain/classic`) | ใช้ |
| 096 | `096-retriever-tool` | ทำการค้นเอกสารเป็น tool | ใช้ |
| 097 | `097-rag-two-step` | ค้นก่อนเสมอแล้วตอบ · บอกแหล่งที่มา | ใช้ |
| 098 | `098-grade-documents` | ให้ LLM ให้คะแนนว่าเอกสารที่ค้นได้ตรงคำถามไหม | ใช้ |
| 099 | `099-rewrite-question` | เขียนคำถามใหม่เมื่อค้นไม่เจอ | ใช้ |
| 100 ⭐ | `100-agentic-rag` | **agent เลือกเองว่าจะค้นหรือตอบเลย, ให้คะแนน, เขียนคำถามใหม่ · ตอบเรื่องนโยบายร้านได้** | ใช้ |
| 101 | `101-semantic-memory` | store ที่ค้นด้วยความหมาย ต่อยอดจากช่วง 11 | ใช้ |

## ช่วงที่ 13: ออกแบบและจัดโครงสร้าง

**จบช่วงนี้:** ออกแบบ graph เองก่อนเขียนโค้ด, แบ่งงานเป็น subgraph, จัดไฟล์แบบโปรเจกต์จริง

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 102 | `102-design-graph` | ออกแบบก่อนเขียนโค้ด: แตกงานเป็นขั้น · แยกขั้น LLM / ข้อมูล / action / รอคน · เก็บข้อมูลดิบใน state แล้วประกอบ prompt ตอนใช้ · เลือกขนาด node · ลงมือสร้าง graph ตามแบบที่ออกแบบ | ใช้ |
| 103 | `103-subgraph-as-node` | ใส่ subgraph เป็น node ที่ใช้ state key ร่วมกับ graph แม่ | ใช้ |
| 104 | `104-subgraph-in-node` | เรียก subgraph ใน node แล้วแปลง state ไปมา | ใช้ |
| 105 | `105-subgraph-state` | ดู state ของ subgraph | ใช้ |
| 106 | `106-subgraph-stream` | stream ผลจาก subgraph (`subgraphs: true`) | ใช้ |
| 107 | `107-subgraph-persistence` | การบันทึก state ของ subgraph: ต่อครั้ง / ต่อ thread / ไม่บันทึก | ใช้ |
| 108 ⭐ | `108-project-structure` | **แยกผู้ช่วย DN Shop เป็นไฟล์** state / nodes / tools / graph · `langgraph.json` เต็มรูป · รันใน Studio | ใช้ |

## ช่วงที่ 14: ทนต่อความผิดพลาด

**จบช่วงนี้:** ทำให้ graph ไม่ล่มเมื่อเจอ error, timeout หรือ provider พัง

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 109 | `109-retry-policy` | `retryPolicy` · ห่อการเรียก LLM จริงด้วยตัวที่พังรอบแรกเสมอ แล้วดู retry ทำงาน | ใช้ |
| 110 | `110-node-timeout` | `timeout` ของ node สั้นมากจนเรียก LLM ไม่ทัน · `NodeTimeoutError` | ใช้ |
| 111 | `111-error-handling` | จับ error ของ tool แล้วเลี่ยงไปทางอื่นด้วย `Command` | ใช้ |
| 112 | `112-llm-recoverable-errors` | ส่ง error กลับให้โมเดลแก้เอง (เช่น tool ได้ค่าผิด) | ใช้ |
| 113 | `113-graph-defaults` | ค่าเริ่มต้นที่ตั้งให้ทุก node · อ่าน thread id, run id, รอบ retry ใน node | ใช้ |
| 114 | `114-node-cache` | `cachePolicy` บน node + ส่ง `InMemoryCache` (จาก `@langchain/langgraph-checkpoint`) ตอน compile · คำถามซ้ำตอบทันทีไม่ต้องเรียกโมเดลใหม่ · จับเวลาเทียบ | ใช้ |
| 115 ⭐ | `115-model-fallback` | `withFallbacks` เรียงตาม provider ที่ตั้งไว้ (อย่างน้อย 2 ทาง เช่น Ollama ในเครื่อง → Ollama Cloud → Google) · ต้อง `bindTools` ให้ทุกตัว · ทดลองปิด Ollama หรือใส่ชื่อโมเดลผิดแล้วดูว่าสลับเอง · **ผู้ช่วยไม่ล่มเมื่อ provider หลักพัง** | ใช้ |

## ช่วงที่ 15: รูปแบบ workflow ที่ใช้บ่อย

**จบช่วงนี้:** เลือกและใช้รูปแบบ workflow มาตรฐานให้เหมาะกับงาน

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 116 | `116-prompt-chaining` | ทำทีละขั้นพร้อมจุดตรวจระหว่างทาง | ใช้ |
| 117 | `117-orchestrator-worker` | LLM วางแผนแล้วแจกงานด้วย `Send` + `maxConcurrency` | ใช้ |
| 118 ⭐ | `118-evaluator-optimizer` | เขียน → ให้คะแนน → แก้ วนจนผ่าน · **ผู้ช่วยเขียนคำอธิบายสินค้าและตรวจงานตัวเอง** | ใช้ |
| 119 | `119-functional-api` | `entrypoint`, `task` · อีกวิธีเขียน และเมื่อไหร่ควรใช้ (เช่น ห่อโค้ดเดิมที่ไม่ได้เขียนเป็น graph) | ใช้ |

## ช่วงที่ 16: Agent สำเร็จรูป, middleware และ MCP

**จบช่วงนี้:** ใช้ `createAgent` แทนการเขียนเองเมื่อเหมาะ, ปรับพฤติกรรมด้วย middleware และดึง tool จาก MCP

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 120 | `120-create-agent` | `createAgent` จาก `langchain` ที่สร้างบน LangGraph · เทียบกับบท 044 | ใช้ |
| 121 | `121-create-agent-response-format` | `responseFormat` ให้ agent ตอบเป็น object | ใช้ |
| 122 | `122-create-agent-memory` | ใส่ checkpointer และ store ให้ `createAgent` | ใช้ |
| 123 | `123-middleware-builtin` | middleware สำเร็จรูป: `summarizationMiddleware`, `modelCallLimitMiddleware` / `toolCallLimitMiddleware`, `modelRetryMiddleware` / `toolRetryMiddleware`, `modelFallbackMiddleware` (เทียบกับบท 115) | ใช้ |
| 124 | `124-middleware-hitl` | `humanInTheLoopMiddleware` อนุมัติก่อนเรียก tool (เทียบกับช่วง 10) | ใช้ |
| 125 | `125-middleware-custom` | เขียน middleware เอง: ก่อน/หลังเรียกโมเดล, ครอบการเรียก tool | ใช้ |
| 126 | `126-guardrails` | กรอง input / output · `piiMiddleware` ปิดข้อมูลส่วนตัว (เบอร์โทร, อีเมล) · prompt injection ที่มากับเอกสาร RAG หรือผลจาก tool · ทำไม tool ที่ทำงานจริงต้องมีคนอนุมัติ | ใช้ |
| 127 ⭐ | `127-mcp` | `@langchain/mcp-adapters` ดึง tool จาก MCP server (repo มี MCP server ของ DN Shop ให้) · **ผู้ช่วยเวอร์ชัน `createAgent` + middleware + MCP** | ใช้ |

## ช่วงที่ 17: หลาย agent ทำงานร่วมกัน

**จบช่วงนี้:** รู้ว่าเมื่อไหร่ควรแยกหลาย agent และทำได้หลายรูปแบบ

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 128 | `128-multi-agent-why` | ให้ agent ตัวเดียวถือ tool 10 ตัวแล้วดูว่าเลือกพลาด · ทางแก้แบบไม่แยก agent: `llmToolSelectorMiddleware` คัด tool ก่อนส่งให้โมเดล · เมื่อไหร่ควรแยกหลาย agent · รูปแบบต่างๆ (subagent, handoff, router, supervisor) | ใช้ |
| 129 | `129-subagents-as-tools` | agent หนึ่งเรียกอีก agent ผ่าน tool | ใช้ |
| 130 | `130-handoffs` | ส่งงานต่อด้วย `Command` ไปที่ graph แม่ | ใช้ |
| 131 | `131-router` | แยกคำถามแล้วส่งให้ agent ที่ถนัด | ใช้ |
| 132 ⭐ | `132-supervisor` | **หัวหน้าแจกงานให้ agent ฝ่ายขาย / ฝ่ายคำสั่งซื้อ / ฝ่ายนโยบาย** | ใช้ |
| 133 | `133-deep-agents` | รู้จัก `deepagents`: วางแผน, subagent, ระบบไฟล์ | ใช้ |

## ช่วงที่ 18: ทดสอบ agent

**จบช่วงนี้:** เขียน test ให้ agent ทั้งแบบไม่เรียกโมเดลและแบบเรียกจริง และประเมินคุณภาพได้

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 134 | `134-unit-test-nodes` | ทวน Vitest สั้นๆ · ทดสอบ node ทีละตัวผ่าน `graph.nodes` | – |
| 135 | `135-fake-model` | `fakeModel()` จาก `langchain` กำหนดข้อความ, tool call และ error ได้ · ทดสอบ agent ให้ผลเหมือนเดิมทุกครั้ง | – |
| 136 | `136-partial-execution` | รันแค่บางส่วนของ graph | – |
| 137 | `137-integration-test` | ทดสอบกับโมเดลจริง · รับมือผลที่ไม่เหมือนเดิมทุกครั้ง | ใช้ |
| 138 ⭐ | `138-evals` | ประเมินเส้นทางของ agent ด้วย `agentevals` · ใช้ LLM เป็นกรรมการ · **ชุดทดสอบของผู้ช่วย DN Shop** | ใช้ |

## ช่วงที่ 19: เป็นแอปจริง

**จบช่วงนี้:** เปิด agent เป็น server, ทำหน้าเว็บที่คุยได้, deploy ให้คนอื่นลองใช้

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 139 | `139-local-server-api` | server จากบท 046 มี API: สร้าง thread, สั่ง run, ดูผล ผ่าน HTTP | ใช้ |
| 140 | `140-sdk-client` | `@langchain/langgraph-sdk` เรียก server จากโค้ด: thread, run, stream | ใช้ |
| 141 | `141-agent-chat-ui` | Agent Chat UI สำเร็จรูปต่อกับ server | ใช้ |
| 142 | `142-use-stream` | Next.js + `useStream` จาก `@langchain/react` (repo เตรียมหน้าเว็บไว้ ผู้เรียนเติมส่วนที่ต่อกับ agent) · ปุ่มหยุดคำตอบกลางทาง · key อยู่ฝั่ง server เท่านั้น | ใช้ |
| 143 | `143-ui-tool-calls` | การ์ดแสดง tool call บนเว็บ | ใช้ |
| 144 | `144-ui-hitl` | ปุ่มอนุมัติ interrupt บนเว็บ | ใช้ |
| 145 | `145-ui-branching` | แก้ข้อความแล้วให้ตอบใหม่ (fork จาก checkpoint) | ใช้ |
| 146 | `146-postgres` | checkpointer และ store แบบ Postgres · ใช้ Postgres ใน Docker หรือ Postgres ฟรีบน cloud · รันผู้ช่วยแล้วดูข้อมูลในตาราง | ใช้ |
| 147 ⭐ | `147-deploy-nextjs` | deploy ฟรีด้วย Next.js (เอกสารรองรับผ่าน Agent Streaming Protocol) · ไม่ใช้ LangSmith Cloud เพราะต้องแผน Plus $39/คน/เดือน · **server บน cloud เรียก Ollama ในเครื่องเราไม่ได้** ใครใช้ Ollama ในเครื่องอยู่ต้องสลับโมเดลเป็น Ollama Cloud หรือ Google และ embedding เป็น Google · บน serverless ใช้ `MemorySaver` และ SQLite ไม่ได้ ต้องใช้ Postgres จากบท 146 · env และ secret · **กันคนอื่นมาใช้เครดิตเรา** ด้วยรหัสผ่านง่ายๆ และจำกัดจำนวนข้อความ · **ผู้ช่วย DN Shop ขึ้นเว็บจริงให้คนที่เราเลือกลองใช้ได้** | ใช้ |
| 148 | `148-backward-compat` | ค้าง run ไว้ที่ interrupt → แก้โค้ด graph → resume ต่อได้โดยไม่พัง | ใช้ |

## ช่วงที่ 20: ใช้ AI ช่วยเขียน LangGraph

**จบช่วงนี้:** ใช้ AI ช่วยเขียน graph ด้วยเอกสารล่าสุด และตรวจโค้ดที่ AI เขียนได้ · เหมือนช่วง 12 ของ DN_PLAYWRIGHT เรียนหลังจากเขียนเองเป็นแล้ว

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 149 | `149-docs-mcp` | ต่อ MCP ของเอกสาร LangChain (`https://docs.langchain.com/mcp` และ `https://reference.langchain.com/mcp`) เข้ากับ coding agent ที่ใช้ ให้ค้นเอกสารล่าสุดแทนความจำเก่าของ AI | ใช้ |
| 150 | `150-ai-write-graph` | สั่ง AI เขียน graph ตามแบบที่ออกแบบไว้ (บท 102) · ดูว่าไม่ต่อ MCP แล้ว AI มักเขียน API เก่าหรือปนรูปแบบ Python | ใช้ |
| 151 ⭐ | `151-review-ai-graph` | **ตรวจและแก้ graph ที่ AI เขียน:** API เก่า, state ที่เก็บข้อความประกอบแล้วแทนข้อมูลดิบ, ให้โมเดลส่ง userId เอง, งานก่อน `interrupt` ที่รันซ้ำแล้วเกิดผลซ้อน, ไม่มี `maxConcurrency`, key หลุดลงโค้ด | ใช้ |

## ช่วงที่ 21: โปรเจกต์ปิดท้าย

| บท | โฟลเดอร์ | ฝึก | LLM |
|---|---|---|---|
| 152 ⭐ | `152-capstone` | **ผู้ช่วย DN Shop เต็มรูปบนเว็บ:** ค้นสินค้า · ตอบนโยบายร้านด้วย RAG · ดูคำสั่งซื้อของตัวเองเท่านั้น · คืนเงินต้องมีคนอนุมัติ · จำลูกค้าได้ · streaming · ไม่ล่มเมื่อ provider หลักพัง · มี unit test และ eval · deploy ได้ | ใช้ |

## ภาคผนวก

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| A | `appendix-a-more-providers` | เพิ่ม Groq, OpenRouter, NVIDIA, Mistral ลงใน `getModel()` ไว้ใช้ตอนลิมิตเต็ม · ข้อควรระวังเรื่องข้อมูลถูกใช้เทรน · ลิมิตดูใน dashboard ของแต่ละเจ้า |
| B | `appendix-b-multimodal` | ส่งรูปให้โมเดลดู (Gemini หรือโมเดล vision ของ Ollama) · ไม่บังคับ เพราะต้องโหลดโมเดลเพิ่ม |
| C | `appendix-c-glossary` | คำศัพท์ไทย-อังกฤษพร้อมคำอธิบายสั้นและบทที่สอน: LLM, token, context window, prompt, system prompt, provider, API key, rate limit / 429, thinking, structured output, tool / tool call, agent, streaming, graph, state, node, edge, conditional edge, reducer, super-step, checkpointer, checkpoint, thread, interrupt, resume, idempotent, store, namespace, embedding, chunk, vector store, RAG, subgraph, middleware, MCP, fallback, eval, deploy, serverless |

---

## สิ่งที่ต้องทดสอบจริงตอนสร้างคอร์ส

**โมเดลและ provider**
- เลือกรุ่น Gemini และโมเดลบน Ollama Cloud ที่เป็นทางหลัก แล้วทดสอบทุกบท: เรียก tool ได้แม่น, ภาษาไทยดี, ราคาคุ้ม (Gemini ต้องอยู่ในแผนฟรีและมีระดับการคิดต่ำ)
- เลือกโมเดลในเครื่องที่แนะนำ 1 ตัว (ทางเลือก): เรียก tool ได้, ปิดหรือลดการคิดได้, รันได้บนเครื่อง RAM 16 GB
- หาค่า `OLLAMA_NUM_CTX` ที่พอสำหรับบท agent และ RAG กับโมเดลในเครื่องนั้น
- `getModel()` ไม่ส่ง `temperature` ให้ Gemini แล้วไม่มี warning หรือ error
- `withStructuredOutput(schema, { method: "functionCalling" })` ใช้ได้กับโมเดลบน Ollama Cloud (เช็กในโค้ด `@langchain/ollama` แล้วว่ามีตัวเลือกนี้ แต่ยังไม่ได้รันจริง)
- `GoogleGenerativeAIEmbeddings` จาก `@langchain/google-genai` ยังใช้ได้กับ key จาก AI Studio

**LangGraph และเครื่องมือ**
- `maxConcurrency` จำกัดงานจาก `Send` ได้จริง (เช็กในโค้ด runner แล้ว ต้องลองรัน)
- `npx @langchain/langgraph-cli dev` ทำงานใน repo ที่ใช้ pnpm, อ่าน `.env` ของคอร์สได้ และใช้กับ Studio ได้โดยไม่ต้องเปิด tracing
- `agentevals` (ยังเป็นเวอร์ชัน 0.x) ใช้กับเวอร์ชัน `langchain` ที่ล็อกไว้ได้
- separators สำหรับแบ่งเอกสารภาษาไทยของร้านให้ chunk ไม่ขาดกลางคำ

**เครื่องและระบบ**
- `better-sqlite3` ติดตั้งผ่านบน Windows และ macOS ด้วย Node 24
- พิมพ์และแสดงภาษาไทยผ่าน `ask()` ได้ใน Windows PowerShell และ terminal ของ VS Code
- เวลาทำงานสูงสุดของ function บน hosting ที่เลือกพอสำหรับ agent ที่วนหลายรอบพร้อม streaming
- วิธีต่อ MCP ของเอกสาร LangChain กับ coding agent ที่ผู้เรียนน่าจะใช้

**เนื้อหา**
- checklist ใน README ทุกบทผ่านกับ Google และ Ollama Cloud อย่างละ 3 รอบ และผ่าน Ollama ในเครื่องตามเกณฑ์ในเอกสารออกแบบข้อ 5.10 (คำตอบเปลี่ยนได้ แต่โครงต้องผ่าน)

## เรื่องที่ตัดสินแล้ว

- ผู้เรียนรันสคริปต์ดูผลจริง ไม่มี test อัตโนมัติตรวจคำตอบ
- ครอบคลุมเนื้อหาทั้งหมด ไม่จำกัดจำนวนบท
- ใช้ Ollama ในเครื่อง, Ollama Cloud และ Google · ช่วงแรกทำแบบฝึกทั้ง 2 แบบทุกข้อ แล้วค่อยเลือก provider
- ไม่ต้องคุมจำนวน token · ทุกบทต้องได้เห็นผลจริง (ถ้าโควต้าฟรีไม่พอ ผู้เรียนเติมเงินเอง)
- ใช้ API เป็นหลัก (Google และ Ollama Cloud) · Ollama ในเครื่องเป็นทางเลือก · รอบสอนไหนใช้ Ollama Cloud ขึ้นกับช่วงเวลาและ API ที่คุ้มค่าตอนนั้น
- ปล่อย repo ครั้งเดียวเมื่อครบทุกบท พร้อม branch `solutions`
- โครง repo เป็น package เดียวแบบ DN_PLAYWRIGHT · `pnpm studio NNN` สร้าง config เฉพาะบท (รายละเอียดใน [เอกสารออกแบบ](2026-11-15-dn-langgraph-course-design.md))

## เรื่องที่ยังค้าง

- บทไหนสอนในห้อง (🏫) · **ข้อเสนอ:** 001–046 (ช่วง 1–6) ราว 30% ของคอร์ส ใกล้กับ DN_PLAYWRIGHT ที่สอนในห้อง 15 จาก 55 บท · เหตุผล: ช่วงนี้มีการตั้งเครื่อง 3 provider ที่มักติดปัญหา, เป็นพื้นฐาน graph ที่ทุกบทหลังใช้ และจบที่ Studio ซึ่งผู้เรียนใช้ดูผลเองต่อหลังจบห้อง · ถ้าเวลาในห้องน้อย ตัดที่ 001–028 (ช่วงทำ 2 แบบ)
- โมเดลหลักของคอร์ส (เลือกตอนสร้างตามผลทดสอบข้างบน)

## ประวัติการทบทวน (สรุป)

1. **รอบ 1–2:** ตั้งโครงจากคอร์ส DN_PLAYWRIGHT · เลือกตรวจงานแบบรันสคริปต์ · ครอบคลุมทั้งหมด · หาแหล่ง API ฟรี (GitHub Models ปิดแล้ว, Ollama Cloud ไม่มีแผนฟรี)
2. **รอบ 3:** เพิ่ม Ollama Cloud · `.text` แทน `.content` · บทโมเดลที่คิดก่อนตอบ · `fakeModel()` · `getEmbeddings()` · deploy ทางฟรี · ชื่อโมเดลใน `.env` · บทออกแบบ graph · prompt injection · `responseFormat`
3. **รอบ 4–5:** `ChatOllama` ไม่รองรับ `tool_choice` · ชื่อโฟลเดอร์เลข 3 หลัก · ⭐ ทุกช่วง · RAG และ tool node เป็นขั้นบันได · บท batch ย้ายไปหลังบทโควต้า
4. **รอบ 6:** เปลี่ยนหลักเป็น "ทุกบทเห็นผลจริง ไม่ต้องคุม token" · สอนเป็น 2 ขั้นในบทเดียว · checklist ตรวจโครง · `show()` · ย้าย Studio มาไว้ต้นคอร์ส · ทำทุกข้อทั้ง 2 แบบ
5. **รอบ 7:** Gemini รุ่นใหม่เลิกใช้ `temperature` · Ollama context เริ่มต้น 4k · `@langchain/google` ไม่มี embedding · deploy เรียก Ollama ในเครื่องไม่ได้ · `think: false` ไม่ได้ปิดทุกรุ่น · การแบ่ง chunk ภาษาไทย · อ่านโค้ด Python · ช่วงใช้ AI ช่วยเขียน · ชื่อ middleware ที่มีจริง
6. **รอบ 8 (ทำเอกสารให้ครบ):**
   - เพิ่มภาพรวม, ตารางสิ่งที่ต้องมีพร้อมค่าใช้จ่าย, รูปแบบของแต่ละบท (ไฟล์และหัวข้อ README), เป้าหมายของทุกช่วง, ภาคผนวกคำศัพท์, เรื่องที่ตัดสินแล้วและที่ยังค้าง
   - บท 046 (Studio) เปลี่ยนเป็นบังคับ เพราะบท 108 และ 139 ใช้ต่อ (เดิมเป็น "แนะนำ" ซึ่งขัดกัน) · ส่วนบท 045 (tracing) ยังไม่บังคับ
   - เพิ่มบท 058 tool อ่าน context: ห้ามให้โมเดลส่ง userId เอง และ tool ต้องตรวจสิทธิ์ (DN Shop มีข้อมูลคำสั่งซื้อของลูกค้าหลายคน ถ้าไม่สอนเรื่องนี้ ผู้ช่วยจะเปิดข้อมูลคนอื่นได้) · บทหลังจากนั้นเลื่อนเลข +1
   - ภาษาไทยใน terminal ของ Windows (บท 002) · error "โมเดลไม่รองรับ tool" (บท 012) · หยุด stream กลางทาง (บท 015 และ 142)
   - บท 115 fallback ใช้ provider เท่าที่ตั้งไว้ (คนที่ข้ามบท 004 ไม่มี Ollama Cloud)
   - ระบุแพ็กเกจของ `MemoryVectorStore` (บท 095) และชื่อ `humanInTheLoopMiddleware` (บท 124)
   - ล็อกเวอร์ชันแพ็กเกจ และใส่ coding agent ลงในรายการสิ่งที่ต้องมี
7. **รอบ 9 (ตรวจทั้งไฟล์ด้วยสคริปต์):**
   - ผ่าน: 152 บท เลขไม่ขาดไม่ซ้ำ ชื่อโฟลเดอร์ตรงกับเลขบท · 21 ช่วง 21 ⭐ · ช่วงบทในตารางภาพรวมตรงกับตารางของแต่ละช่วง · บทที่ไม่เรียก LLM มีแค่ 002, 134, 135, 136 · บท 006–027 เป็น 2 แบบครบ 22 บท · บทที่อ้างถึงทุกบทมีอยู่จริงและเนื้อหาตรง
   - แก้: หลักข้อ 10 เดิมบอกว่า ⭐ เป็น "บทปิดช่วง" แต่มี 7 ช่วงที่มีบทต่อจาก ⭐ จึงเปลี่ยนเป็น "บทผลงานของช่วง" และบอกว่าบทที่ตามมาคืออะไร
   - แก้: ตารางสัญลักษณ์ขาดค่า "เลือก 1" ของบท 028
   - เพิ่ม: พื้นฐาน React ในสิ่งที่ต้องมี (ผู้เรียนรู้ TypeScript แต่อาจไม่เคยเขียน React) · เฉลยเปิดบนเว็บได้ · ข้อเสนอบทที่สอนในห้อง
   - ยืนยัน: pnpm 12 มีจริง (12.21.0) · ช่วงที่ 12 ของ DN_PLAYWRIGHT คือ "ใช้ AI ช่วยเขียน test" ตามที่อ้าง · เฉลยของ DN_PLAYWRIGHT อยู่บน branch `solutions` เหมือนกัน
8. **รอบ 10 (หลังเลือกโครง repo):**
   - ผู้ใช้เลือกใช้ API เป็นหลัก จึงเปลี่ยนให้ Ollama ในเครื่องเป็นทางเลือก
   - บท 004 ไม่เป็น "ข้ามได้" แล้ว · ผู้เรียนทำบท 003 หรือ 004 อย่างน้อย 1 บท ตามที่ผู้สอนบอกในรอบนั้น
   - embedding เปลี่ยนค่าเริ่มต้นเป็น Google (บท 091 และ `getEmbeddings()`) เพราะไม่ใช่ทุกคนจะมี Ollama ในเครื่อง
   - เกณฑ์ทดสอบเปลี่ยนเป็น Google และ Ollama Cloud อย่างละ 3 รอบทุกบท
