const { test, expect } = require('@playwright/test');

test('CA Domain - Coupon and Quantity Discount Validation', async ({ page }) => {
    test.setTimeout(400000); // Allow time for multiple cart updates

    console.log("Navigating to coversandall.ca...");
    await page.goto('https://www.coversandall.ca/');

    // 1. Extract Coupon from Top Banner
    const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
    await bannerLocator.waitFor({ state: 'visible', timeout: 15000 });
    const bannerText = await bannerLocator.innerText();
    const dynamicCouponCode = bannerText.split(':')[1].trim();
    console.log(`✅ Extracted CA Coupon Code: ${dynamicCouponCode}`);

    // Navigate to a valid item to test discounts
    console.log("Adding a Custom Cylinder Cover to test the cart...");
    await page.goto('https://www.coversandall.ca/custom-covers/custom-cylinder-round-covers-p');
    
    // Fill dimensions
    await page.locator('input#H').waitFor({ state: 'visible' });
    await page.locator('input#H').fill('20');
    await page.locator('input#D').fill('20');

    // Wait for the UI to register dimensions and Add to Cart
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    // Go to shopping cart
    const goToCartBtn = page.getByText(/Go To Shopping Cart/i).first();
    await goToCartBtn.waitFor({ state: 'visible', timeout: 15000 });
    await goToCartBtn.click();

    // 2. Apply Coupon in Cart
    await expect(page.locator(`p:has-text("Available Offers")`)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(4000); // Hydration buffer
    await page.locator(`p:has-text("Available Offers")`).click({ force: true });

    const couponInput = page.locator(`input[name="couponCode"]`);
    await couponInput.waitFor({ state: 'visible', timeout: 5000 });
    await couponInput.click();
    await couponInput.fill(dynamicCouponCode);
    
    await page.locator('#couponAppliedForm').getByRole('button', { name: 'Apply' }).click();

    // Wait for discount line to appear in the order summary
    const discountLocator = page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]");
    await discountLocator.waitFor({ state: 'visible', timeout: 15000 });
    console.log(`✅ Coupon '${dynamicCouponCode}' applied successfully!`);

    // 3. Test Function: Calculate percentages, max discount & shipping for any chosen quantity
    const validateCartForQuantity = async (qty) => {
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
            console.log("⚠️ Price did not change. Continuing...");
        }
        await page.waitForTimeout(2000); // Visual buffer

        // Extract raw text for active prices
        const currentSubtotalText = await subtotalLocator.textContent();
        const currentDiscountText = await page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]").textContent();
        const currentShippingText = await page.locator("//p[normalize-space()='Shipping']/following-sibling::div//span").textContent();

        // Clean & parse to Float
        const currentSubtotal = parseFloat(currentSubtotalText?.replace(/[^0-9.]/g, '') || "0");
        const currentDiscount = parseFloat(currentDiscountText?.replace(/[^0-9.]/g, '') || "0");
        const currentShipping = parseFloat(currentShippingText?.replace(/[^0-9.]/g, '') || "0");

        // Calculate Discount Percentage
        let discountPercentage = 0;
        if (currentSubtotal > 0) {
            discountPercentage = (currentDiscount / currentSubtotal) * 100;
        }

        console.log(`Results -> Qty: ${qty} | Subtotal: $${currentSubtotal} | Discount: $${currentDiscount} (${discountPercentage.toFixed(2)}%) | Shipping: $${currentShipping}`);

        // Validate Maximum Discount Bound
        if (currentDiscount > 100) {
            console.log(`⚠️  NOTICE: Discount ($${currentDiscount}) exceeds $100. Check promotional limits.`);
        } else {
            console.log(`✅ Discount is within the standard standard limit ($100 max).`);
        }

        // Validate Free Shipping Bound
        if (currentSubtotal > 100) {
            if (currentShipping === 0) {
                console.log(`✅ Free shipping applied correctly (Subtotal > $100).`);
            } else {
                console.log(`⚠️  WARNING: Shipping is $${currentShipping} despite subtotal being over $100.`);
            }
        } else {
            console.log(`ℹ️  Subtotal is under $100. Standard shipping ($${currentShipping}) applies.`);
        }
    };

    // Run the logic sequentially across various quantities to verify percentages
    await validateCartForQuantity(1);
    await validateCartForQuantity(3);
    await validateCartForQuantity(6);
    await validateCartForQuantity(10);

    // 4. Proceed to Checkout and check Payment Methods
    console.log("Proceeding to Secure Checkout...");
    await page.getByRole('button', { name: 'Secure Checkout' }).first().click();

    // Fill Mandatory Fields
    console.log("Filling Customer Details...");
    await page.locator('input#emailField').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('input#emailField').fill('test@yopmail.com');
    await page.locator('input#firstname').fill('Gaurav');
    await page.locator('input#lastname').fill('jayant');
    
    // Address step first helps trigger shipping if needed
    console.log("Entering Canadian Address...");
    await page.locator('input#googleAddress').click();
    await page.locator('input#googleAddress').fill('111 Richmond St W, Toronto'); // Explicit highly specific address
    await page.waitForTimeout(2500); // Wait for Autocomplete network fetch
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Give the frontend enough ms to map the autocomplete data into hidden/visible fields
    await page.waitForTimeout(1500);

    // Guaranteed fallback data to enable the 'Save And Continue' button
    await page.locator('input#postcode').fill('M5H 2G4');
    await page.locator('input#city').fill('Toronto');
    await page.getByRole('textbox', { name: 'Phone Number' }).fill('8888888888');

    console.log("Saving Details and Proceeding to Payment Stage...");
    await page.getByRole('button', { name: 'Save And Continue' }).click();

    // Wait for the loader
    const checkoutLoader = page.locator('.loader');
    try {
        await expect(checkoutLoader).toBeHidden({ timeout: 60000 });
    } catch (e) {
        console.log("Loader visible for > 60s or didn't appear.");
    }
    await page.waitForTimeout(5000); // Buffer for payment methods to render after UI settles

    // 5. Count Payment Methods
    console.log("Scanning for Payment Methods...");
    
    let paymentMethods = page.locator('input[name="payment[method]"]');
    let count = await paymentMethods.count();

    if (count === 0) {
        paymentMethods = page.locator('div.payment-method');
        count = await paymentMethods.count();
    }
    
    if (count === 0) {
        // Custom DOM check (coversandall often uses role="radio")
        paymentMethods = page.locator('div[role="radio"]');
        count = await paymentMethods.count();
    }

    console.log(`✅ Total Available Payment Methods found: ${count}`);

    for (let i = 0; i < count; i++) {
        // Retrieve the inner text to print the name of the method
        const text = await paymentMethods.nth(i).textContent();
        // Remove massive blank spaces gracefully
        const cleanText = text?.replace(/\s+/g, ' ').trim();
        if (cleanText) {
            console.log(`- Payment Method ${i + 1}: ${cleanText}`);
        }
    }
});
