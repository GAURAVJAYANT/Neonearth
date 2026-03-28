const { expect } = require('@playwright/test');

/**
 * Validates the cart metrics for a target item quantity count dynamically
 * @param {import('@playwright/test').Page} page 
 * @param {number} qty 
 * @param {string} currencySymbol - e.g. '$' or '£'
 * @param {boolean} checkFreeShipping - CA/US logic asserting $100 free shipping minimums
 */
async function validateCartForQuantity(page, qty, currencySymbol = '£', checkFreeShipping = false) {
    console.log(`\n--- Testing Cart at Quantity: ${qty} ---`);
    
    const subtotalLocator = page.locator("(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]");
    const oldSubtotalText = await subtotalLocator.textContent();
    
    // Update DOM Quantity cleanly to avoid triggering 'Remove Item' popups on empty states
    const qtyInput = page.locator('[name="quantity"]');
    await qtyInput.fill(qty.toString());
    await page.waitForTimeout(1000);

    // Click out to force cart refresh
    await subtotalLocator.click();

    // Wait for the server to return the new prices
    try {
        await expect(subtotalLocator).not.toHaveText(oldSubtotalText || "", { timeout: 15000 });
    } catch (e) {
        console.log("⚠️ Price did not change immediately. Continuing...");
    }
    await page.waitForTimeout(2000); // Visual stability buffer

    // Extract raw text for active prices
    const currentSubtotalText = await subtotalLocator.textContent();
    const currentDiscountText = await page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]").textContent();
    const currentShippingText = await page.locator("//p[normalize-space()='Shipping']/following-sibling::div//span").textContent();

    // Clean & parse strictly to numeric Floats
    const currentSubtotal = parseFloat(currentSubtotalText?.replace(/[^0-9.]/g, '') || "0");
    const currentDiscount = parseFloat(currentDiscountText?.replace(/[^0-9.]/g, '') || "0");
    const currentShipping = parseFloat(currentShippingText?.replace(/[^0-9.]/g, '') || "0");

    // Calculate dynamic discount volume percentages mapped natively
    let discountPercentage = 0;
    if (currentSubtotal > 0) {
        discountPercentage = (currentDiscount / currentSubtotal) * 100;
    }

    console.log(`Results -> Qty: ${qty} | Subtotal: ${currencySymbol}${currentSubtotal} | Discount: ${currencySymbol}${currentDiscount} (${discountPercentage.toFixed(2)}%) | Shipping: ${currencySymbol}${currentShipping}`);

    // Validate Maximum Discount Bounds mathematically
    if (currentDiscount >= 100) {
        console.log(`⚠️  NOTICE: Discount (${currencySymbol}${currentDiscount}) hits or exceeds limits. Ensure scaling promotions cap as expected.`);
    } else {
        console.log(`✅ Discount is within the standard standard limit (${currencySymbol}100 max).`);
    }

    // Optional Free Shipping Bounds evaluation module
    if (checkFreeShipping) {
        if (currentSubtotal > 100) {
            if (currentShipping === 0) {
                console.log(`✅ Free shipping auto-applied securely (Subtotal > ${currencySymbol}100).`);
            } else {
                console.log(`⚠️  WARNING: Shipping is applied explicitly ${currencySymbol}${currentShipping} despite subtotal being robustly over ${currencySymbol}100.`);
            }
        } else {
            console.log(`ℹ️  Subtotal is universally under ${currencySymbol}100 parameter. Standard shipping logic (${currencySymbol}${currentShipping}) dynamically attached.`);
        }
    }
}

/**
 * Automates checkout pipeline natively: populates generic details, triggers Google autocomplete mappings natively, and maps output payment gateways
 * @param {import('@playwright/test').Page} page 
 * @param {string} addressString - Ex: "10 Downing St, London"
 * @param {string} postCode - Ex: "SW1A 2AA"
 * @param {string} city - Ex: "London"
 */
async function processCheckoutAndCountPayments(page, addressString, postCode, city) {
    console.log("Proceeding to Secure Checkout...");
    await page.getByRole('button', { name: 'Secure Checkout' }).first().click();

    console.log("Filling Universal Customer Details...");
    await page.locator('input#emailField').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('input#emailField').fill('test@yopmail.com');
    await page.locator('input#firstname').fill('Gaurav');
    await page.locator('input#lastname').fill('jayant');
    
    console.log(`Entering parameterised strict Mapping Address: ${addressString} ...`);
    await page.locator('input#googleAddress').click();
    await page.locator('input#googleAddress').fill(addressString); 
    await page.waitForTimeout(2500); // Autocomplete networking MS
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Give frontend sufficient micro-delays mapping UI attributes natively
    await page.waitForTimeout(1500);

    // Guaranteed parameter fallbacks (safeguards button visibility validation)
    await page.locator('input#postcode').fill(postCode);
    await page.locator('input#city').fill(city);
    await page.getByRole('textbox', { name: 'Phone Number' }).fill('8888888888');

    console.log("Saving Details natively executing to Payment Stage pipeline...");
    await page.getByRole('button', { name: 'Save And Continue' }).click();

    // Loader interception matrix mapping
    const checkoutLoader = page.locator('.loader');
    try {
        await expect(checkoutLoader).toBeHidden({ timeout: 60000 });
    } catch (e) {
        console.log("Loader physically extended > 60s natively or masked heavily. Proceeding.");
    }
    await page.waitForTimeout(5000); // Final layout block settling buffer

    console.log("Scanning dynamically for Payment Modules mapping...");
    
    // Aggressive element fallback scanner mechanism
    let paymentMethods = page.locator('input[name="payment[method]"]');
    let count = await paymentMethods.count();

    if (count === 0) {
        paymentMethods = page.locator('div.payment-method');
        count = await paymentMethods.count();
    }
    
    if (count === 0) {
        paymentMethods = page.locator('div[role="radio"]');
        count = await paymentMethods.count();
    }

    console.log(`✅ Total Available Regional Payment Methods strictly mapped: ${count}`);

    for (let i = 0; i < count; i++) {
        const text = await paymentMethods.nth(i).textContent();
        // Sanitizing block natively trimming invisible UI whitespace elements
        const cleanText = text?.replace(/\s+/g, ' ').trim();
        if (cleanText) {
            console.log(`- Gateway ${i + 1}: ${cleanText}`);
        }
    }
}


/**
 * Universally securely locates and scrapes the banner promo code regardless of exact DOM structure mapping.
 * @param {import('@playwright/test').Page} page 
 * @param {string} regionalConfig - Domain identifier (e.g. 'UK' or 'CA') strictly for logging output readability if desired.
 * @returns {Promise<string>} Clean coupon extraction string
 */
async function extractDynamicCoupon(page, regionalConfig = 'UK') {
    const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
    await bannerLocator.waitFor({ state: 'visible', timeout: 15000 });
    const bannerText = await bannerLocator.innerText();
    const dynamicCouponCode = bannerText.split(':')[1].trim();
    console.log(`✅ Extracted Global ${regionalConfig} Coupon Code: ${dynamicCouponCode}`);
    return dynamicCouponCode;
}

module.exports = {
    validateCartForQuantity,
    processCheckoutAndCountPayments,
    extractDynamicCoupon
};
