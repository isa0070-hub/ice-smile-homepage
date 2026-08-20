import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Historical snapshot kept only for reference; it is not an App Router route.
    "src/app/branches/page_backup_before_supabase.js",
  ]),
  {
    // Admin images are operational previews of editor-controlled URLs. They are
    // not public content, and their source dimensions are not stored reliably.
    files: ["src/app/admin/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
