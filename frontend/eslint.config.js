// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Genel ignore
  { ignores: ["dist", "build", "coverage", "node_modules"] },

  // 🔹 Baz kural seti (TypeScript + Hooks + React Refresh)
  {
    name: "base",
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",

      // Baz olarak sıkı tutuyoruz; UI katmanında aşağıda gevşeteceğiz
      "@typescript-eslint/no-explicit-any": ["error", { fixToUnknown: true, ignoreRestArgs: false }],
      "@typescript-eslint/no-empty-object-type": ["error"],
    },
  },

  // 🔹 UI katmanı (sayfalar/komponentler) — dosyalara dokunmadan any serbest
  {
    name: "ui-layer (pages/components/features/app)",
    files: [
      "src/pages/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/app/**/*.{ts,tsx}",
      "src/widgets/**/*.{ts,tsx}",
      "src/screens/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    // 🔽 ek
    "react-hooks/exhaustive-deps": "off",
    },
  },

  // 🔹 Core/entegrasyon katmanı — sıkı kurallar
  {
    name: "core-layer (integrations/lib/server)",
    files: [
      "src/integrations/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
      "src/server/**/*.{ts,tsx}",
      "src/shared/**/*.{ts,tsx}",
      "src/domain/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": ["error", { fixToUnknown: true, ignoreRestArgs: false }],
      "@typescript-eslint/no-empty-object-type": ["error"],
    },
  },
);
