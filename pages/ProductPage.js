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
}

module.exports = { ProductPage };
