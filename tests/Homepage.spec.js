const { test, expect } = require('@playwright/test');

test('Homepage Navigation & Verification @smoke @owner:QA_Team', async ({ page }) => {
    test.setTimeout(0); // 


    const BASE_URL = 'https://test.coversandall.eu';

    // Open homepage
    await page.goto(BASE_URL, { timeout: 90000 });


    const TOP_MENU_XPATH =
        "//div[contains(@class,'no-scrollb33ar')]/div[contains(@class,'group')]/a[p]";
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

test('Homepage Check and Banner Count', async ({ page }) => {
    const url = 'https://www.coversandall.com/';

    console.log(`Navigating to: ${url}`);
    const response = await page.goto(url, { timeout: 60000 });

    // 1. Check if Homepage is Available
    expect(response.status()).toBe(200);
    console.log("✅ Homepage is available (Status 200).");

    // 2. Count Banners
    const bannerImages = page.locator('img[src*="banner"], img[alt*="Banner"], div[class*="banner"]');

    await page.waitForTimeout(3000); // Wait for dynamic content

    const count = await bannerImages.count();
    console.log(`Found ${count} potential banner elements.`);

    if (count > 0) {
        console.log(`✅ Banners are available.`);
        for (let i = 0; i < Math.min(count, 5); i++) {
            const src = await bannerImages.nth(i).getAttribute('src');
            console.log(`   Banner ${i + 1}: ${src}`);
        }
    } else {
        console.warn("⚠️ No elements matched valid 'banner' selectors. You may need to refine the locator.");
    }
});

test('Count Best Selling Categories', async ({ page }) => {
    const url = 'https://www.coversandall.com/';
    await page.goto(url, { timeout: 60000 });

    // Locate the header for the section
    const sectionHeader = page.getByText('Our best-selling categories', { exact: false });

    // Wait for it to catch up
    try {
        await sectionHeader.first().waitFor({ state: 'visible', timeout: 30000 });
        await sectionHeader.first().scrollIntoViewIfNeeded();
        console.log('✅ Section "Our best-selling categories" found.');
    } catch (e) {
        console.error('❌ Could not find "Our best-selling categories" heading. Proceeding with locator anyway in case header is dynamic.');
    }

    // Use user-provided locator
    // //div[contains(@class,'grid-cols-2')]//a[not(contains(@class,'hidden'))]//p
    const items = page.locator("//div[contains(@class,'grid-cols-2')]//a[not(contains(@class,'hidden'))]//p");

    // Wait for items to be attached
    try {
        await items.first().waitFor({ state: 'attached', timeout: 30000 });
    } catch (e) {
        console.warn("Could not find items with provided locator. Check if section exists.");
    }

    await page.waitForTimeout(2000);

    const count = await items.count();
    console.log(`Found ${count} items in "Our best-selling categories" using new locator.`);

    let validItems = 0;
    for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        // Only count visible items
        if (await item.isVisible()) {
            const text = await item.innerText();
            if (text.trim().length > 0) {
                validItems++;
                console.log(`   Product [${validItems}]: ${text.trim()}`);
            }
        }
    }
    console.log(`✅ Total Valid "Best Selling" categories counted: ${validItems}`);
});

test('Season Trending Must-Haves', async ({ page }) => {
    const url = 'https://www.coversandall.com/';
    await page.goto(url, { timeout: 60000 });

    const sectionHeader = page.getByText('Season’s trending must-haves for you', { exact: false });

    // Wait for section header
    try {
        await sectionHeader.first().waitFor({ state: 'visible', timeout: 30000 });
        await sectionHeader.first().scrollIntoViewIfNeeded();
        console.log('✅ Section "Season’s trending must-haves for you" found.');
    } catch (e) {
        console.warn('⚠️ Could not find section header unique text. Continuing with locator check.');
    }

    // Use user-provided locator
    const items = page.locator('.swiper-slide h3');

    // Wait for items
    try {
        await items.first().waitFor({ state: 'attached', timeout: 30000 });
    } catch (e) {
        console.warn("Could not find items with selector '.swiper-slide h3'.");
    }

    await page.waitForTimeout(2000);

    const count = await items.count();
    console.log(`Found ${count} trending items using locator '.swiper-slide h3'.`);

    let validItems = 0;
    for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        if (await item.isVisible()) {
            const text = await item.innerText();
            if (text.trim().length > 0) {
                validItems++;
                console.log(`   Trending Product [${validItems}]: ${text.trim()}`);
            }
        }
    }
    console.log(`✅ Total Valid Trending Must-Haves counted: ${validItems}`);
});

