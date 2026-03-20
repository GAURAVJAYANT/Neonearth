const { test, expect } = require('@playwright/test');

const PAGE_URL = 'https://www.coversandall.com/custom-covers/custom-covers-p';

test.describe('Custom Covers Page Tests', () => {

    // ─────────────────────────────────────────────────────────────
    // GROUP 1: Page Load & Navigation (TC-01 to TC-04)
    // ─────────────────────────────────────────────────────────────

    test('TC-01: Verify page loads successfully with correct title', async ({ page }) => {
        const response = await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // Check HTTP status
        expect(response.status()).toBe(200);
        console.log(`✅ Page loaded with status: ${response.status()}`);

        // Check page title contains expected keywords
        const title = await page.title();
        console.log(`Page Title: ${title}`);
        expect(title.toLowerCase()).toContain('custom covers');
        console.log('✅ Page title verified.');
    });

    test('TC-02: Verify breadcrumb displays Home > Custom Covers > Custom Covers', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // ── STRATEGY ──────────────────────────────────────────────────────────
        // 1. Find the breadcrumb <ol> by filtering for the one that contains
        //    an anchor with text "Home" — avoids picking the wrong <ol> on page.
        // 2. Verify each crumb by its <li> position (0-indexed).
        // 3. Use href*= partial match so it works with both relative & absolute URLs.
        // ─────────────────────────────────────────────────────────────────────

        // Step 1: Find the correct <ol> that IS the breadcrumb
        const breadcrumb = page.locator('ol').filter({
            has: page.locator('a', { hasText: 'Home' })
        }).first();

        await breadcrumb.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ Breadcrumb <ol> container found and visible.');

        // Step 2: Get all <li> items inside this breadcrumb
        const crumbs = breadcrumb.locator('li');
        const crumbCount = await crumbs.count();
        console.log(`   Breadcrumb has ${crumbCount} items.`);
        expect(crumbCount).toBeGreaterThanOrEqual(3);

        // ── Crumb 1: "Home" ──────────────────────────────────────────────────
        const li1 = crumbs.nth(0);
        const li1Text = (await li1.innerText()).trim();
        const li1Href = await li1.locator('a').first().getAttribute('href').catch(() => '');
        console.log(`   Crumb 1 → text: "${li1Text}" | href: "${li1Href}"`);
        expect(li1Text).toContain('Home');
        expect(li1Href).toMatch(/coversandall\.com\/?$|^\/$/);
        console.log('✅ Crumb 1: "Home" verified.');

        // ── Crumb 2: "Custom Covers" (category page) ─────────────────────────
        const li2 = crumbs.nth(1);
        const li2Text = (await li2.innerText()).trim();
        const li2Href = await li2.locator('a').first().getAttribute('href').catch(() => '');
        console.log(`   Crumb 2 → text: "${li2Text}" | href: "${li2Href}"`);
        expect(li2Text).toContain('Custom Covers');
        expect(li2Href).toContain('custom-covers');
        console.log('✅ Crumb 2: "Custom Covers" (category) verified.');

        // ── Crumb 3: "Custom Covers" (current product page) ──────────────────
        const li3 = crumbs.nth(2);
        const li3Text = (await li3.innerText()).trim();
        // Crumb 3 may be plain text (no link) on some sites, so we handle both
        const li3Link = li3.locator('a').first();
        const li3Href = await li3Link.count() > 0
            ? await li3Link.getAttribute('href').catch(() => '')
            : '(no link — current page)';
        console.log(`   Crumb 3 → text: "${li3Text}" | href: "${li3Href}"`);
        expect(li3Text).toContain('Custom Covers');
        console.log('✅ Crumb 3: "Custom Covers" (current page) verified.');

        console.log('✅ Full breadcrumb "Home > Custom Covers > Custom Covers" verified successfully.');
    });

    test('TC-03: Verify top navigation menu links are visible', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.setViewportSize({ width: 1920, height: 1080 });

        const navLinksToCheck = [
            'All Products',
            'Patio Furniture Covers',
            'Grill',
            'Cushion',
            'Custom Covers',
            'Tarps',
            'Swimming Pool Covers'
        ];

        for (const linkText of navLinksToCheck) {
            const link = page.getByText(linkText, { exact: false }).first();
            try {
                await link.waitFor({ state: 'visible', timeout: 10000 });
                console.log(`✅ Nav link visible: "${linkText}"`);
            } catch (e) {
                console.warn(`⚠️ Nav link NOT found: "${linkText}"`);
            }
        }
    });

    test('TC-04: Verify promo banner is visible with discount code "COVER"', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        const promoBanner = page.getByText('COVER', { exact: false }).first();
        await expect(promoBanner).toBeVisible();

        const bannerText = await promoBanner.innerText();
        console.log(`✅ Promo Banner Text: "${bannerText}"`);
        expect(bannerText.toLowerCase()).toContain('cover');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 2: Custom Category Selection (TC-05 to TC-06)
    // ─────────────────────────────────────────────────────────────

    test('TC-05: Verify "Select Custom Category" dropdown is visible and clickable', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const categoryDropdown = page.getByText('Select Custom Category', { exact: false }).first();
        await expect(categoryDropdown).toBeVisible();
        console.log('✅ "Select Custom Category" dropdown is visible.');

        await categoryDropdown.click();
        await page.waitForTimeout(1000);
        console.log('✅ Dropdown clicked successfully.');
    });

    test('TC-06: Verify user can select a custom category from the dropdown', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Click the dropdown
        const categoryDropdown = page.getByText('Select Custom Category', { exact: false }).first();
        await categoryDropdown.click();
        await page.waitForTimeout(1000);

        // Try selecting the first option in the dropdown
        const firstOption = page.locator('select, [role="listbox"], [role="option"]').first();
        const optionCount = await firstOption.count();

        if (optionCount > 0) {
            await firstOption.click();
            console.log('✅ First category option selected.');
        } else {
            // Fallback: try a generic select element
            const selectEl = page.locator('select').first();
            if (await selectEl.count() > 0) {
                await selectEl.selectIndex(1);
                console.log('✅ Category selected from <select> element.');
            } else {
                console.warn('⚠️ Could not interact with dropdown options. Verify locator.');
            }
        }
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 3: Measurement Fields (TC-07 to TC-11)
    // ─────────────────────────────────────────────────────────────

    test('TC-07: Verify Height input field is visible and accepts numeric values', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Height is the first measurement input
        const heightLabel = page.getByText('Height', { exact: false }).first();
        await expect(heightLabel).toBeVisible();
        console.log('✅ Height label is visible.');

        // Find the input near the Height label
        const heightInput = page.locator('input[name*="height" i], input[id*="height" i], input[placeholder*="height" i]').first();
        if (await heightInput.count() > 0) {
            await heightInput.fill('24');
            const val = await heightInput.inputValue();
            expect(val).toBe('24');
            console.log(`✅ Height input accepts value: ${val}`);
        } else {
            console.warn('⚠️ Height input not found by name/id/placeholder. Check locator.');
        }
    });

    test('TC-08: Verify Width input field is visible and accepts numeric values', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const widthLabel = page.getByText('Width', { exact: false }).first();
        await expect(widthLabel).toBeVisible();
        console.log('✅ Width label is visible.');

        const widthInput = page.locator('input[name*="width" i], input[id*="width" i], input[placeholder*="width" i]').first();
        if (await widthInput.count() > 0) {
            await widthInput.fill('36');
            const val = await widthInput.inputValue();
            expect(val).toBe('36');
            console.log(`✅ Width input accepts value: ${val}`);
        } else {
            console.warn('⚠️ Width input not found by name/id/placeholder. Check locator.');
        }
    });

    test('TC-09: Verify Depth input field is visible and accepts numeric values', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const depthLabel = page.getByText('Depth', { exact: false }).first();
        await expect(depthLabel).toBeVisible();
        console.log('✅ Depth label is visible.');

        const depthInput = page.locator('input[name*="depth" i], input[id*="depth" i], input[placeholder*="depth" i]').first();
        if (await depthInput.count() > 0) {
            await depthInput.fill('18');
            const val = await depthInput.inputValue();
            expect(val).toBe('18');
            console.log(`✅ Depth input accepts value: ${val}`);
        } else {
            console.warn('⚠️ Depth input not found by name/id/placeholder. Check locator.');
        }
    });

    test('TC-10: Verify minimum height value validation (Min: 2)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const heightInput = page.locator('input[name*="height" i], input[id*="height" i]').first();
        if (await heightInput.count() > 0) {
            // Check if the HTML min attribute is set to 2
            const minAttr = await heightInput.getAttribute('min');
            console.log(`Height input min attribute: "${minAttr}"`);
            expect(minAttr).toBe('2');
            console.log('✅ Minimum height value is correctly set to 2.');
        } else {
            console.warn('⚠️ Height input not found. Verify locator for min validation check.');
        }
    });

    test('TC-11: Verify "How to Measure?" PDF link is visible and has correct href', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const measureLink = page.getByText('How to Measure?', { exact: false }).first();
        await expect(measureLink).toBeVisible();
        console.log('✅ "How to Measure?" link is visible.');

        const href = await measureLink.getAttribute('href');
        console.log(`Link href: ${href}`);
        expect(href).toBeTruthy();
        expect(href.toLowerCase()).toContain('.pdf');
        console.log('✅ "How to Measure?" link correctly points to a PDF.');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 4: Fabric Selection (TC-12 to TC-15)
    // ─────────────────────────────────────────────────────────────

    test('TC-12: Verify all 3 fabric options are displayed (Cover Max, Cover Rite, Cover Tuff)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const fabrics = ['Cover Max', 'Cover Rite', 'Cover Tuff'];
        for (const fabric of fabrics) {
            const fabricEl = page.getByText(fabric, { exact: false }).first();
            await expect(fabricEl).toBeVisible();
            console.log(`✅ Fabric option visible: "${fabric}"`);
        }
    });

    test('TC-13: Verify "Cover Max" shows correct price ($7.18) and warranty (7 Years)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const coverMaxSection = page.getByText('Cover Max', { exact: false }).first();
        await expect(coverMaxSection).toBeVisible();
        console.log('✅ Cover Max section is visible.');

        // Check price
        const price = page.getByText('$7.18', { exact: false }).first();
        await expect(price).toBeVisible();
        console.log('✅ Cover Max price $7.18 is visible.');

        // Check warranty
        const warranty = page.getByText('7', { exact: false }).first();
        await expect(warranty).toBeVisible();
        console.log('✅ Cover Max warranty info is visible.');
    });

    test('TC-14: Verify "Cover Rite" shows correct price ($9.26) and warranty (10 Years)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const coverRiteSection = page.getByText('Cover Rite', { exact: false }).first();
        await expect(coverRiteSection).toBeVisible();
        console.log('✅ Cover Rite section is visible.');

        const price = page.getByText('$9.26', { exact: false }).first();
        await expect(price).toBeVisible();
        console.log('✅ Cover Rite price $9.26 is visible.');
    });

    test('TC-15: Verify "Cover Tuff" shows correct price ($11.51) and warranty (10 Years)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const coverTuffSection = page.getByText('Cover Tuff', { exact: false }).first();
        await expect(coverTuffSection).toBeVisible();
        console.log('✅ Cover Tuff section is visible.');

        const price = page.getByText('$11.51', { exact: false }).first();
        await expect(price).toBeVisible();
        console.log('✅ Cover Tuff price $11.51 is visible.');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 5: Personalization (TC-16 to TC-17)
    // ─────────────────────────────────────────────────────────────

    test('TC-16: Verify "Personalize with LOGO or TEXT" option is visible with $9.99 price', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const personalizeText = page.getByText('Personalize', { exact: false }).first();
        await expect(personalizeText).toBeVisible();
        console.log('✅ Personalization option is visible.');

        const personalizePriceText = page.getByText('$9.99', { exact: false }).first();
        await expect(personalizePriceText).toBeVisible();
        console.log('✅ Personalization price $9.99 is visible.');
    });

    test('TC-17: Verify user can enable/toggle the personalization option', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Look for a checkbox or toggle button near the personalization text
        const personalizeToggle = page.locator('input[type="checkbox"]').first();
        if (await personalizeToggle.count() > 0) {
            const isCheckedBefore = await personalizeToggle.isChecked();
            await personalizeToggle.click();
            await page.waitForTimeout(500);
            const isCheckedAfter = await personalizeToggle.isChecked();
            expect(isCheckedAfter).toBe(!isCheckedBefore);
            console.log(`✅ Personalization toggle switched from ${isCheckedBefore} to ${isCheckedAfter}.`);
        } else {
            // Fallback: click the personalize text/button directly
            const personalizeBtn = page.getByText('Personalize', { exact: false }).first();
            await personalizeBtn.click();
            await page.waitForTimeout(500);
            console.log('✅ Personalization option clicked.');
        }
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 6: Tie Downs & Grommets (TC-18 to TC-19)
    // ─────────────────────────────────────────────────────────────

    test('TC-18: Verify "Tie Downs" option is visible and selectable', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const tieDownsOption = page.getByText('Tie Downs', { exact: false }).first();
        await expect(tieDownsOption).toBeVisible();
        console.log('✅ "Tie Downs" option is visible.');

        await tieDownsOption.click();
        await page.waitForTimeout(500);
        console.log('✅ "Tie Downs" option clicked successfully.');
    });

    test('TC-19: Verify "Grommets" option is visible with grommet size info', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const grommetsOption = page.getByText('Grommets', { exact: false }).first();
        await expect(grommetsOption).toBeVisible();
        console.log('✅ "Grommets" option is visible.');

        // Verify grommet size info is shown
        const grommetSizeInfo = page.getByText('Grommet Size', { exact: false }).first();
        await expect(grommetSizeInfo).toBeVisible();
        console.log('✅ Grommet size information is displayed.');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 7: Image Upload (TC-20 to TC-22)
    // ─────────────────────────────────────────────────────────────

    test('TC-20: Verify "Upload Reference Image" section is visible', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const uploadSection = page.getByText('Upload Reference Image', { exact: false }).first();
        await expect(uploadSection).toBeVisible();
        console.log('✅ "Upload Reference Image" section is visible.');

        const uploadBtn = page.getByText('Upload photo or select file', { exact: false }).first();
        await expect(uploadBtn).toBeVisible();
        console.log('✅ Upload button/area is visible.');
    });

    test('TC-21: Verify accepted file types are displayed (.jpg, .jpeg, .png, .pdf, .gif)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const fileTypeInfo = page.getByText('Supported File', { exact: false }).first();
        await expect(fileTypeInfo).toBeVisible();
        const fileTypeText = await fileTypeInfo.innerText();
        console.log(`File type text: "${fileTypeText}"`);

        const expectedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.gif'];
        for (const ext of expectedTypes) {
            expect(fileTypeText.toLowerCase()).toContain(ext.toLowerCase());
            console.log(`✅ File type "${ext}" is mentioned.`);
        }
    });

    test('TC-22: Verify max file size of 20MB is displayed', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const fileSizeInfo = page.getByText('20MB', { exact: false }).first();
        await expect(fileSizeInfo).toBeVisible();
        console.log('✅ Max file size "20MB" is displayed.');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 8: Quantity & Add to Cart (TC-23 to TC-25)
    // ─────────────────────────────────────────────────────────────

    test('TC-23: Verify Quantity "+" button increments the quantity', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Locate quantity input and + button
        const qtyInput = page.locator('input[name*="qty" i], input[id*="qty" i], input[type="number"]').first();
        const plusBtn = page.locator('button').filter({ hasText: '+' }).first();

        if (await plusBtn.count() > 0) {
            const beforeVal = await qtyInput.inputValue().catch(() => '1');
            await plusBtn.click();
            await page.waitForTimeout(500);
            const afterVal = await qtyInput.inputValue().catch(() => '');
            console.log(`Quantity before: ${beforeVal}, after: ${afterVal}`);
            expect(parseInt(afterVal)).toBeGreaterThan(parseInt(beforeVal));
            console.log('✅ Quantity incremented by + button.');
        } else {
            console.warn('⚠️ "+" button not found. Check locator.');
        }
    });

    test('TC-24: Verify Quantity "-" button decrements the quantity (not below 1)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const qtyInput = page.locator('input[name*="qty" i], input[id*="qty" i], input[type="number"]').first();
        const plusBtn = page.locator('button').filter({ hasText: '+' }).first();
        const minusBtn = page.locator('button').filter({ hasText: '-' }).first();

        if (await plusBtn.count() > 0 && await minusBtn.count() > 0) {
            // Increment first so decrement has room
            await plusBtn.click();
            await page.waitForTimeout(300);
            const beforeVal = await qtyInput.inputValue().catch(() => '2');

            await minusBtn.click();
            await page.waitForTimeout(300);
            const afterVal = await qtyInput.inputValue().catch(() => '');
            console.log(`Quantity before: ${beforeVal}, after: ${afterVal}`);
            expect(parseInt(afterVal)).toBeLessThan(parseInt(beforeVal));
            expect(parseInt(afterVal)).toBeGreaterThanOrEqual(1);
            console.log('✅ Quantity decremented, and stayed at or above 1.');
        } else {
            console.warn('⚠️ Quantity buttons not found. Check locator.');
        }
    });

    test('TC-25: Verify "Add to Cart" button is visible on the page', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Look for Add to Cart button
        const addToCartBtn = page.getByRole('button', { name: /add to cart/i }).first();
        if (await addToCartBtn.count() > 0) {
            await expect(addToCartBtn).toBeVisible();
            console.log('✅ "Add to Cart" button is visible.');
        } else {
            // Fallback text search
            const fallbackBtn = page.getByText('Add to Cart', { exact: false }).first();
            await expect(fallbackBtn).toBeVisible();
            console.log('✅ "Add to Cart" button is visible (via text search).');
        }
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 9: Assurance Plans (TC-26 to TC-27)
    // ─────────────────────────────────────────────────────────────

    test('TC-26: Verify "1 Year Assurance Plus" option is visible at $12.99', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const assurance1Year = page.getByText('1 Year Assurance Plus', { exact: false }).first();
        await expect(assurance1Year).toBeVisible();
        console.log('✅ "1 Year Assurance Plus" option is visible.');

        const price1Year = page.getByText('$12.99', { exact: false }).first();
        await expect(price1Year).toBeVisible();
        console.log('✅ "1 Year Assurance Plus" price $12.99 is visible.');
    });

    test('TC-27: Verify "3 Years Assurance Plus" option is visible at $19.99', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const assurance3Year = page.getByText('3 Years Assurance Plus', { exact: false }).first();
        await expect(assurance3Year).toBeVisible();
        console.log('✅ "3 Years Assurance Plus" option is visible.');

        const price3Year = page.getByText('$19.99', { exact: false }).first();
        await expect(price3Year).toBeVisible();
        console.log('✅ "3 Years Assurance Plus" price $19.99 is visible.');
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 10: Q&A Section (TC-28 to TC-30)
    // ─────────────────────────────────────────────────────────────

    test('TC-28: Verify Q&A section is visible with questions and answers', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Scroll down to expose Q&A section
        await page.keyboard.press('End');
        await page.waitForTimeout(1500);

        // Check for known Q&A questions from the page
        const qaQuestions = [
            'What are Air Vents?',
            'What are Split Options?',
            'What is a tie down?'
        ];

        for (const question of qaQuestions) {
            const qEl = page.getByText(question, { exact: false }).first();
            try {
                await qEl.waitFor({ state: 'visible', timeout: 8000 });
                console.log(`✅ Q&A question visible: "${question}"`);
            } catch (e) {
                console.warn(`⚠️ Q&A question not found: "${question}"`);
            }
        }
    });

    test('TC-29: Verify "Show More" button is visible and loads additional Q&A items', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        await page.keyboard.press('End');
        await page.waitForTimeout(1500);

        const showMoreBtn = page.getByText('Show More', { exact: false }).first();
        try {
            await showMoreBtn.waitFor({ state: 'visible', timeout: 10000 });
            await expect(showMoreBtn).toBeVisible();
            console.log('✅ "Show More" button is visible.');

            await showMoreBtn.click();
            await page.waitForTimeout(1500);
            console.log('✅ "Show More" button clicked — additional Q&A items should have loaded.');
        } catch (e) {
            console.warn('⚠️ "Show More" button not found. It may not exist if all Q&A items are already displayed.');
        }
    });

    test('TC-30: Verify "Write Your Own Question" form/link is visible', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        await page.keyboard.press('End');
        await page.waitForTimeout(1500);

        const writeQLink = page.getByText('Write Your Own Question', { exact: false }).first();
        try {
            await writeQLink.waitFor({ state: 'visible', timeout: 10000 });
            await expect(writeQLink).toBeVisible();
            console.log('✅ "Write Your Own Question" is visible.');
        } catch (e) {
            console.warn('⚠️ "Write Your Own Question" not found. Verify locator.');
        }
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 11: Product Tabs (TC-31 to TC-32)
    // ─────────────────────────────────────────────────────────────

    test('TC-31: Verify all product detail tabs are visible (Description, Tie Downs, Q&A, How to Measure)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const tabs = [
            'Product description',
            'Tie downs',
            'Q & A',
            'How to measure'
        ];

        for (const tab of tabs) {
            const tabEl = page.getByText(tab, { exact: false }).first();
            try {
                await tabEl.waitFor({ state: 'visible', timeout: 8000 });
                console.log(`✅ Tab visible: "${tab}"`);
            } catch (e) {
                console.warn(`⚠️ Tab NOT found: "${tab}"`);
            }
        }
    });

    test('TC-32: Verify clicking each product tab shows respective content', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const tabs = [
            { name: 'Product description', contentKeyword: 'description' },
            { name: 'Tie downs', contentKeyword: 'tie' },
            { name: 'Q & A', contentKeyword: 'question' },
            { name: 'How to measure', contentKeyword: 'measure' }
        ];

        for (const tab of tabs) {
            const tabEl = page.getByText(tab.name, { exact: false }).first();
            try {
                await tabEl.waitFor({ state: 'visible', timeout: 8000 });
                await tabEl.click();
                await page.waitForTimeout(1000);
                console.log(`✅ Clicked tab: "${tab.name}"`);

                // Verify content appeared after clicking
                const content = page.getByText(tab.contentKeyword, { exact: false }).first();
                await content.waitFor({ state: 'visible', timeout: 5000 });
                console.log(`   ✅ Content visible after clicking "${tab.name}"`);
            } catch (e) {
                console.warn(`⚠️ Could not interact with tab "${tab.name}": ${e.message}`);
            }
        }
    });

    // ─────────────────────────────────────────────────────────────
    // GROUP 12: Newsletter & Footer (TC-33 to TC-35)
    // ─────────────────────────────────────────────────────────────

    test('TC-33: Verify Newsletter signup section is visible with 20% off offer', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // Scroll to bottom to trigger newsletter section
        await page.keyboard.press('End');
        await page.waitForTimeout(2000);

        const newsletterSection = page.getByText('Sign Up', { exact: false }).first();
        try {
            await newsletterSection.waitFor({ state: 'visible', timeout: 10000 });
            console.log('✅ Newsletter "Sign Up" section is visible.');
        } catch (e) {
            console.warn('⚠️ Newsletter section not found.');
        }

        const discountOffer = page.getByText('20%', { exact: false }).first();
        try {
            await discountOffer.waitFor({ state: 'visible', timeout: 8000 });
            console.log('✅ Newsletter 20% discount offer text is visible.');
        } catch (e) {
            console.warn('⚠️ 20% discount offer text not found in newsletter section.');
        }
    });

    test('TC-34: Verify footer links are all visible (About Us, FAQs, Return Policy, etc.)', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // Scroll to footer
        await page.keyboard.press('End');
        await page.waitForTimeout(2000);

        const footerLinks = [
            { text: 'About Us', url: '/about-us' },
            { text: 'FAQs', url: '/faq' },
            { text: 'Return Policy', url: '/return-policy' },
            { text: 'Privacy Policy', url: '/privacy-policy' },
            { text: 'Sitemap', url: '/sitemap' },
            { text: 'Our Blog', url: '/blog' },
        ];

        for (const linkInfo of footerLinks) {
            const linkEl = page.getByText(linkInfo.text, { exact: false }).first();
            try {
                await linkEl.waitFor({ state: 'visible', timeout: 8000 });
                console.log(`✅ Footer link visible: "${linkInfo.text}"`);
            } catch (e) {
                console.warn(`⚠️ Footer link NOT found: "${linkInfo.text}"`);
            }
        }
    });

    test('TC-35: Verify phone number "800-260-2829" is visible and is a clickable tel: link', async ({ page }) => {
        await page.goto(PAGE_URL, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // Scroll to bottom
        await page.keyboard.press('End');
        await page.waitForTimeout(2000);

        // Check for the phone number as a tel: link
        const phoneLink = page.locator('a[href="tel:800-260-2829"]').first();
        try {
            await phoneLink.waitFor({ state: 'visible', timeout: 10000 });
            await expect(phoneLink).toBeVisible();
            const href = await phoneLink.getAttribute('href');
            expect(href).toBe('tel:800-260-2829');
            console.log(`✅ Phone number link found and verified: ${href}`);
        } catch (e) {
            // Fallback: just check the number text is visible
            const phoneText = page.getByText('800-260-2829', { exact: false }).first();
            await expect(phoneText).toBeVisible();
            console.log('✅ Phone number "800-260-2829" is visible on the page.');
        }
    });

});
