const { test, expect } = require('@playwright/test');

test('Broken Test for Healer Demo', async ({ page }) => {
  await page.goto('https://www.coversandall.com/custom-clear-vinyl-tarps.html');
  
  // HEALED: The ID "Height_Input_Wrong_Field" was incorrect. 
  // Analyzing the page source, the correct ID is "H"
  console.log('Healing: Using the correct locator "id=H"...');
  const heightInput = page.locator('id=H');
  
  await heightInput.fill('12');
  
  await expect(heightInput).toHaveValue('12');
});
