// @ts-check
const { defineConfig } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',

  fullyParallel: true,
  workers: 15,
  retries: 2,
  timeout: 180 * 1000,

  expect: {
    timeout: 40 * 1000,
  },

  forbidOnly: !!process.env.CI,

  maxFailures: 10, // 🔥 optional

  outputDir: 'test-results/',

  globalTeardown: require.resolve('./global-teardown.js'),

  reporter: [
    ['list'],
    ['monocart-reporter', {
      name: "Test Automation Dashboard",
      outputFile: './test-results/report.html',
    }],
    ['json', { outputFile: 'test-results/report.json' }],
    ['./open-report-reporter.js']
  ],

  use: {
    trace: 'on-first-retry',

    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,

    video: {
      mode: 'retain-on-failure',
      size: { width: 1920, height: 1080 }
    },

    screenshot: 'only-on-failure',

    headless: false, // 🔥 IMPORTANT CHANGE

    viewport: null, // null allows --start-maximized to take full effect

    ignoreHTTPSErrors: true,

    launchOptions: {
      args: ["--start-maximized"],
    },
  },
});