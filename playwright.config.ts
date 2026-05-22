import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3002",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3002",
    url: "http://127.0.0.1:3002",
    env: {
      ...process.env,
      AI_PROVIDER: "fake",
      AI_STREAM_TIMEOUT_MS: "5000",
      DEEPSEEK_PROXY_URL: "",
      OPENROUTER_PROXY_URL: "",
      HTTPS_PROXY: "",
      HTTP_PROXY: "",
    },
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1200 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  reporter: [["list"], ["html", { outputFolder: "output/playwright-report", open: "never" }]],
});
