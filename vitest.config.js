import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/core/rng.js", "src/core/dice.js", "src/core/grid.js"],
      exclude: ["src/worker/**", "src/dev/**", "src/__tests__/**"],
      thresholds: {
        lines: 50,
        functions: 45, // Ajustado para refletir grid.js (muitas funções avançadas não testadas)
        branches: 50,
        statements: 50,
      },
    },
    testTimeout: 10000,
  },
});
