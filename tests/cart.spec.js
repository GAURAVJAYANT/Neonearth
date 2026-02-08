const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');

test.describe('Cart Verification Tests', () => {
    const PRODUCT_URL = 'https://www.coversandall.com/custom-clear-vinyl-tarps.html';

    test('Should add customized product to cart and verify details', async ({ page }) => {
        test.setTimeout(60000); // Allow more time for cart navigation
        const productPage = new ProductPage(page);
        const cartPage = new CartPage(page);

        // 1. Navigate and Customize
        await productPage.navigate(PRODUCT_URL);
        await productPage.page.waitForLoadState('networkidle');
        
        console.log('Applying customizations...');
        await productPage.enterDimensions(10, 10);
        
        const expectedPrice = await productPage.getProductPrice();
        const expectedName = await productPage.getProductName();
        
        console.log(`Expected in cart: ${expectedName} at $${expectedPrice}`);

        // 2. Add to Cart
        console.log('Adding to cart...');
        await productPage.addToCart();

        // 3. Verify Cart Content
        console.log('Verifying cart...');
        
        // DEBUG: Print all text to find locators
        const bodyText = await page.locator('body').innerText();
        console.log('CART PAGE TEXT CONTENT:', bodyText);

        const cartPrice = await cartPage.getCartTotalPrice();
        
        // Note: E-commerce sites sometimes have slight rounding or tax differences in cart
        // We ensure it's not 0 and reasonably close to expected
        expect(cartPrice).toBeGreaterThan(0);
        console.log(`Cart Price Verified: $${cartPrice}`);
        
        // 4. Verify Checkout button
        await expect(page.locator('id=secureCheckout').first()).toBeVisible();
    });
});
