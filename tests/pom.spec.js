const { test, expect } = require('@playwright/test');
const { SitemapPage } = require('../pages/SitemapPage');
const { ProductPage } = require('../pages/ProductPage');

test('Sitemap products price & quantity validation (POM)', async ({ page }) => {
    test.setTimeout(0); // Disable timeout for long execution

    const BASE_DOMAIN = 'https://www.coversandall.com';
    const SITEMAP_URL = `${BASE_DOMAIN}/sitemap`;

    const sitemapPage = new SitemapPage(page);
    console.log(`Navigating to ${SITEMAP_URL}`);
    await sitemapPage.navigate(SITEMAP_URL);

    const productLinks = await sitemapPage.getAllProductLinks();
    console.log(`Total Products Found: ${productLinks.length}`);

    let failures = [];

    // Limit to first 3 products for verification
    const limit = Math.min(productLinks.length, 3);
    for (let i = 0; i < limit; i++) {
        let productUrl = productLinks[i];

        // Fix relative URLs
        if (!productUrl.startsWith('http')) {
            productUrl = `${BASE_DOMAIN}/${productUrl.replace(/^\/+/, '')}`;
        }

        console.log(`\n➤ Opening Product [${i + 1}]`);
        console.log(`   URL: ${productUrl}`);

        // Create new page/tab for product to keep sitemap open (optional, but mimics original flow)
        // Actually original flow used newPage. Let's do that.
        const newPage = await page.context().newPage();
        const productPage = new ProductPage(newPage);

        await productPage.navigate(productUrl);
        await newPage.waitForLoadState('domcontentloaded');
        await productPage.wait(2500);

        const productName = await productPage.getProductName();
        console.log(` Product Name: ${productName}`);

        const initialPrice = await productPage.getProductPrice();
        console.log(` Initial Price: ${initialPrice}`);

        if (initialPrice === 0) {
            failures.push(`ZERO PRICE | ${productName} | ${productUrl}`);
            await newPage.close();
            continue;
        }

        // Increase
        await productPage.increaseQuantity();
        const increasedPrice = await productPage.getProductPrice();
        console.log(` After Increase Price: ${increasedPrice}`);

        // Decrease
        await productPage.decreaseQuantity();
        const finalPrice = await productPage.getProductPrice();
        console.log(` After Decrease Price: ${finalPrice}`);

        if (initialPrice !== finalPrice) {
            console.error(` PRICE MISMATCH AFTER DECREASE`);
            failures.push(
                `PRICE RESET FAIL | ${productName} | Initial: ${initialPrice} | Final: ${finalPrice} | ${productUrl}`
            );
        }

        await newPage.close();
    }

    if (failures.length > 0) {
        throw new Error(`Test Failed with ${failures.length} issue(s):\n${failures.join('\n')}`);
    }
});
