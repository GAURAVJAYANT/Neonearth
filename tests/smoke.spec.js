const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');

test.describe('Smoke Test Suite (Critical Path)', () => {
    
    test('End-to-End Flow: Search -> Customize -> Cart -> Checkout', async ({ page }) => {
        const homePage = new HomePage(page);
        const productPage = new ProductPage(page);
        const cartPage = new CartPage(page);

        // 1. Navigate to Home
        await test.step('Navigate to Home Page', async () => {
            await homePage.navigate();
            expect(await page.title()).toContain('Covers');
        });

        // 2. Search for Product
        await test.step('Search for Product', async () => {
            await homePage.searchForProduct('Rectangular Table Covers'); 
            // Using a specific term likely to yield results
        });

        // 3. Select Product
        await test.step('Select Product from Results', async () => {
            await homePage.selectFirstResult();
        });

        // 4. Customize Product
        await test.step('Enter Custom Dimensions', async () => {
            // Ensure we are on a product page
            const productName = await productPage.getProductName();
            console.log(`Customizing: ${productName}`);
            
            // Enter dims (Height, Width) - assuming standard for table covers
            // Note: ProductPage might need adjustment if fields differ (Length/Width/Height)
            // For now, using methods available in ProductPage
            // If inputs are different, this might fail, but it's a smoke test start.
            // Let's try standard 12x12
            await productPage.enterDimensions(12, 12);
            
            const price = await productPage.getProductPrice();
            expect(price).toBeGreaterThan(0);
        });

        // 5. Add to Cart
        await test.step('Add Product to Cart', async () => {
            await productPage.addToCart();
        });

        // 6. Verify Cart
        await test.step('Verify Cart and Checkout', async () => {
            const total = await cartPage.getCartTotalPrice();
            console.log(`Cart Total: $${total}`);
            expect(total).toBeGreaterThan(0);
            
            await cartPage.proceedToCheckout();
            expect(page.url()).toContain('checkout');
        });
    });
});
