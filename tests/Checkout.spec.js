const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');

test.describe('Checkout Logic Tests', () => {

    test('Should proceed to checkout as guest', async ({ page }) => {
        const productPage = new ProductPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);
        
        // 1. Add Product to Cart
        await productPage.navigate('https://www.coversandall.com/custom-clear-vinyl-tarps.html');
        await productPage.enterDimensions(10, 10);
        await productPage.addToCart(); // This handles navigation to cart
        
        // 2. Proceed to Checkout
        await cartPage.proceedToCheckout();
        
        // 3. Fill Shipping Info
        await checkoutPage.fillGuestShippingInfo({
            email: 'testguest@groupbayport.com',
            firstName: 'Test',
            lastName: 'Guest',
            address: '123 Test St',
            city: 'New York',
            state: 'New York',
            zip: '10001',
            phone: '1234567890'
        });
        
        // 4. Verify Payment Section reached
        // Note: We stop before actual payment to avoid creating real orders
        const paymentLoaded = await checkoutPage.verifyPaymentPageLoad();
        expect(paymentLoaded).toBeTruthy();
    });

    test('Should apply coupon code in cart', async ({ page }) => {
        const productPage = new ProductPage(page);
        const cartPage = new CartPage(page);
        
        await productPage.navigate('https://www.coversandall.com/custom-clear-vinyl-tarps.html');
        await productPage.enterDimensions(12, 12);
        await productPage.addToCart();
        
        // Apply Invalid Coupon
        // Note: For valid coupon test, we need a known working code. 
        // Using 'INVALIDCODE' to test error handling or 'Disc0' handling
        await cartPage.applyCoupon('INVALIDTEST123');
        
        // Verify error message
        const error = await page.locator('.message-error').innerText();
        expect(error).toContain("The coupon code isn't valid");
    });
});
