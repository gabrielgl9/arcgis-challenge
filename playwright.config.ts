import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  webServer: {
    command: "npx tsx src/server.ts",
    url: "http://127.0.0.1:3000/health",
    reuseExistingServer: true,
    timeout: 15000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    extraHTTPHeaders: { "Content-Type": "application/json" },
  },
});
