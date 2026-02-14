const { test, expect, devices } = require('@playwright/test');
const productData = require('../data/productData.json');

// Use Pixel 5 emulation
test.use({ ...devices['Pixel 5'] });

test.describe('Mobile Journey - Data Driven', () => {

    for (const data of productData) {
        test(`Run Purchase Journey for ${data.productName} (${data.testCaseId})`, async ({ page }) => {
            console.log(`Starting test for: ${data.productName}`);

            // 1. Navigate to specific product/category URL
            await page.goto(data.url);
            await page.waitForLoadState('domcontentloaded');

            // 2. Select Product (Generic Logic)
            // If we are on a category page, click the first product
            if (page.url().includes('custom-tarps') || page.url().includes('custom-covers')) {
                const productLink = page.locator('.product-item-link').first();
                if (await productLink.isVisible()) {
                    await productLink.click();
                }
            }

            // 3. Fill Dimensions (Dynamic based on data)
            console.log("Filling dimensions:", data.dimensions);
            for (const [key, value] of Object.entries(data.dimensions)) {
                // Robust keys: 'W' might map to 'Width', 'H' to 'Height', 'D' to 'Depth'
                const labelMap = { 'W': 'Width', 'H': 'Height', 'D': 'Depth', 'L': 'Length' };
                const label = labelMap[key] || key;

                // Try multiple strategies to find the input
                const input = page.locator(`input[name*="measurements"][name*="${key}"]`)
                    .or(page.locator(`input[name*="[${key}]"]`)) // Catch name="measurements[D]"
                    .or(page.locator(`input[id="${key}"]`))
                    .or(page.getByLabel(label, { exact: false }))
                    .or(page.getByPlaceholder(label, { exact: false }))
                    .first();

                if (await input.count() > 0 && await input.isVisible()) {
                    await input.fill(value);
                } else {
                    console.log(`Dimension input ${key} (${label}) not found. Trying fallback...`);
                    // Force lookup by just the letter if simple
                    await page.locator(`input[name*="${key}"]`).first().fill(value).catch(() => console.log("Fallback failed"));
                }
            }

            // 4. Add to Cart
            await page.getByRole('button', { name: /Add to Cart/i }).first().click();

            // 5. Go to Cart
            const cartLink = page.getByRole('link', { name: 'Go To Shopping Cart' }).or(page.locator('.action.showcart'));
            // Wait for success message or popup
            await page.waitForTimeout(3000);
            await page.goto('https://www.coversandall.com/checkout/cart');

            // 6. Quantity Update Loop (using our robust logic)
            for (const qty of data.quantities) {
                console.log(`Updating quantity to: ${qty}`);

                // Force Clean Reload for reliability
                await page.reload({ waitUntil: 'domcontentloaded' });

                const loader = page.locator('.loading-mask, .loader img');
                await expect(loader).toBeHidden({ timeout: 10000 });

                const qtyInputLoop = page.locator('input[data-role="cart-item-qty"]').first();
                if (await qtyInputLoop.isVisible()) {
                    await qtyInputLoop.click();
                    await qtyInputLoop.press('Backspace');
                    await qtyInputLoop.press('Backspace');
                    await qtyInputLoop.fill(qty);
                    await qtyInputLoop.press('Enter');

                    // Force Update Cart
                    const updateBtn = page.locator('button[name="update_cart_action"], button.update-cart-item').first();
                    if (await updateBtn.count() > 0) {
                        await updateBtn.click({ force: true });
                    } else {
                        await page.getByText('Update Shopping Cart').first().click({ force: true });
                    }

                    await page.waitForTimeout(4000);
                }
            }

            // 7. Verify Checkout Button
            const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout/i }).first();
            await expect(checkoutBtn).toBeVisible();

            console.log(`Test for ${data.productName} completed.`);
        });
    }

});