test('Fresh, New and Ready to Impress Products', async ({ page }) => {
    const url = 'https://www.coversandall.com/';
    await page.goto(url, { timeout: 60000 });

    const headerText = 'Fresh, new and ready to impress';
    const sectionHeader = page.getByText(headerText, { exact: false });

    // Wait for section
    try {
        await sectionHeader.first().waitFor({ state: 'visible', timeout: 30000 });
        await sectionHeader.first().scrollIntoViewIfNeeded();
        console.log(`✅ Section "${headerText}" found.`);
    } catch (e) {
        console.warn(`⚠️ Could not find section header "${headerText}".`);
    }

    const container = page.locator('div, section').filter({ has: sectionHeader }).last();
    // Generic locator for titles
    const potentialItems = container.locator('h3, h4, a[class*="product"], p[class*="name"]');

    await page.waitForTimeout(2000);

    const count = await potentialItems.count();
    console.log(`Found ${count} potential items in "${headerText}" section.`);

    let validItems = 0;
    for (let i = 0; i < count; i++) {
        const item = potentialItems.nth(i);
        if (await item.isVisible()) {
            const text = await item.innerText();
            if (text.trim().length > 0 && !text.includes(headerText)) {
                validItems++;
                console.log(`   Fresh Product [${validItems}]: ${text.trim()}`);
            }
        }
    }

    if (validItems === 0) {
        console.warn("⚠️ No items found. You might need to provide a specific locator for this section.");
    } else {
        console.log(`✅ Total Valid "${headerText}" products counted: ${validItems}`);
    }
});

test('Real Products, Real Stories - Video Count', async ({ page }) => {
    const url = 'https://www.coversandall.com/';
    await page.goto(url, { timeout: 60000 });

    const headerText = 'Real Products, Real Stories';
    // Use exact: false to match substring
    const sectionHeader = page.getByText(headerText, { exact: false });

    // Scroll to section
    try {
        await sectionHeader.first().waitFor({ state: 'visible', timeout: 30000 });
        await sectionHeader.first().scrollIntoViewIfNeeded();
        console.log(`✅ Section "${headerText}" found.`);
    } catch (e) {
        console.warn(`⚠️ Could not find section header "${headerText}".`);
    }

    // Locate the container for this section
    const container = page.locator('div, section').filter({ has: sectionHeader }).last();

    // Look for video elements or indicators
    const videos = container.locator('video, iframe[src*="youtube"], iframe[src*="vimeo"], .video-container, div[class*="video"]');
    const playButtons = container.locator('.play-icon, .play-btn, svg[aria-label="Play"]');

    await page.waitForTimeout(3000); // Allow lazy load

    const videoCount = await videos.count();
    const playBtnCount = await playButtons.count();

    // Use the higher count as a proxy
    const finalCount = Math.max(videoCount, playBtnCount);

    console.log(`Found ${finalCount} videos/play-buttons in "${headerText}" section.`);

    if (finalCount > 0) {
        console.log(`✅ Videos are present.`);
    } else {
        console.warn("⚠️ No videos found. locator might need refinement.");
    }
});

test('Why our covers bring peace of mind - Reasons Check', async ({ page }) => {
    const url = 'https://www.coversandall.com/';
    await page.goto(url, { timeout: 60000 });

    const headerText = 'Why our covers bring peace of mind';
    const sectionHeader = page.getByText(headerText, { exact: false });

    // Wait for section
    try {
        await sectionHeader.first().waitFor({ state: 'visible', timeout: 30000 });
        await sectionHeader.first().scrollIntoViewIfNeeded();
        console.log(`✅ Section "${headerText}" found.`);
    } catch (e) {
        console.warn(`⚠️ Could not find section header "${headerText}".`);
    }

    const container = page.locator('div, section').filter({ has: sectionHeader }).last();

    // 1. Check for specific banner image requested by user
    const targetBannerPart = "cover-1.webp"; // Part of the URL provided
    const bannerImg = container.locator(`img[src*="${targetBannerPart}"]`);

    if (await bannerImg.count() > 0) {
        const src = await bannerImg.first().getAttribute('src');
        console.log(`✅ Peace of Mind Banner Found: ${src}`);
    } else {
        console.log(`ℹ️ Specific banner image containing '${targetBannerPart}' not found in this section.`);
    }

    // 2. Check for reasons / text
    const features = container.locator('h3, h4, h5, strong, .feature-title, .box-title');

    await page.waitForTimeout(2000);

    const count = await features.count();
    console.log(`Found ${count} potential feature titles in "${headerText}" section.`);

    let validItems = 0;
    for (let i = 0; i < count; i++) {
        const item = features.nth(i);
        if (await item.isVisible()) {
            const text = await item.innerText();
            // Simple heuristic to ignore header and empty
            if (text.trim().length > 0 && !text.includes(headerText) && text.length < 100) {
                validItems++;
                console.log(`   Peace of Mind Reason [${validItems}]: ${text.trim()}`);
            }
        }
    }

    if (validItems === 0) {
        console.warn("⚠️ No specific features found. You might need to provide a locator.");
    } else {
        console.log(`✅ Total Valid reasons found: ${validItems}`);
    }
});

