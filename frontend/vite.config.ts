import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: process.env.WATCHPACK_POLLING
    ? { watch: { usePolling: true, interval: 1000 } }
    : undefined,
});
