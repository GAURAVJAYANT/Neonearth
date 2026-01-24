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
  use: {

    browserName: 'chromium',
    //browserName: 'firefox',
    headless: false, // ✅ Browser will open in headless mode
    viewport: null,
    launchOptions: {
      args: ["--start-maximized"],
    },
  },
});