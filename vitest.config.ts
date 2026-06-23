import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    css: true,
    environment: "jsdom",
    globals: true,
    restoreMocks: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
