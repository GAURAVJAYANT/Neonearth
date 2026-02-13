const {test} = require('@playwright/test');

test ('US Login', async ({page}) =>
{
    await page.goto('https://www.coversandall.com/');
  await page.getByText('My account', { exact: true }).hover();
  //await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForTimeout(3000);
  //await page.locator("/html/body/div[3]/header/div/div/div[3]/div[1]/div[2]/div/div[2]/button").click();
  await page.locator(`//button[@id='headerLoginBtn']`).click();
  await page.locator(`input[placeholder=' ']`).fill('gaurav.jayant@groupbayport.com');
  await page.waitForTimeout(3000); 
  await page.getByText('Next', { exact: true }).click();
  await page.waitForTimeout(3000); 
  await page.getByRole('button', { name: 'Sign in with a password instead' }).click();
  await page.waitForTimeout(3000); 
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('Test@123456');
  await page.waitForTimeout(3000); 
  await page.getByText('Sign In', { exact: true }).click();
  await page.waitForTimeout(3000);
  await page.close();

});

