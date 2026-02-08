// @ts-check
const { defineConfig } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 40 * 1000,
  },
  reporter: [
    ['list'],
    ['monocart-reporter', {
      name: "Test Automation Dashboard",
      outputFile: './test-results/report.html',
    }],
    ['./open-report-reporter.js']
  ],
  use: {
    screenshot: 'only-on-failure',
    browserName: 'chromium',
    //browserName: 'firefox',
    headless: false, // ✅ Browser will open in headless mode
    viewport: null,
    launchOptions: {
      args: ["--start-maximized"],
    },
  },
});