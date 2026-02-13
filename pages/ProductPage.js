const { BasePage } = require('./BasePage');

class ProductPage extends BasePage {
    constructor(page) {
        super(page);
        this.nameLocator = "//h1[contains(@class,'font-medium') and contains(@class,'leading-9')]";
        this.priceLocator = "//span[contains(@class,'font-semibold') and contains(@class,'text-primary-900')]";
        this.increaseBtnLocator = "//button[p[normalize-space()='+']]";
        this.decreaseBtnLocator = "//button[p[normalize-space()='-']]";
    }

    async getProductName() {
        const locator = this.page.locator(this.nameLocator);
        if (await locator.count() > 0) {
            return (await locator.first().innerText()).trim();
        }
        return 'NOT FOUND';
    }

    async getProductPrice() {
        const locator = this.page.locator(this.priceLocator);
        if (await locator.count() === 0) return 0;

        const priceText = (await locator.first().innerText()).trim();
        return parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    }

    async increaseQuantity() {
        const btn = this.page.locator(this.increaseBtnLocator);
        if (await btn.count() > 0) {
            await btn.first().click();
            await this.page.waitForTimeout(1500); // Wait for price update
        }
    }

    async decreaseQuantity() {
        const btn = this.page.locator(this.decreaseBtnLocator);
        if (await btn.count() > 0) {
            await btn.first().click();
            await this.page.waitForTimeout(1500); // Wait for price update
        }
    }

    async enterDimensions(dim1, dim2) {
        // Flexible dimension entry for different product shapes (Rectangle, Cylinder, etc.)
        // Wait for at least one measurement input to be visible first
        const anyInput = this.page.locator('[name^="measurements."]').first();
        try {
            await anyInput.waitFor({ state: 'visible', timeout: 10000 });
        } catch (e) {
            console.log('Measurement inputs not found or not visible in time.');
        }

        const widthInput = this.page.locator('[name="measurements.W"]');
        const heightInput = this.page.locator('[name="measurements.H"]');
        const lengthInput = this.page.locator('[name="measurements.L"]');
        const diameterInput = this.page.locator('[name="measurements.D"]');

        // Logic: Check what's visible and fill accordingly.
        // Tarp (Rectangular): Width + Height/Length
        // Cylinder: Height + Diameter

        if (await widthInput.isVisible() && await heightInput.isVisible()) {
            await widthInput.fill(dim1.toString());
            await heightInput.fill(dim2.toString());
        } else if (await lengthInput.isVisible() && await widthInput.isVisible()) {
            await lengthInput.fill(dim1.toString());
            await widthInput.fill(dim2.toString());
        } else if (await heightInput.isVisible() && await diameterInput.isVisible()) {
            // For Cylinder: Height is usually first, then Diameter
            // Check if height match dim1 vs dim2? Usually dim1=Height.
            await heightInput.fill(dim1.toString());
            await diameterInput.fill(dim2.toString());
        } else {
            // Fallback: try to fill first two visible inputs found by generic measurement name
            const inputs = this.page.locator('[name^="measurements."]');
            const count = await inputs.count();
            if (count >= 2) {
                await inputs.nth(0).fill(dim1.toString());
                await inputs.nth(1).fill(dim2.toString());
            }
        }

        // Trigger generic update (blur) via Tab or click outside
        await this.page.keyboard.press('Tab');
        await this.page.waitForTimeout(2000); // Wait for price update
    }

    async togglePersonalization() {
        // Attempt to find personalization toggle/checkbox
        const personalizeLabel = this.page.locator("//label[contains(.,'Personalize') or contains(.,'Personalization')]");
        if (await personalizeLabel.count() > 0) {
            await personalizeLabel.first().click();
        } else {
            // Fallback to text click
            const textLocator = this.page.getByText('Personalize');
            if (await textLocator.count() > 0) {
                await textLocator.first().click();
            }
        }
        await this.page.waitForTimeout(3000); // Wait for UI update
    }

    async addToCart() {
        // Use regex and .first() to handle strict mode if multiple buttons exist
        const addToCartBtn = this.page.getByRole('button', { name: /Add to Cart/i }).first();
        await addToCartBtn.waitFor({ state: 'visible' });
        await addToCartBtn.click();
    }
}

module.exports = { ProductPage };
