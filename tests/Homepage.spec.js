const { test, expect } = require('@playwright/test');

test('Homepage navigation', async ({ page }) => {
    test.setTimeout(0); // 
    

    const BASE_URL = 'https://test.coversandall.eu';

    // Open homepage
    await page.goto(BASE_URL, { timeout: 90000 });


    const TOP_MENU_XPATH =
        "//div[contains(@class,'no-scrollbar')]/div[contains(@class,'group')]/a[p]";
    const SUB_MENU_LINKS_XPATH =
        "//div[contains(@class,'group-hover:flex')]//a[p]";

    const topMenus = page.locator(TOP_MENU_XPATH);
    const topCount = await topMenus.count();

    console.log(`Total Top Categories: ${topCount}`);

    //  Loop TOP categories
    for (let i = 0; i < topCount; i++) {
        const topMenu = topMenus.nth(i);
        const topText = (await topMenu.innerText()).trim();

        console.log(`\n🔹 Top Category [${i + 1}]: ${topText}`);

        // Hover once to load submenu
        await topMenu.hover();
        await page.waitForTimeout(1000);

        // Collect all sub-category URLs
        const subLinks = await page
            .locator(SUB_MENU_LINKS_XPATH)
            .evaluateAll(elements => elements.map(el => el.href));

        console.log(`   Sub Categories Found: ${subLinks.length}`);

        // Loop SUB categories
        for (let j = 0; j < subLinks.length; j++) {
            const link = subLinks[j];
            console.log(`      ➤ Opening [${j + 1}]: ${link}`);

            await page.goto(link, { timeout: 60000 });
            await page.waitForLoadState('domcontentloaded');

            //  PDP visible delay (2–3 seconds)
            await page.waitForTimeout(2500);

            // Back to homepage
            await page.goto(BASE_URL, { timeout: 60000 });
            await page.waitForLoadState('domcontentloaded');

            // Re-hover same top category
            await page.locator(TOP_MENU_XPATH).nth(i).hover();
            await page.waitForTimeout(800);
        }
    }
});
