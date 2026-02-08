const { test, expect } = require('@playwright/test');
const { BasePage } = require('../pages/BasePage');

test.describe('Footer and Static Pages Tests', () => {

    test('Should subscribe to newsletter successfully', async ({ page }) => {
        const basePage = new BasePage(page);
        await basePage.navigate('https://www.coversandall.com/');
        
        // Use a random email to avoid "already subscribed" errors ideally
        const randomEmail = `testuser${Date.now()}@groupbayport.com`;
        await basePage.subscribeToNewsletter(randomEmail);
        
        // Verify success message
        await expect(page.locator('.message-success')).toContainText('Thank you for your subscription');
    });

    test('Should navigate to Contact Us page', async ({ page }) => {
        const basePage = new BasePage(page);
        await basePage.navigate('https://www.coversandall.com/');
        
        await basePage.clickContactUs();
        
        await expect(page).toHaveURL(/contact-us/);
        await expect(page.locator('h1')).toContainText('Contact Us');
    });
});
