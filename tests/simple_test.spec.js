import { test, expect } from '@playwright/test';

test('Simple Browser Check', async ({ page }) => {
  await page.goto('https://google.com');
  console.log('Browser opened successfully');
  await page.waitForTimeout(5000); 
});
