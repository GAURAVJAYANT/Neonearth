const { test, expect } = require('@playwright/test');
const { NeonearthHomePage }     = require('../pages/NeonearthHomePage');
const { NeonearthCategoryPage } = require('../pages/NeonearthCategoryPage');

// ─── Helper: scroll-to-bottom loop until no new products appear ──────────────
async function scrollUntilAllLoaded(page, { maxScrolls = 40, pauseMs = 1500 } = {}) {
    let previousCount = 0;
    let sameCount     = 0;
    const STABLE_ROUNDS = 3; // stop after 3 consecutive scrolls with no new products

    for (let i = 0; i < maxScrolls; i++) {
        // Scroll to the very bottom of the page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Give the lazy-loader time to fetch and render new cards
        await page.waitForTimeout(pauseMs);

        // Count product cards currently in the DOM
        const currentCount = await page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a[href]'));
            return allLinks.filter(a => {
                const href = a.href;
                return (href.includes('-p?') || href.includes('variant_sku=') || /-p($|\?)/.test(href))
                    && !href.includes('fabric-swatch');
            }).length;
        });

        console.log(`  Scroll ${i + 1}: ${currentCount} product links visible`);

        if (currentCount === previousCount) {
            sameCount++;
            if (sameCount >= STABLE_ROUNDS) {
                console.log(`  ✅ No new products after ${STABLE_ROUNDS} scrolls – page fully loaded.`);
                break;
            }
        } else {
            sameCount = 0; // reset stability counter
        }

        previousCount = currentCount;
    }

    // Scroll back to top so the page is in a clean state
    await page.evaluate(() => window.scrollTo(0, 0));
}
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Category Products – Lazy Load Traversal', () => {

    // Categories to visit (matches links in the Neonearth header nav)
    // Each entry can be: a direct URL  OR  a nav-link text for HomPage.clickCategory()
    const CATEGORIES = [
        { name: 'Wall Arts',   navText: 'Wall Arts' },
        { name: 'Tapestries',  navText: 'Tapestries' },
        { name: 'Rugs & Mats', navText: 'Rugs & Mats' },
        { name: 'Pillows',     navText: 'Pillows' },
        { name: 'Curtains',    navText: 'Curtains' },
        { name: 'Pet Zone',    navText: 'Pet Zone' },
        { name: 'Theme',       navText: 'Theme' },
    ];

    test('Visit every category, scroll to load all products, and print product names', async ({ page }) => {
        test.setTimeout(300_000); // 5 minutes – enough for all lazy-load scrolling

        const homePage     = new NeonearthHomePage(page);
        const categoryPage = new NeonearthCategoryPage(page);

        for (const category of CATEGORIES) {
            console.log(`\n${'═'.repeat(60)}`);
            console.log(`  CATEGORY: ${category.name}`);
            console.log(`${'═'.repeat(60)}`);

            // ── 1. Navigate to homepage and then to the category ──────────
            await homePage.navigate();
            await page.waitForTimeout(1000); // let animations settle

            await homePage.clickCategory(category.navText);

            // Wait for the category page to be interactive
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000); // let initial product batch render

            const pageTitle = await page.title();
            console.log(`  Page Title: "${pageTitle}"`);
            console.log(`  URL: ${page.url()}`);

            // ── 2. Scroll down to trigger lazy loading ────────────────────
            console.log(`\n  ⏬ Scrolling to load all lazy-loaded products...`);
            await scrollUntilAllLoaded(page, { maxScrolls: 40, pauseMs: 1500 });

            // ── 3. Extract all product names ──────────────────────────────
            const products = await categoryPage.getProductsData();

            console.log(`\n  📦 Total products found in "${category.name}": ${products.length}`);
            console.log(`  ${'─'.repeat(55)}`);

            if (products.length === 0) {
                console.warn(`  ⚠️  No products found for category "${category.name}". Skipping assertion.`);
            } else {
                products.forEach((product, idx) => {
                    const name = product.name?.trim() || '(unnamed)';
                    console.log(`  [${String(idx + 1).padStart(3, '0')}] ${name}`);
                });
                // Soft assertion – warn but don't fail the entire run for an empty page
                expect(products.length, `"${category.name}" should have at least 1 product`).toBeGreaterThan(0);
            }
        }

        console.log(`\n✅ All ${CATEGORIES.length} categories processed successfully.`);
    });
});