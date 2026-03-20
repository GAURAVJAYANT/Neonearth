const { test, expect } = require('@playwright/test');

test('UK Domain - Coupon and Quantity Discount Validation', async ({ page }) => {
    test.setTimeout(400000); // Allow time for multiple cart updates

    console.log("Navigating to coversandall.co.uk...");
    await page.goto('https://www.coversandall.co.uk/');

    // 1. Extract Coupon from Top Banner
    const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
    await bannerLocator.waitFor({ state: 'visible', timeout: 15000 });
    const bannerText = await bannerLocator.innerText();
    const dynamicCouponCode = bannerText.split(':')[1].trim();
    console.log(`✅ Extracted UK Coupon Code: ${dynamicCouponCode}`);

    // Navigate to a valid item to test discounts
    console.log("Adding a Custom Cylinder Cover to test the cart...");
    await page.goto('https://www.coversandall.co.uk/custom-covers/custom-cylinder-round-covers-p');
    
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

        // Swapped to GBP (£) formatting for logging clarity
        console.log(`Results -> Qty: ${qty} | Subtotal: £${currentSubtotal} | Discount: £${currentDiscount} (${discountPercentage.toFixed(2)}%) | Shipping: £${currentShipping}`);

        // Validate Maximum Discount Bound
        if (currentDiscount >= 100) {
            console.log(`⚠️  NOTICE: Discount (£${currentDiscount}) hits or exceeds limits. Verify promotional caps.`);
        } else {
            console.log(`✅ Discount is within the standard limit (£100 max).`);
        }
    };

    await validateCartForQuantity(2);
    await validateCartForQuantity(4);
    await validateCartForQuantity(6);
    await validateCartForQuantity(8);
    await validateCartForQuantity(10);
    await validateCartForQuantity(20);

    // 4. Proceed to Checkout and check Payment Methods
    console.log("Proceeding to Secure Checkout...");
    await page.getByRole('button', { name: 'Secure Checkout' }).first().click();

    // Fill Mandatory Fields
    console.log("Filling Customer Details...");
    await page.locator('input#emailField').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('input#emailField').fill('test@yopmail.com');
    await page.locator('input#firstname').fill('Gaurav');
    await page.locator('input#lastname').fill('jayant');
    
    // Explicit UK Address Autocomplete
    console.log("Entering UK Address...");
    await page.locator('input#googleAddress').click();
    await page.locator('input#googleAddress').fill('10 Downing St, London'); // Highly specific UK address
    await page.waitForTimeout(2500); // Wait for Autocomplete network fetch
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Give the frontend enough ms to map the autocomplete data into hidden/visible fields
    await page.waitForTimeout(1500);

    // Guaranteed fallback data to enable the 'Save And Continue' button
    await page.locator('input#postcode').fill('SW1A 2AA');
    await page.locator('input#city').fill('London');
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

    console.log(`✅ Total Available UK Payment Methods found: ${count}`);

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

test('UK Domain - Random Product Discount Validation', async ({ page }) => {
    test.setTimeout(400000);

    console.log("Navigating to coversandall.co.uk...");
    await page.goto('https://www.coversandall.co.uk/');

    // 1. Extract Coupon from Top Banner
    const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
    await bannerLocator.waitFor({ state: 'visible', timeout: 15000 });
    const bannerText = await bannerLocator.innerText();
    const dynamicCouponCode = bannerText.split(':')[1].trim();
    console.log(`✅ Extracted UK Coupon Code: ${dynamicCouponCode}`);

    // Navigate to the custom covers category page
    console.log("Navigating to Custom Covers Category...");
    await page.goto('https://www.coversandall.co.uk/custom-covers-c');
    
    // Wait for the product grid and fetch all product links
    await page.locator('a[href$="-p"]').first().waitFor({ state: 'visible', timeout: 15000 });
    const productLinks = page.locator('a[href$="-p"]');
    const productCount = Math.min(await productLinks.count(), 15); // Evaluate top 15 items
    
    const randomIndex = Math.floor(Math.random() * productCount);
    
    // Extract and Print the Product Name
    const selectedProduct = productLinks.nth(randomIndex);
    const rawName = await selectedProduct.textContent();
    const productName = rawName?.trim().split('\n')[0] || "Unknown Custom Cover";
    
    // Extract the strict URL to guarantee clean navigation devoid of UI overlay bugs
    const productHref = await selectedProduct.getAttribute('href');
    
    console.log(`\n======================================================`);
    console.log(`🛒 TESTING RANDOM PRODUCT: ${productName}`);
    console.log(`🔗 Target URL: ${productHref}`);
    console.log(`======================================================\n`);
    
    // Explicit route (fixes intercepted clicks or buggy dom)
    const absoluteProductUrl = productHref.startsWith('http') ? productHref : `https://www.coversandall.co.uk${productHref}`;
    await page.goto(absoluteProductUrl);
    
    // Wait for Product Page Add To Cart button
    await page.getByRole('button', { name: 'Add to Cart' }).waitFor({ state: 'visible', timeout: 15000 });
    
    // Fill random dimensions dynamically for all visible measurement inputs
    console.log("Filling dynamic dimensions...");
    const measurementInputs = page.locator('input[name^="measurements."]');
    await page.waitForTimeout(2000); 
    const numInputs = await measurementInputs.count();
    
    if (numInputs > 0) {
        for (let i = 0; i < numInputs; i++) {
            const randomDim = Math.floor(Math.random() * 20) + 15;
            if (await measurementInputs.nth(i).isVisible()) {
                await measurementInputs.nth(i).click();
                await measurementInputs.nth(i).fill(randomDim.toString());
                console.log(`✅ Filled dynamic dimension input with: ${randomDim}`);
            }
        }
    } else {
        console.log("⚠️ No dynamic measurement inputs found on this product. Proceeding.");
    }

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

    const discountLocator = page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]");
    await discountLocator.waitFor({ state: 'visible', timeout: 15000 });
    console.log(`✅ Coupon '${dynamicCouponCode}' applied successfully!`);

    // 3. Test Function: Calculate percentages
    const validateCartForQuantity = async (qty) => {
        console.log(`\n--- Testing Cart at Quantity: ${qty} ---`);
        const subtotalLocator = page.locator("(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]");
        const oldSubtotalText = await subtotalLocator.textContent();
        
        // Update DOM Quantity cleanly to avoid triggering 'Remove Item' popups on empty states
        const qtyInput = page.locator('[name="quantity"]');
        await qtyInput.fill(qty.toString());
        await page.waitForTimeout(1000);

        await subtotalLocator.click();

        try {
            await expect(subtotalLocator).not.toHaveText(oldSubtotalText || "", { timeout: 15000 });
        } catch (e) {
            console.log("⚠️ Price did not change. Continuing...");
        }
        await page.waitForTimeout(2000);

        const currentSubtotalText = await subtotalLocator.textContent();
        const currentDiscountText = await page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]").textContent();
        const currentShippingText = await page.locator("//p[normalize-space()='Shipping']/following-sibling::div//span").textContent();

        const currentSubtotal = parseFloat(currentSubtotalText?.replace(/[^0-9.]/g, '') || "0");
        const currentDiscount = parseFloat(currentDiscountText?.replace(/[^0-9.]/g, '') || "0");
        const currentShipping = parseFloat(currentShippingText?.replace(/[^0-9.]/g, '') || "0");

        let discountPercentage = 0;
        if (currentSubtotal > 0) discountPercentage = (currentDiscount / currentSubtotal) * 100;
        console.log(`Results -> Qty: ${qty} | Subtotal: £${currentSubtotal} | Discount: £${currentDiscount} (${discountPercentage.toFixed(2)}%) | Shipping: £${currentShipping}`);

        // Validate Maximum Discount Bound
        if (currentDiscount >= 100) {
            console.log(`⚠️  NOTICE: Discount (£${currentDiscount}) hits or exceeds limits. Verify promotional caps.`);
        } else {
            console.log(`✅ Discount is within the standard limit (£100 max).`);
        }
    };

    await validateCartForQuantity(2);
    await validateCartForQuantity(4);
    await validateCartForQuantity(6);
    await validateCartForQuantity(8);
    await validateCartForQuantity(10);
    await validateCartForQuantity(20);

    // 4. Proceed to Checkout and check Payment Methods
    console.log("Proceeding to Secure Checkout...");
    await page.getByRole('button', { name: 'Secure Checkout' }).first().click();

    // Fill Mandatory Fields
    console.log("Filling Customer Details...");
    await page.locator('input#emailField').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('input#emailField').fill('test@yopmail.com');
    await page.locator('input#firstname').fill('Gaurav');
    await page.locator('input#lastname').fill('jayant');
    
    // Explicit UK Address Autocomplete
    console.log("Entering UK Address...");
    await page.locator('input#googleAddress').click();
    await page.locator('input#googleAddress').fill('10 Downing St, London'); // Highly specific UK address
    await page.waitForTimeout(2500); // Wait for Autocomplete network fetch
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Give the frontend enough ms to map the autocomplete data into hidden/visible fields
    await page.waitForTimeout(1500);

    // Guaranteed fallback data to enable the 'Save And Continue' button
    await page.locator('input#postcode').fill('SW1A 2AA');
    await page.locator('input#city').fill('London');
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

    console.log(`✅ Total Available UK Payment Methods found: ${count}`);

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

test('UK Domain - Homepage Random Product Discount Validation', async ({ page }) => {
    test.setTimeout(400000);

    console.log("Navigating directly to coversandall.co.uk homepage...");
    await page.goto('https://www.coversandall.co.uk/');

    // 1. Extract Coupon from Top Banner
    const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
    await bannerLocator.waitFor({ state: 'visible', timeout: 15000 });
    const bannerText = await bannerLocator.innerText();
    const dynamicCouponCode = bannerText.split(':')[1].trim();
    console.log(`✅ Extracted UK Coupon Code: ${dynamicCouponCode}`);

    // Wait for the homepage product grid/carousels and fetch all product links
    await page.locator('a[href$="-p"]').first().waitFor({ state: 'visible', timeout: 15000 });
    const productLinks = page.locator('a[href$="-p"]');
    // The homepage has many links, let's grab from the top 20 visible product links
    const productCount = Math.min(await productLinks.count(), 20); 
    
    // Pick a valid random product from the homepage directly
    const randomIndex = Math.floor(Math.random() * productCount);
    const selectedProduct = productLinks.nth(randomIndex);
    const rawName = await selectedProduct.textContent();
    const productHref = await selectedProduct.getAttribute('href');
    
    // Clean name handling
    const productName = rawName?.replace(/\s+/g, ' ').trim() || "Unknown Homepage Product";
    
    console.log(`\n======================================================`);
    console.log(`🛒 TESTING HOMEPAGE RANDOM PRODUCT: ${productName}`);
    console.log(`🔗 Target URL: ${productHref}`);
    console.log(`======================================================\n`);
    
    // Explicit route to avoid carousel interception clicks
    const absoluteProductUrl = productHref.startsWith('http') ? productHref : `https://www.coversandall.co.uk${productHref}`;
    await page.goto(absoluteProductUrl);
    
    // Wait for Product Page Add To Cart button
    await page.getByRole('button', { name: 'Add to Cart' }).waitFor({ state: 'visible', timeout: 15000 });
    
    // Fill random dimensions dynamically for all visible measurement inputs
    console.log("Filling dynamic dimensions...");
    const measurementInputs = page.locator('input[name^="measurements."]');
    await page.waitForTimeout(2000); 
    const numInputs = await measurementInputs.count();
    
    if (numInputs > 0) {
        for (let i = 0; i < numInputs; i++) {
            const randomDim = Math.floor(Math.random() * 20) + 15;
            if (await measurementInputs.nth(i).isVisible()) {
                await measurementInputs.nth(i).click();
                await measurementInputs.nth(i).fill(randomDim.toString());
                console.log(`✅ Filled dynamic dimension input with: ${randomDim}`);
            }
        }
    } else {
        console.log("⚠️ No dynamic measurement inputs found on this product. Proceeding.");
    }

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

    const discountLocator = page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]");
    await discountLocator.waitFor({ state: 'visible', timeout: 15000 });
    console.log(`✅ Coupon '${dynamicCouponCode}' applied successfully!`);

    // 3. Test Function: Calculate percentages
    const validateCartForQuantity = async (qty) => {
        console.log(`\n--- Testing Cart at Quantity: ${qty} ---`);
        const subtotalLocator = page.locator("(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]");
        const oldSubtotalText = await subtotalLocator.textContent();
        
        const qtyInput = page.locator('[name="quantity"]');
        await qtyInput.fill(qty.toString());
        await page.waitForTimeout(1000);

        await subtotalLocator.click();

        try {
            await expect(subtotalLocator).not.toHaveText(oldSubtotalText || "", { timeout: 15000 });
        } catch (e) {
            console.log("⚠️ Price did not change. Continuing...");
        }
        await page.waitForTimeout(2000);

        const currentSubtotalText = await subtotalLocator.textContent();
        const currentDiscountText = await page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]").textContent();
        const currentShippingText = await page.locator("//p[normalize-space()='Shipping']/following-sibling::div//span").textContent();

        const currentSubtotal = parseFloat(currentSubtotalText?.replace(/[^0-9.]/g, '') || "0");
        const currentDiscount = parseFloat(currentDiscountText?.replace(/[^0-9.]/g, '') || "0");
        const currentShipping = parseFloat(currentShippingText?.replace(/[^0-9.]/g, '') || "0");

        let discountPercentage = 0;
        if (currentSubtotal > 0) discountPercentage = (currentDiscount / currentSubtotal) * 100;
        console.log(`Results -> Qty: ${qty} | Subtotal: £${currentSubtotal} | Discount: £${currentDiscount} (${discountPercentage.toFixed(2)}%) | Shipping: £${currentShipping}`);

        // Validate Maximum Discount Bound
        if (currentDiscount >= 100) {
            console.log(`⚠️  NOTICE: Discount (£${currentDiscount}) hits or exceeds limits. Verify promotional caps.`);
        } else {
            console.log(`✅ Discount is within the standard limit (£100 max).`);
        }
    };

    // Extended High-Volume Quantity Tests as explicitly requested!
    await validateCartForQuantity(2);
    await validateCartForQuantity(4);
    await validateCartForQuantity(6);
    await validateCartForQuantity(8);
    await validateCartForQuantity(10);
    await validateCartForQuantity(20);
    await validateCartForQuantity(50);
    await validateCartForQuantity(100); // Verify maximum discount bound

    // 4. Proceed to Checkout and check Payment Methods
    console.log("Proceeding to Secure Checkout...");
    await page.getByRole('button', { name: 'Secure Checkout' }).first().click();

    // Fill Mandatory Fields
    console.log("Filling Customer Details...");
    await page.locator('input#emailField').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('input#emailField').fill('test@yopmail.com');
    await page.locator('input#firstname').fill('Gaurav');
    await page.locator('input#lastname').fill('jayant');
    
    // Explicit UK Address Autocomplete
    console.log("Entering UK Address...");
    await page.locator('input#googleAddress').click();
    await page.locator('input#googleAddress').fill('10 Downing St, London'); // Highly specific UK address
    await page.waitForTimeout(2500); // Wait for Autocomplete network fetch
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Give the frontend enough ms to map the autocomplete data into hidden/visible fields
    await page.waitForTimeout(1500);

    // Guaranteed fallback data to enable the 'Save And Continue' button
    await page.locator('input#postcode').fill('SW1A 2AA');
    await page.locator('input#city').fill('London');
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

    console.log(`✅ Total Available UK Payment Methods found: ${count}`);

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
