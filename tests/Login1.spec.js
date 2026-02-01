const { test, expect } = require('@playwright/test');

test('US Login', async ({ page }) => {

  await page.goto('https://www.coversandall.com/');
  await page.getByText('My account', { exact: true }).hover();
  const signInBtn = page.locator('#headerLoginBtn');
  await expect(signInBtn).toBeVisible();
  await signInBtn.click();
  const emailInput = page.locator('input[placeholder=" "]');
  await expect(emailInput).toBeVisible();
  await emailInput.fill('gaurav.jayant@groupbayport.com');
  await page.getByText('Next', { exact: true }).click();
  const passwordOption = page.getByRole('button', {name: 'Sign in with a password instead'});
  await expect(passwordOption).toBeVisible();
  await passwordOption.click();
  const passwordInput = page.getByRole('textbox', {name: 'Enter your password'});
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('Test@123456');
  await page.getByText('Sign In', { exact: true }).click();
  await expect(page.getByText('My account')).toBeVisible();
  await page.waitForTimeout(3000);
  await page.close();

});
