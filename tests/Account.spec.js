const { test, expect } = require('@playwright/test');
const { AccountPage } = require('../pages/AccountPage');

test.describe('Account Management Tests', () => {

    test('Should fail login with invalid credentials', async ({ page }) => {
        const accountPage = new AccountPage(page);
        await accountPage.navigateToLogin();
        
        await accountPage.login('invalid@example.com', 'WrongPass123!');
        
        const error = await accountPage.getErrorMessage();
        expect(error).toContain('The account sign-in was incorrect');
    });

    test('Should initiate forgot password flow', async ({ page }) => {
        const accountPage = new AccountPage(page);
        await accountPage.navigateToLogin();
        
        await accountPage.initiateForgotPassword('testuser@example.com');
        
        const message = await page.locator('.message-success').innerText();
        expect(message).toContain('If there is an account associated with');
    });

    // Registration test omitted from running automatically to avoid spamming the database
    // validation can be done on field errors
    test('Should validate registration required fields', async ({ page }) => {
        const accountPage = new AccountPage(page);
        await accountPage.navigateToRegister();
        
        await page.locator(accountPage.createAccountSubmitBtn).click();
        
        await expect(page.locator('#firstname-error')).toBeVisible();
        await expect(page.locator('#email_address-error')).toBeVisible();
    });
});
