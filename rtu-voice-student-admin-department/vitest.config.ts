import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths"; // makes "@/..." imports work

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", setupFiles: ["./vitest.setup.ts"] },
});