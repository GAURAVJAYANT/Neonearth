const { test, expect } = require('@playwright/test');
const { NeonearthHomePage } = require('../pages/NeonearthHomePage');
const { NeonearthCategoryPage } = require('../pages/NeonearthCategoryPage');
const { NeonearthProductPage } = require('../pages/NeonearthProductPage');

test.describe('Dynamic Category Traversal', () => {
    let homePage;
    let categoryPage;
    let productPage;

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000); 
        homePage = new NeonearthHomePage(page);
        categoryPage = new NeonearthCategoryPage(page);
        productPage = new NeonearthProductPage(page);
    });

    test('Traverse all header categories and count products', async ({ page }) => {
        await homePage.navigate();
        
        // Use the user-provided locator for dynamic categories
        const categoryLocator = page.locator("//ul[@class='header-navigation-list']/li");
        
        // Wait for header to be visible
        await categoryLocator.first().waitFor({ state: 'visible', timeout: 10000 });
        
        const count = await categoryLocator.count();
        console.log(`Found ${count} categories in the header navigation list.`);
        
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            console.log(`\\n--- Processing Category ${i + 1}/${count} ---`);
            
            // Re-resolve the locator inside the loop in case the DOM was refreshed
            const categoryItem = page.locator("//ul[@class='header-navigation-list']/li").nth(i);
            
            // We get the text to log it
            const categoryText = await categoryItem.innerText();
            const cleanName = categoryText.split('\\n')[0].trim(); // Take first line if there are dropdowns
            console.log(`Clicking category: ${cleanName}`);
            
            // Click the category. Use force: true in case it's a hover-triggering element
            await categoryItem.click({ force: true });
            await page.waitForLoadState('domcontentloaded');
            
            // Verify the new page loaded by checking for title
            const pageTitle = await page.title();
            console.log(`Page Loaded successfully. Title: "${pageTitle}"`);
            
            // Allow PLP data to load
            await page.waitForTimeout(3000);
            
            // Extract product URLs and Names
            const products = await categoryPage.getProductsData();
            console.log(`Total Products Available in '${cleanName}': ${products.length}`);
            
            // STRICT ASSERTION: Fail the test if the category appears empty
            expect(products.length, `Category '${cleanName}' should contain at least 1 product.`).toBeGreaterThan(0);
            
            // Print all available products in that category
            products.forEach((product, idx) => {
                console.log(`  [Product ${idx + 1}/${products.length}] Name: "${product.name || 'Unnamed'}" | URL: ${product.url}`);
            });
            
            // Return to the homepage before selecting another category to ensure a clean state
            await homePage.navigate();
            await page.waitForTimeout(1000);
        }
    });
});