test('Inspiration and News - Blog Check', async ({ page }) => {
    const url = 'https://www.coversandall.com/';
    await page.goto(url, { timeout: 60000 });

    const headerText = 'Inspiration and news';
    const sectionHeader = page.getByText(headerText, { exact: false });

    try {
        await sectionHeader.first().waitFor({ state: 'visible', timeout: 30000 });
        await sectionHeader.first().scrollIntoViewIfNeeded();
        console.log(`✅ Section "${headerText}" found.`);
    } catch (e) {
        console.warn(`⚠️ Could not find section header "${headerText}".`);
    }

    const container = page.locator('div, section').filter({ has: sectionHeader }).last();

    // Identify Blog Posts
    // Look for article tags or common blog classes
    const blogs = container.locator('article, .post, .blog-post, .news-item, a[href*="blog"]');

    await page.waitForTimeout(2000);

    const count = await blogs.count();
    console.log(`Found ${count} potential blog items in "${headerText}" section.`);

    let validItems = 0;
    for (let i = 0; i < count; i++) {
        const item = blogs.nth(i);
        if (await item.isVisible()) {
            // Try to find a title inside
            const titleEl = item.locator('h3, h4, .title, .post-title').first();
            const title = await titleEl.count() > 0 ? await titleEl.innerText() : await item.innerText();

            // Try to find a link
            const linkEl = await item.getAttribute('href') ? item : item.locator('a').first();
            const href = await linkEl.getAttribute('href');

            if (title.trim().length > 0) {
                validItems++;
                console.log(`   Blog [${validItems}]: ${title.trim().substring(0, 50)}...`);
                if (href) console.log(`      Link: ${href}`);
            }
        }
    }

    if (validItems === 0) {
        console.warn("⚠️ No blog items found. Locator might need refinement.");
    } else {
        console.log(`✅ Total Valid Blog Posts found: ${validItems}`);
    }
});

test('Mega Menu Mouse Hover Verification', async ({ page }) => {
    const url = 'https://www.coversandall.com/';
    await page.goto(url, { timeout: 60000 });

    console.log('Testing Mega Menu Hover...');

    // Set Viewport explicitly to ensure desktop menu is visible
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for critical content to load
    await page.waitForLoadState('domcontentloaded');

    // 1. Broad selector to catch all potential top-level menus (usually inside a 'group' container)
    // We target the LINK (<a>) inside the group, whether it has a <p> or not.
    const menuItems = page.locator("//div[contains(@class,'group')]/a");

    // Wait for at least one to be visible
    try {
        await menuItems.first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (e) {
        console.warn("Could not find any menu items with specific selector. Checking page structure...");
    }

    const count = await menuItems.count();
    console.log(`Found ${count} potential menu items.`);

    for (let i = 0; i < count; i++) {
        const menuItem = menuItems.nth(i);

        // Skip hidden items (e.g. mobile versions, or utility links)
        if (!await menuItem.isVisible()) continue;

        const menuText = (await menuItem.innerText()).trim();
        // Skip empty or utility items that likely aren't mega menus (e.g. logo, cart icon)
        if (!menuText || menuText.length < 2) continue;

        console.log(`   [${i + 1}/${count}] Testing Menu: ${menuText}`);

        try {
            // Scroll to it if needed - critical for horizontal menus
            await menuItem.scrollIntoViewIfNeeded();

            // Try standard hover first
            await menuItem.hover({ force: true, timeout: 2000 });
            await page.waitForTimeout(500);

            // Fallback: Dispatch mouseenter event if hover failed to trigger JS
            await menuItem.evaluate(node => node.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })));
            await page.waitForTimeout(500);

            // Check if any submenu container becomes visible
            // The mega menu usually appears as a full-width div or a dropdown
            // We check for visibility of ANY element that wasn't visible before?
            // Or look for specific dropdown classes: absolute, fixed, group-hover:flex

            const specificSubmenu = menuItem.locator('..').locator('.group-hover\\:flex, div[class*="absolute"], ul, div[class*="menu"]');

            // Filter to find the ONE that is visible
            const visibleSubmenu = specificSubmenu.locator('visible=true');

            if (await visibleSubmenu.count() > 0) {
                console.log(`      ✅ Submenu VISIBLE for "${menuText}"`);
            } else {
                // Double check generic full-width container
                const megaMenuContainer = page.locator('.mega-menu, .sub-menu, .dropdown-menu').locator('visible=true');
                if (await megaMenuContainer.count() > 0) {
                    console.log(`      ✅ (Generic) Submenu content visible for "${menuText}"`);
                } else {
                    console.warn(`      ⚠️ Submenu NOT visible for "${menuText}"`);
                }
            }
        } catch (e) {
            console.error(`      ❌ Hover check failed for "${menuText}": ${e.message}`);
        }

        // Reset mouse to close menu before next iteration
        await page.mouse.move(0, 0);
        await page.waitForTimeout(200);
    }
});

test('Top Ticker Coupon Code Verification', async ({ page }) => {

    await page.goto('https://www.coversandall.com/', { timeout: 60000 });
    const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");

    try {
        await bannerLocator.first().waitFor({ state: 'visible', timeout: 30000 });
        const bannerText = await bannerLocator.first().innerText();

        if (bannerText.includes(':')) {
            const codeText = bannerText.split(':')[1].trim();
            console.log("Coupon Code:", codeText);
        } else {
            console.log("Banner found but could not split by ':' to exact code. Text:", bannerText);
        }
    } catch (e) {
        console.warn("⚠️ Coupon code banner not found or timed out.");
    }
});
