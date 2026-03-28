const { test, expect } = require('@playwright/test');
const { NeonearthHomePage } = require('../pages/NeonearthHomePage');
const { NeonearthCategoryPage } = require('../pages/NeonearthCategoryPage');
const { NeonearthProductPage } = require('../pages/NeonearthProductPage');

const categories = [
    'All',
    'Wall Arts',
    'Tapestries',
    'Rugs & Mats',
    'Pillows',
    'Fabrics',
    'Curtains',
    'Pet Zone',
    'More',
    'Theme'
];

test.describe('Neonearth Detailed PDP Verification', () => {
    let homePage;
    let categoryPage;
    let productPage;

    test.beforeEach(async ({ page }) => {
        // Set higher timeout for operations inside the test
        test.setTimeout(120000); 

        homePage = new NeonearthHomePage(page);
        categoryPage = new NeonearthCategoryPage(page);
        productPage = new NeonearthProductPage(page);
    });

    for (const category of categories) {
        test(`Crawl all products in ${category}`, async ({ page }) => {
            console.log(`\n\n=== STARTING CATEGORY: ${category} ===`);
            
            // 1. Navigate to category PLP
            await homePage.navigate();
            await homePage.clickCategory(category);
            
            // Allow PLP data (products) to load
            await page.waitForTimeout(3000); 
            
            // 2. Extract product URLs
            const productLinks = await categoryPage.getProductLinks();
            
            console.log(`Found ${productLinks.length} unique products for category '${category}'.`);
            
            expect(productLinks.length).toBeGreaterThan(0); // Ensure we scraped successfully
            
            // 3. Visit each product page and log its name
            for (let i = 0; i < productLinks.length; i++) {
                const href = productLinks[i];
                
                await page.goto(href, { waitUntil: 'domcontentloaded' });
                
                const productName = await productPage.getProductName();
                
                console.log(`[Product ${i + 1}/${productLinks.length}] Name: "${productName}" | URL: ${href}`);
                
                // Base assertions
                expect(productName).not.toBe('UNKNOWN_NAME');
                expect(productName).not.toBe('ERROR_LOADING_NAME');
            }
        });
    }
});
