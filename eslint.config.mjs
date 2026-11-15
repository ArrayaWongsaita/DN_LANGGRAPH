import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules", ".langgraph", ".next"] },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: { allowDefaultProject: ["vitest.config.ts"] }, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      // Exercises may hold temporary values, so this must not break lint.
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  { files: ["**/*.mjs", "**/*.js"], ...tseslint.configs.disableTypeChecked },
);
