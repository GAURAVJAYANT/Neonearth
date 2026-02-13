const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');

test.describe('Search and Navigation Tests', () => {

    test('Should search for a valid product', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.searchForProduct('Grill Cover');
        
        // Verify multiple results or specific URL
        await expect(page).toHaveURL(/catalogsearch\/result/);
        const resultText = await page.locator('.base').innerText();
        expect(resultText).toContain('Search results for: \'Grill Cover\'');
    });

    test('Should handle invalid search queries gracefully', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.searchForProduct('skdjfhksjdhfkjsdhf');
        
        const message = await page.locator('.message.notice').innerText();
        expect(message).toContain('Your search returned no results');
    });

    test('Should navigate via Mega Menu', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.navigate();
        
        // Example: Outdoor Furniture Covers -> Patio Chair Covers
        // Depending on actual menu structure, names might need adjustment
        await homePage.navigateToCategory('Outdoor Furniture Covers', 'Patio Chair Covers');
        
        expect(await page.title()).toContain('Chair Covers');
    });
});
