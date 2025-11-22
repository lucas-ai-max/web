import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
