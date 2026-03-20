const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../pages/ProductPage');

// Test Data Separation
const testData = {
    email: 'test@yopmail.com',
    firstName: 'Gaurav',
    lastName: 'jayant',
    phone: '8888888',
    uploadFilePath: 'data/upload_test_file.txt'
};

// Data Driven Testing (DDT) Parameterization
const regions = [
    { name: 'US', url: 'https://www.coversandall.com/', addressQuery: 'Chicago' },
    { name: 'AU', url: 'https://www.coversandall.com.au/', addressQuery: 'Sydney' },
    { name: 'CA', url: 'https://www.coversandall.ca/', addressQuery: 'Toronto' }
];

test.describe('Customization Journeys', () => {

    test.setTimeout(500000); // Allow sufficient time for all cart quantity cycles

    for (const region of regions) {
        test(`${region.name} journey`, async ({ page }) => {

            await page.goto(region.url);
            
            // Wait for banner to be visible before interacting
            const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
            await bannerLocator.waitFor({ state: 'visible' });

            const bannerText = await bannerLocator.innerText();
            const codeText = bannerText.split(':')[1].trim();
            console.log(`[${region.name}] Coupon Code:`, codeText);

            // 1. Hover over Main Menu 'Custom Covers'
            const customCoversLinks = page.getByText('Custom Covers', { exact: true });
            const count = await customCoversLinks.count();
            console.log(`[${region.name}] Found ${count} 'Custom Covers' elements.`);

            let mainMenu = null;
            // Find the first visible 'Custom Covers' (Main Menu)
            for (let i = 0; i < count; i++) {
                if (await customCoversLinks.nth(i).isVisible()) {
                    mainMenu = customCoversLinks.nth(i);
                    break;
                }
            }

            if (mainMenu) {
                console.log(`[${region.name}] ✅ Main Menu "Custom Covers" found. Hovering...`);
                await mainMenu.hover();
                
                // 2. Click Sub Menu 'Custom Covers'
                const allCustomCovers = page.getByText('Custom Covers', { exact: true });
                const newCount = await allCustomCovers.count();
                let subMenu = null;

                let visibleLinks = [];
                for (let i = 0; i < newCount; i++) {
                    if (await allCustomCovers.nth(i).isVisible()) {
                        visibleLinks.push(allCustomCovers.nth(i));
                    }
                }

                if (visibleLinks.length > 1) {
                    console.log(`[${region.name}] ✅ Found ${visibleLinks.length} visible "Custom Covers" links. Clicking the second one (Sub-Category)...`);
                    subMenu = visibleLinks[1]; // Index 1 is the second item
                } else {
                    console.log(`[${region.name}] ⚠️ Only 1 visible link found. Clicking it (fallback)...`);
                    subMenu = visibleLinks[0];
                }

                if (subMenu) {
                    await subMenu.waitFor({ state: 'visible', timeout: 5000 });
                    await subMenu.click();
                } else {
                    console.log(`[${region.name}] ❌ Sub Menu NOT found!`);
                }

            } else {
                console.log(`[${region.name}] ❌ Main Menu "Custom Covers" not found`);
            }

            console.log(`[${region.name}] Selecting 'Round / Cylinder Shape'...`);
            // Refined locator: Search for "Cylinder" text in links
            const roundShapeLink = page.getByRole('link', { name: /Cylinder/i }).first();
            await roundShapeLink.waitFor({ state: 'visible', timeout: 10000 });
            await roundShapeLink.click();

            // Wait for "Select or Enter Measurements" text to confirm page load natively.
            await expect(page.getByText('Select or Enter Measurements')).toBeVisible({ timeout: 30000 });
            console.log(`[${region.name}] Measurement form visible.`);

            // Proceed to filling measurements with strict IDs found via scan
            console.log(`[${region.name}] Attempting to fill Height (input#H)...`);
            await page.locator('input#H').fill('20');

            console.log(`[${region.name}] Attempting to fill Diameter (input#D)...`);
            await page.locator('input#D').fill('20');

            console.log(`[${region.name}] Attempting to select 'Cover Tuff' fabric...`);
            const coverTuffText = page.getByText('Cover Tuff').first();

            if (await coverTuffText.isVisible()) {
                await coverTuffText.scrollIntoViewIfNeeded();
                await coverTuffText.click({ force: true });
                console.log(`[${region.name}] Clicked 'Cover Tuff'`);
            } else {
                console.error(`[${region.name}] 'Cover Tuff' element NOT found/visible!`);
            }
            
            // Allow frontend debounce to update the Add to Cart state.
            await page.waitForTimeout(5000); 

            await page.getByRole('button', { name: 'Add to Cart' }).click();

            const goToCartBtn = page.getByText(/Go To Shopping Cart/i).first();
            await goToCartBtn.waitFor({ state: 'visible', timeout: 15000 });
            await goToCartBtn.click();

            // Wait for cart page to load
            await expect(page.locator(`p:has-text("Available Offers")`)).toBeVisible({ timeout: 20000 });
            await page.waitForTimeout(4000); // Visual buffer to ensure cart hydration before clicking
            await page.locator(`p:has-text("Available Offers")`).click({ force: true });

            const couponInput = page.locator(`input[name="couponCode"]`);
            await couponInput.waitFor({ state: 'visible', timeout: 5000 });
            await couponInput.click();
            await couponInput.fill(codeText);
            
            await page.locator('#couponAppliedForm').getByRole('button', { name: 'Apply' }).click();

            const discountLocator2 = page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]");
            await discountLocator2.waitFor({ state: 'visible', timeout: 15000 });

            const subtotalTextRaw = await page.locator("(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]").textContent();
            console.log(`[${region.name}] Subtotal:`, subtotalTextRaw?.trim());

            const discountTextRaw = await discountLocator2.textContent();
            console.log(`[${region.name}] Discount:`, discountTextRaw?.trim());

            // Calculate Discount Percentage
            const subtotalValue = parseFloat(subtotalTextRaw?.replace(/[^0-9.]/g, '') || "0");
            const discountValue = parseFloat(discountTextRaw?.replace(/[^0-9.]/g, '') || "0");

            if (subtotalValue > 0) {
                const percentage = (discountValue / subtotalValue) * 100;
                console.log(`[${region.name}] Discount Percentage: ${percentage.toFixed(2)}%`);
                const priceAfterDiscount = subtotalValue - discountValue;
                console.log(`[${region.name}] Price After Discount: ${priceAfterDiscount.toFixed(2)}`);
            } else {
                console.log(`[${region.name}] Subtotal is 0 or invalid, cannot calculate percentage.`);
            }

            if (subtotalValue < 100) {
                const shipping = await page.locator("//p[normalize-space()='Shipping']/following-sibling::div//span").textContent();
                console.log(`[${region.name}] Shipping Price:`, shipping?.trim());
            }

            // Extracted Shared Function
            const checkQuantity = async (qty) => {
                console.log(`\n[${region.name}] --- Manually Testing Quantity: ${qty} ---`);
                const subtotalLocator = page.locator("(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]");

                const oldSubtotalText = await subtotalLocator.textContent();
                const oldSubtotal = parseFloat(oldSubtotalText?.replace(/[^0-9.]/g, '') || "0");
                console.log(`[${region.name}] Current Subtotal (Before Update): $${oldSubtotal}`);

                // Update DOM cleanly to avoid triggering 'Remove Item' popups
                const qtyInput = page.locator('[name="quantity"]');
                await qtyInput.fill(qty.toString());
                await page.waitForTimeout(1000);

                await subtotalLocator.click();

                try {
                    await expect(subtotalLocator).not.toHaveText(oldSubtotalText || "", { timeout: 15000 });
                } catch (e) {
                    console.log(`[${region.name}] ⚠️ Price did not change within timeout (or was same). continuing...`);
                }

                await page.waitForTimeout(2000); // Small buffer after change detected

                const currentSubtotalText = await subtotalLocator.textContent();
                const currentDiscountText = await page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]").textContent();
                const currentShippingText = await page.locator("//p[normalize-space()='Shipping']/following-sibling::div//span").textContent();

                const currentSubtotal = parseFloat(currentSubtotalText?.replace(/[^0-9.]/g, '') || "0");
                const currentDiscount = parseFloat(currentDiscountText?.replace(/[^0-9.]/g, '') || "0");
                const currentShipping = parseFloat(currentShippingText?.replace(/[^0-9.]/g, '') || "0");

                let discountPercentage = 0;
                if (currentSubtotal > 0) {
                    discountPercentage = (currentDiscount / currentSubtotal) * 100;
                }

                console.log(`[${region.name}] Qty: ${qty} | Subtotal: $${currentSubtotal} | Discount: $${currentDiscount} (${discountPercentage.toFixed(2)}%) | Shipping: $${currentShipping}`);

                // Checks
                if (currentDiscount > 100) {
                    console.log(`[${region.name}] ⚠️ INFO: Discount ($${currentDiscount}) exceeds $100. (Test continues)`);
                } else {
                    console.log(`[${region.name}] ✅ Discount is within limit ($100).`);
                }

                if (currentSubtotal > 100) {
                    if (currentShipping === 0) {
                        console.log(`[${region.name}] ✅ Free shipping applied (Subtotal > $100).`);
                    } else {
                        console.log(`[${region.name}] ⚠️ INFO: Shipping ($${currentShipping}) is NOT free for subtotal > $100. (Test continues)`);
                    }
                } else {
                    console.log(`[${region.name}] ℹ️ Subtotal <= $100 ($${currentSubtotal}). Shipping is applicable: $${currentShipping}`);
                }
            };

            await checkQuantity(2);
            await checkQuantity(4);
            await checkQuantity(6);
            await checkQuantity(8);

            await page.getByRole('button', { name: 'Secure Checkout' }).first().click();

            await page.locator('input#emailField').waitFor({ state: 'visible', timeout: 15000 });
            await page.locator('input#emailField').fill(testData.email);
            await page.locator('input#firstname').fill(testData.firstName);
            await page.locator('input#lastname').fill(testData.lastName);
            await page.getByRole('textbox', { name: 'Phone Number' }).fill(testData.phone);
            
            // Replaced fragile logic with generic keyboard focus events using explicit Google Autocomplete ID
            await page.locator('input#googleAddress').click();
            await page.locator('input#googleAddress').fill(region.addressQuery);
            await page.waitForTimeout(2000); // Wait for Map Autocomplete API Dropdown
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');

            /*
            console.log("Clicking 'Save And Continue'...");
            await page.getByRole('button', { name: 'Save And Continue' }).click();

            // Smart Wait implementation for Loader
            console.log("Waiting for loader to disappear...");
            const checkoutLoader = page.locator('.loader');
            try {
                await expect(checkoutLoader).toBeHidden({ timeout: 60000 });
            } catch (e) {
                console.log("Loader is STILL visible after 60s.");
            }

            await page.getByRole('radio', { name: 'Purchase order' }).click();
            
            // Abstracted specific file uploads 
            const fileChooserPromise = page.waitForEvent('filechooser');
            await page.getByRole('button', { name: 'SELECT FILE' }).click();
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles(testData.uploadFilePath);

            // Uncomment Place Order if ready
            //  await page.getByRole('button', { name: 'Place Order' }).click();
            await page.waitForTimeout(5000);
            */

            console.log(`[${region.name}] Test intentionally ending after address entry without placing order.`);

        });
    }
});
