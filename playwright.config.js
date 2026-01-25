// @ts-check
const { defineConfig } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 40 * 1000,
  },
  reporter: [['html'], ['allure-playwright']],
  globalTeardown: './global-teardown.js', // Auto-open Allure report after tests
  use: {

    browserName: 'chromium',
    //browserName: 'firefox',
    headless: true, // ✅ Browser will open in headless mode
    viewport: null,
    launchOptions: {
      args: ["--start-maximized"],
    },
  },
});