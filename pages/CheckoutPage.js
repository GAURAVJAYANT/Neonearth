const { BasePage } = require('./BasePage');

class CheckoutPage extends BasePage {
    constructor(page) {
        super(page);
        this.emailInput = "#customer-email";
        this.firstNameInput = "input[name='firstname']";
        this.lastNameInput = "input[name='lastname']";
        this.streetInput = "input[name='street[0]']";
        this.cityInput = "input[name='city']";
        this.regionSelect = "select[name='region_id']"; // State
        this.postcodeInput = "input[name='postcode']";
        this.telephoneInput = "input[name='telephone']";
        this.shippingMethodRadio = "input[type='radio'][name='ko_unique_1']"; // This ID is dynamic usually, need robust strategy
        this.nextBtn = "button.continue";
        this.placeOrderBtn = "button.action.primary.checkout";
    }

    async fillGuestShippingInfo(details) {
        console.log('Filling shipping info...');
        
        // Wait for form
        await this.page.waitForSelector(this.emailInput);

        await this.page.locator(this.emailInput).fill(details.email);
        await this.page.locator(this.firstNameInput).fill(details.firstName);
        await this.page.locator(this.lastNameInput).fill(details.lastName);
        await this.page.locator(this.streetInput).fill(details.address);
        await this.page.locator(this.cityInput).fill(details.city);
        await this.page.selectOption(this.regionSelect, { label: details.state });
        await this.page.locator(this.postcodeInput).fill(details.zip);
        await this.page.locator(this.telephoneInput).fill(details.phone);
        
        // Use timeout to allow shipping methods to load
        await this.page.waitForTimeout(3000);
        
        // Select first available shipping method if not selected
        const methods = this.page.locator("input[type='radio'][name='shipping_method']");
        if (await methods.count() > 0) {
            await methods.first().check();
        }

        await this.page.locator(this.nextBtn).click();
        await this.page.waitForLoadState('networkidle');
    }

    async verifyPaymentPageLoad() {
        await this.page.waitForSelector('.payment-method', { timeout: 20000 });
        const title = await this.page.locator('.step-title').innerText();
        return title.includes('Payment');
    }
}

module.exports = { CheckoutPage };
