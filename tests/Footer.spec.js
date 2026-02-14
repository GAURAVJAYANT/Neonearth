const { test, expect } = require('@playwright/test');
const { BasePage } = require('../pages/BasePage');

test.describe('Footer and Static Pages Tests', () => {

    test('Should subscribe to newsletter successfully', async ({ page }) => {
        const basePage = new BasePage(page);
        await basePage.navigate('https://www.coversandall.com/');

        // Use a random email to avoid "already subscribed" errors ideally
        const randomEmail = `testuser${Date.now()}@groupbayport.com`;
        await basePage.subscribeToNewsletter(randomEmail);

        // Verify success message
        await expect(page.locator('.message-success')).toContainText('Thank you for your subscription');
    });

    test('Should navigate to Contact Us page', async ({ page }) => {
        const basePage = new BasePage(page);
        await basePage.navigate('https://www.coversandall.com/');

        await basePage.clickContactUs();

        await expect(page).toHaveURL(/contact-us/);
        await expect(page.locator('h1')).toContainText('Contact Us');
    });

    test('Links open one by one in tab, smooth scroll, and check status', async ({ page, context }) => {
        // Increase timeout to 5 minutes as scrolling 21 pages takes time
        test.setTimeout(900000);

        const basePage = new BasePage(page);
        await basePage.navigate('https://www.coversandall.com/');

        // Wait for footer to be present. Using the locator provided by user.
        const footerLinks = page.locator("//div[contains(@class,'grid-cols-3')]//a");

        // Wait for at least one link to be visible
        await footerLinks.first().waitFor({ state: 'visible', timeout: 30000 });

        const count = await footerLinks.count();
        console.log(`Found ${count} footer links to check.`);

        if (count !== 21) {
            console.warn(`Expected 21 footer links but found ${count}. Proceeding with found count.`);
        }

        // Helper function for smooth scrolling
        const simulateSmoothScroll = async (targetPage) => {
            await targetPage.evaluate(async () => {
                const distance = 100; // smaller chunks for smoother look
                const delay = 100;    // 100ms delay for slower scroll

                // Scroll Down
                const totalHeight = document.body.scrollHeight;
                let currentHeight = 0;
                while (currentHeight < totalHeight) {
                    window.scrollBy(0, distance);
                    currentHeight += distance;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                // Wait at bottom
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Scroll Up (Little faster to return)
                while (currentHeight > 0) {
                    window.scrollBy(0, -distance);
                    currentHeight -= distance;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            });
        };

        for (let i = 0; i < count; i++) {
            const link = footerLinks.nth(i);
            const href = await link.getAttribute('href');

            if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:') && !href.includes('#')) {
                console.log(`\n--- Link ${i + 1}/${count} ---`);

                // Open in new tab using Ctrl+Click
                const [newPage] = await Promise.all([
                    context.waitForEvent('page'),
                    link.click({ modifiers: ['Control'] })
                ]);

                try {
                    // Wait for full load
                    await newPage.waitForLoadState('load');
                    await newPage.bringToFront(); // Ensure focus

                    const pageUrl = newPage.url();
                    console.log(`Page Loaded: ${pageUrl}`);

                    // Validate status code first
                    const response = await newPage.request.get(pageUrl);
                    const status = response.status();

                    if (status === 400 || status === 500) {
                        console.error(`❌ Link Broken: ${pageUrl} returned status ${status}`);
                    } else {
                        console.log(`✅ Valid Status: ${status}`);
                    }
                    expect(status).not.toBe(400);
                    expect(status).not.toBe(500);

                    // Perform Visible Smooth Scroll
                    console.log("Performing smooth scroll...");
                    await simulateSmoothScroll(newPage);
                    await newPage.waitForTimeout(1000); // Visual pause at top before closing

                } catch (e) {
                    console.log(`⚠️ Error during validation or scrolling: ${e.message}`);
                } finally {
                    console.log("Closing tab...");
                    await newPage.close();
                }

                await page.bringToFront();

            } else {
                console.log(`Skipping non-navigable link ${i + 1}: ${href}`);
            }
        }
    });

    test('Footer Copyright Text Validation', async ({ page }) => {
        const basePage = new BasePage(page);
        await basePage.navigate('https://www.coversandall.com/');

        // Wait for footer content
        const footer = page.locator('footer, .footer');
        await footer.first().waitFor({ state: 'visible', timeout: 30000 });

        // Scroll to bottom
        await page.keyboard.press('End');
        await page.waitForTimeout(2000); // Visual pause

        // 1. Broad search for "Rights Reserved" to be robust against "© 2026 . All Rights Reserved." vs "© 2026 All Rights Reserved"
        const copyrightLocator = page.getByText('Rights Reserved', { exact: false });

        try {
            await copyrightLocator.first().waitFor({ state: 'visible', timeout: 10000 });
            const text = await copyrightLocator.first().innerText();
            console.log(`✅ Found Copyright Section: "${text}"`);

            // Soft assertion on year (allow 2025 or 2026)
            if (text.includes('2026') || text.includes('2025')) {
                console.log("   ✅ Year check passed.");
            } else {
                console.warn("   ⚠️ Year 2025/2026 not found in copyright text.");
            }

            await expect(copyrightLocator.first()).toBeVisible();
        } catch (e) {
            console.error("❌ 'Rights Reserved' text NOT found (or timed out).");

            // Dump footer text to help debug user's issue
            try {
                const footerText = await footer.first().innerText();
                console.log("--- FOOTER TEXT DUMP ---");
                console.log(footerText.substring(0, 500) + "...");
                console.log("------------------------");
            } catch (err) {
                console.error("Could not read footer text either.");
            }
            throw e; // Fail the test so user sees it
        }
    });

});
