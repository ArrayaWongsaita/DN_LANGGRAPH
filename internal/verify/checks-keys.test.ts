import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { listLessons, runnableFiles } from "../../scripts/lib/lessons";

const root = path.resolve(import.meta.dirname, "..", "..");
const lessons = listLessons(path.join(root, "lessons")).filter((l) => runnableFiles(l).length > 0);

describe("key ของ internal/checks/NNN.ts ตรงกับไฟล์ที่รันได้ของบท", () => {
  it.each(lessons.map((l) => [l.number, l] as const))("บท %s", async (_n, lesson) => {
    const url = pathToFileURL(path.join(root, "internal", "checks", `${lesson.number}.ts`)).href;
    const mod = (await import(url)) as { default: Record<string, unknown> };
    expect(Object.keys(mod.default).sort()).toEqual(runnableFiles(lesson));
  });
});
