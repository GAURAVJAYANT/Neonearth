const { test, expect, devices } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');

// define iPhone 12 view
test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Responsiveness Tests', () => {

    test('Should display hamburger menu on mobile', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        
        // Check for specific mobile elements
        const hamburger = page.locator('.nav-toggle'); // Magento standard
        await expect(hamburger).toBeVisible();
        
        await hamburger.click();
        await expect(page.locator('nav.navigation')).toBeVisible();
    });

    test('Should perform search on mobile layout', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        
        await homePage.searchForProduct('Grill Cover');
        
        // Check results
        await expect(page.locator('.base')).toContainText('Search results');
    });
});
