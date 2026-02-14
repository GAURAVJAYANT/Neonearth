// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  retries: 2, // Retry failed tests up to 2 times (Total 3 runs)
  timeout: 30 * 1000,
  expect: {
    timeout: 40 * 1000,
  },
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
    video: {
      mode: 'retain-on-failure',
      size: { width: 1920, height: 1080 }
    },
    screenshot: 'only-on-failure',
    headless: false,
    viewport: null, // Set to null to allow full screen
    launchOptions: {
      args: ["--start-maximized"],
    },
  },
});