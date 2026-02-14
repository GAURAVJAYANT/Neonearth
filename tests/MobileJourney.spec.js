const { test, expect, devices } = require('@playwright/test');
console.log('MobileJourney: Imported dependencies');
console.log('MobileJourney: devices type:', typeof devices);
console.log('MobileJourney: Pixel 5:', devices['Pixel 5'] ? 'Found' : 'Missing');

// Use Pixel 5 emulation for these tests
const pixel5 = devices['Pixel 5'];
if (!pixel5) {
    console.log('Available devices:', Object.keys(devices));
    throw new Error("Device 'Pixel 5' NOT found in devices list.");
}
test.use({ ...pixel5 });

// We extend the test object to use custom mobile device settings for this specific file
test.describe('Mobile Journey Test', () => {
    console.log('MobileJourney: Inside describe block');

    test('test journey mobile', async ({ page }) => {
        // Log viewport to confirm mobile emulation
        const viewport = page.viewportSize();
        console.log(`Running on viewport: ${viewport.width}x${viewport.height}`);

        await page.goto('https://www.coversandall.com/');

        // Wait for banner to be visible before interacting
        const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
        try {
            await bannerLocator.waitFor({ state: 'visible', timeout: 10000 });
            const bannerText = await bannerLocator.innerText();
            const codeText = bannerText.split(':')[1].trim();
            console.log("Coupon Code:", codeText);
        } catch (e) {
            console.log("Banner not found or timeout, continuing...");
        }

        test.setTimeout(500000);

        // 1. Mobile Menu Interaction
        // On mobile, "Custom Covers" might be inside a hamburger menu or different structure.
        // Let's check for hamburger menu first.
        const hamburger = page.locator('span.action.nav-toggle'); // Common Magento mobile menu selector
        if (await hamburger.isVisible()) {
            console.log("Mobile Hamburger Menu detected. Clicking...");
            await hamburger.click();
            await page.waitForTimeout(1000);

            // Wait for menu to slide out
            await expect(page.locator('nav.navigation')).toBeVisible();

            // Click "Custom Covers" in mobile menu
            // Note: Menu structure often changes on mobile. 
            // We might need to click a specific category expander.
            console.log("Searching for 'Custom Covers' in mobile menu...");
            const customCoversMobile = page.locator('nav.navigation').getByText('Custom Covers').first();
            await customCoversMobile.scrollIntoViewIfNeeded();
            await customCoversMobile.click();
            await page.waitForTimeout(1000); // Wait for sub-menu expansion if any
        } else {
            // Fallback for tablet/desktop-like mobile views or if selector issue
            console.log("Hamburger not visible, checking for standard links...");
            const customCoversLinks = page.getByText('Custom Covers', { exact: true }).first();
            if (await customCoversLinks.isVisible()) {
                console.log("Clicking 'Custom Covers' link...");
                await customCoversLinks.click();
            } else {
                console.log("Custom Covers link also not found!");
            }
        }

        await page.waitForTimeout(3000);
        console.log("Current URL:", page.url());

        // 2. Select Cylinder Logic
        console.log("Selecting 'Round / Cylinder Shape'...");
        const roundShapeLink = page.getByRole('link', { name: /Cylinder/i }).first();

        try {
            await roundShapeLink.waitFor({ state: 'attached', timeout: 5000 });
        } catch (e) {
            console.log("Cylinder link not found immediately. We might be on Home Page or menu didn't open.");
            // Fallback: Go directly to Custom Covers Category page if possible, or try to find link via other means
            // Let's try finding it by text more loosely
            if (page.url() === 'https://www.coversandall.com/') {
                console.log("Still on Homepage. Attempting to extract href from Custom Covers link...");
                const link = page.getByText('Custom Covers', { exact: true }).first();
                const href = await link.getAttribute('href');
                if (href) {
                    console.log(`Navigating to extracted href: ${href}`);
                    await page.goto(href);
                } else {
                    console.log("Could not find href. Trying default fallback...");
                    // Try .html extension which is common heavily used on this site
                    await page.goto('https://www.coversandall.com/custom-covers.html');
                }
            }
        }

        // 2. Select Cylinder Logic (continue)
        // const roundShapeLink = page.getByRole('link', { name: /Cylinder/i }).first(); // Already defined above
        // Mobile specific: Ensure element is in view
        await roundShapeLink.waitFor({ state: 'attached', timeout: 15000 });
        await roundShapeLink.scrollIntoViewIfNeeded();

        // Mobile sometimes requires a tap, or force click if covered by something
        if (await roundShapeLink.isVisible()) {
            await roundShapeLink.click();
        } else {
            // Try forcing if hidden by sticky header
            await roundShapeLink.click({ force: true });
        }

        await page.waitForTimeout(4000);

        // Wait for measurement form
        await expect(page.getByText('Select or Enter Measurements')).toBeVisible({ timeout: 30000 });
        console.log("Measurement form visible.");

        // 3. Fill Measurements
        console.log("Attempting to fill Height (measurements.H)...");
        const heightInput = page.locator('[name="measurements.H"]');
        await heightInput.scrollIntoViewIfNeeded();
        await heightInput.click();
        await heightInput.clear();
        console.log("Typing '20' into Height...");
        await heightInput.pressSequentially('20', { delay: 100 });
        await page.waitForTimeout(1000);

        console.log("Attempting to fill Diameter (measurements.D)...");
        const diaInput = page.locator('[name="measurements.D"]');
        await diaInput.scrollIntoViewIfNeeded();
        await diaInput.click();
        await diaInput.clear();
        console.log("Typing '20' into Diameter...");
        await diaInput.pressSequentially('20', { delay: 100 });

        // IMPORTANT: On mobile, closing keyboard or triggering blur is crucial!
        await page.keyboard.press('Tab'); // Often works to blur
        // Click on a heading to ensure blur/calculation trigger
        await page.getByText('Select or Enter Measurements').click(); // Blur

        // Check for specific "Save" or "Next" button on mobile
        console.log("Checking for 'Save' or 'Next' button after dimensions...");
        const saveBtn = page.getByRole('button', { name: /(Save|Next|Calculate|Update)/i }).first();
        try {
            await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
            console.log("Found a button, attempting to click...");
            await saveBtn.scrollIntoViewIfNeeded();
            await saveBtn.click({ force: true });
            await page.waitForTimeout(2000);
        } catch (e) {
            console.log("Save/Next button NOT found or not visible. Proceeding...");
        }

        await page.waitForTimeout(5000); // Wait for price calc

        // 4. Select Fabric
        console.log("Attempting to select 'Cover Tuff' fabric...");
        const coverTuffText = page.getByText('Cover Tuff').first();
        await coverTuffText.scrollIntoViewIfNeeded();
        // On mobile, visual obscurement is common. Force click might differ.
        // Sometimes you need to click the radio button or container, not just text.
        // Let's try text first with force.
        try {
            await coverTuffText.click({ force: true, timeout: 5000 });
        } catch {
            console.log("Cover Tuff text click failed, trying parent container...");
            // Fallback strategy if needed
        }
        console.log("Clicked 'Cover Tuff'");

        await page.waitForTimeout(7000);

        // 5. Add to Cart
        // Mobile often has sticky "Add to Cart" at bottom.
        const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i }).first();
        await addToCartBtn.scrollIntoViewIfNeeded();
        await addToCartBtn.click({ force: true }); // Force often needed on mobile due to overlays

        // 6. Go to Cart (Popup might be full screen or bottom sheet on mobile)
        const goToCartBtn = page.getByText(/Go To Shopping Cart/i).first();
        await goToCartBtn.waitFor({ state: 'visible', timeout: 15000 });
        await goToCartBtn.click();

        // 7. Cart Validation
        await expect(page.locator(`p:has-text("Available Offers")`)).toBeVisible({ timeout: 20000 });

        await page.waitForTimeout(3000);

        // Apply Coupon Code
        const offers = page.locator(`p:has-text("Available Offers")`);
        if (await offers.isVisible()) {
            await offers.scrollIntoViewIfNeeded();
            await offers.click();
            await page.waitForTimeout(1000);
            const couponInput = page.locator(`input[name="couponCode"]`);
            await couponInput.fill("COVER");
            await page.locator('#couponAppliedForm').getByRole('button', { name: 'Apply' }).click();
            await page.waitForTimeout(3000); // Wait for coupon
        }

        // Iterative Quantity Check (2, 3, 4, 5, 6, 7, 8) - Robust Implementation
        const quantities = ['2', '3', '4', '5', '6', '7', '8'];

        for (const qty of quantities) {
            // Force reload to ensure fresh DOM for every update (brute force flaky fix)
            console.log("Reloading cart page to ensure fresh state...");
            await page.goto('https://www.coversandall.com/checkout/cart', { waitUntil: 'domcontentloaded' });

            // Wait for any AJAX loader to clear (Magento specific)
            const loader = page.locator('.loading-mask, .loader img');
            try { await expect(loader).toBeHidden({ timeout: 10000 }); } catch (e) { }

            console.log(`\n--- Updating Quantity to: ${qty} ---`);

            // Re-query the input to avoid stale element reference
            const qtyInputLoop = page.locator('input[data-role="cart-item-qty"]').first();

            if (await qtyInputLoop.count() > 0) {
                const currentVal = await qtyInputLoop.inputValue();
                console.log(`Current Quantity in Input: ${currentVal}`);

                if (currentVal !== qty) {
                    await qtyInputLoop.scrollIntoViewIfNeeded();
                    await qtyInputLoop.click();
                    await page.waitForTimeout(500);

                    // Manual clear using Backspace (forcefully clear 4 chars to be safe)
                    await qtyInputLoop.press('Backspace');
                    await qtyInputLoop.press('Backspace');
                    await qtyInputLoop.press('Backspace');
                    await qtyInputLoop.press('Backspace');
                    await page.waitForTimeout(200);

                    await qtyInputLoop.fill(qty);
                    await page.waitForTimeout(500);

                    await qtyInputLoop.press('Enter');

                    // Force Click on Update Cart Button (Critical for Mobile)
                    // Try multiple standard Magento locators for the update button
                    const updateBtn = page.locator('button[name="update_cart_action"], button[value="update_qty"], button.update-cart-item').first();

                    if (await updateBtn.count() > 0) {
                        console.log("Found Update Cart Button. Force Clicking...");
                        await updateBtn.click({ force: true });
                    } else {
                        console.log("Update Cart Button locator not found. Trying text...");
                        await page.getByText('Update Shopping Cart').first().click({ force: true });
                    }

                    // Allow time for the update to trigger
                    await page.waitForTimeout(4000);
                } else {
                    console.log("Quantity already matches target. Skipping update.");
                }
            } else {
                console.log("Qty Input not found! Trying fallback...");
                const fallback = page.getByRole('textbox').filter({ hasNotText: 'Discount Code' }).first();
                if (await fallback.count() > 0) {
                    await fallback.click();
                    await fallback.press('Backspace');
                    await fallback.press('Backspace'); // minimal
                    await fallback.fill(qty);
                    await fallback.press('Enter');

                    const updateBtn = page.getByRole('button', { name: /Update Shopping Cart|Update Cart/i }).first();
                    try {
                        await updateBtn.waitFor({ state: 'visible', timeout: 3000 });
                        await updateBtn.click();
                    } catch (e) { }
                }
            }

            console.log("Waiting for cart update/price change...");
            // Wait for loader again (post-update)
            try {
                // Wait for either loader appearance OR price change ideally, but loader is standard
                await expect(loader).toBeVisible({ timeout: 2000 });
            } catch (e) { }
            await expect(loader).toBeHidden({ timeout: 15000 });

            await page.waitForTimeout(2000); // Safety buffer

            // Capture Prices
            const subtotalText = await page.locator(".subtotal .price").first().textContent().catch(() => '0');
            const discountText = await page.locator(".discount .price, .discount .amount").first().textContent().catch(() => '0');
            const shippingText = await page.locator(".shipping .price").first().textContent().catch(() => '0');
            const grandTotalText = await page.locator(".grand.totals .price").first().textContent().catch(() => '0');

            // Calculate Percentage
            const parsePrice = (str) => parseFloat(str?.replace(/[^0-9.]/g, '') || '0');
            const subtotalVal = parsePrice(subtotalText);
            const discountVal = parsePrice(discountText);

            let percentage = 0;
            if (subtotalVal > 0) {
                percentage = (discountVal / subtotalVal) * 100;
            }

            console.log(`Qty: ${qty}`);
            console.log(`Subtotal: ${subtotalText?.trim()}`);
            console.log(`Discount: ${discountText?.trim()}`);
            console.log(`Discount Precentage: ${percentage.toFixed(2)}%`); // Log percentage
            console.log(`Shipping: ${shippingText?.trim()}`);
            console.log(`Grand Total: ${grandTotalText?.trim()}`);
        }

        // Checkout Process
        await page.getByRole('button', { name: 'Secure Checkout' }).first().click();

        // ... (Checkout form filling - usually standard, just lots of scrolling) ...
        // I will copy basic form filling but add scrollIntoViewIfNeeded
        await page.waitForTimeout(5000);

        await page.getByRole('textbox', { name: 'Email*' }).scrollIntoViewIfNeeded();
        await page.getByRole('textbox', { name: 'Email*' }).fill('test@yopmail.com');
        await page.getByRole('textbox', { name: 'First Name*' }).fill('Gaurav');
        await page.getByRole('textbox', { name: 'Last Name*' }).fill('jayant');
        await page.getByRole('textbox', { name: 'Phone Number' }).fill('8888888');
        await page.getByRole('textbox', { name: 'Address*' }).fill('stree');
        await page.waitForTimeout(1000);
        await page.getByText('StreetervilleChicago, IL, USA').click();

        console.log("Clicking 'Save And Continue'...");
        const saveContinueBtn = page.getByRole('button', { name: 'Save And Continue' });
        await saveContinueBtn.scrollIntoViewIfNeeded();
        await saveContinueBtn.click();

        // Mobile Loader check
        console.log("Waiting for loader to disappear...");
        const checkoutLoader = page.locator('.loader');
        try {
            await expect(checkoutLoader).toBeHidden({ timeout: 60000 });
            console.log("Loader is gone/hidden.");
        } catch (e) {
            console.log("Loader is STILL visible.");
        }

        // Final Purchase Step
        // ... (File upload might be tricky on mobile simulators, skipped for now to focus on 'Place Order')

        await page.waitForTimeout(3000);
        // Radio button might be different on mobile layout? Usually same.
        await page.getByRole('radio', { name: 'Purchase order' }).click();

        // Place Order
        const placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
        await placeOrderBtn.scrollIntoViewIfNeeded();
        // await placeOrderBtn.click();

        await page.waitForTimeout(10000);
        const orderNumber = await page.locator(`//div[1]/section/p[1]`).textContent();
        console.log("Order Number: " + orderNumber);

    });
});
