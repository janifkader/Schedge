import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-undef": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "build/**"],
  },
]);
