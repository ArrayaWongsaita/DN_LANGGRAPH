import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts", "src/**/*.test.ts", "internal/**/*.test.ts"],
  },
});
