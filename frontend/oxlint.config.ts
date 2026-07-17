import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "typescript", "import", "jsx-a11y"],
  rules: {
    "react/jsx-no-literals": "off",
    "react/no-array-index-key": "warn",
    "no-debugger": "error",
    "no-console": "warn",
    // Native <dialog> is a modal interactive element; these rules misfire on it.
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/click-events-have-key-events": "off",
    "jsx-a11y/no-noninteractive-element-interactions": "off",
    // CSS-grid calendars legitimately use role="gridcell" (no real <table>);
    // this rule only accepts <td>/<th>, which would be invalid outside a table.
    "jsx-a11y/prefer-tag-over-role": "off",
  },
});
