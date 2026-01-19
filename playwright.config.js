// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 40 * 1000,
  },
  reporter: 'html',
  use: {

    browserName: 'chromium',
    //browserName: 'firefox',
    headless: false, // ✅ Browser will open in headed mode
    viewport: null,
    launchOptions: {
      args: ["--start-maximized"],
    },
  },
});