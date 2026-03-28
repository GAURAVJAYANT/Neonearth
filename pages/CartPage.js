const { BasePage } = require('./BasePage');

class CartPage extends BasePage {
    constructor(page) {
        super(page);
        this.cartItemSelector = '.product-item'; // Generic, will be refined
        this.productNameSelector = '.product-item-name';
        this.priceSelector = '.price';
        this.quantityInput = 'input.qty';
        this.secureCheckoutBtn = 'id=secureCheckout';
    }

    async getCartItemCount() {
        return await this.page.locator(this.cartItemSelector).count();
    }

    async getCartProductNames() {
        return await this.page.locator(this.productNameSelector).allInnerTexts();
    }

    async getCartTotalPrice() {
        const text = await this.page.locator(this.priceSelector).first().innerText();
        return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    }

    async updateQuantity(qty) {
        await this.page.locator(this.quantityInput).fill(qty.toString());
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000); // Wait for recalculation
    }

    async proceedToCheckout() {
        await this.page.locator(this.secureCheckoutBtn).first().click();
        await this.page.waitForLoadState('networkidle');
    }

    async applyCoupon(code) {
        console.log(`Attempting to apply coupon: ${code}`);
        
        // Common selectors for coupon code
        const couponInput = this.page.locator('input[id*="coupon"], input[name*="coupon"], input[placeholder*="coupon"], input[placeholder*="code"]');
        const applyBtn = this.page.locator('button:has-text("Apply"), button:has-text("Update")');

        if (await couponInput.first().isVisible()) {
            await couponInput.first().fill(code);
            await applyBtn.first().click();
            await this.page.waitForTimeout(3000); // Wait for processing
        } else {
            // Check if there's a toggle like "Apply Discount Code" or "Available Offers"
            const toggle = this.page.locator('text=/Apply Discount Code/i, text=/Have a promo code/i, text=/Available Offers/i');
            if (await toggle.count() > 0) {
                console.log('Found coupon toggle/section, clicking...');
                await toggle.first().click();
                await this.page.waitForTimeout(500);
                await couponInput.first().fill(code);
                await applyBtn.first().click();
                await this.page.waitForTimeout(3000);
            } else {
                console.log("COUPON INPUT NOT FOUND! Dumping page text...");
                console.log(await this.page.locator('body').innerText());
                throw new Error("Coupon input not found");
            }
        }
    }

    async getDiscountAmount() {
        // Look for discount row in summary
        const discountRow = this.page.locator('tr:has-text("Discount"), .totals:has-text("Discount")');
        if (await discountRow.count() > 0) {
            const text = await discountRow.first().innerText();
            console.log(`Discount Row Text: ${text}`);
            // Extract number
            const match = text.match(/-?\$([0-9,.]+)/);
            return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
        }
        return 0;
    }
}

module.exports = { CartPage };
