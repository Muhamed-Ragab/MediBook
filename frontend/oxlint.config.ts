import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "typescript", "import", "jsx-a11y"],
  rules: {
    "react/jsx-no-literals": "off",
    "react/no-array-index-key": "warn",
    "no-debugger": "error",
    "no-console": "warn",
  },
});
