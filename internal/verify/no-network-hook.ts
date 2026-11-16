// โหลดด้วย --import: กัน fetch ทุกครั้งตอนตรวจแบบฝึกที่ยังไม่เติม
globalThis.fetch = (input) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  process.stderr.write(`DN_GUARD_FETCH ${url}\n`);
  return Promise.reject(new Error("ห้ามเรียกเครือข่ายตอนตรวจ guard"));
};
