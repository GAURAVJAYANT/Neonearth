const { test, expect } = require('@playwright/test');

test('Sitemap products', async ({ page }) => {
  test.setTimeout(0); // Allow long execution due to iteration

  const BASE_URL = 'https://test.coversandall.eu/sitemap';
  await page.goto(BASE_URL, { timeout: 90000 });

  const PRODUCTS_XPATH =
    "//p[normalize-space()='Products']/following-sibling::ul[1]//li//a";

  const products = page.locator(PRODUCTS_XPATH);
  const count = await products.count();

  console.log(`Total Products Found: ${count}`);

  // 🔁 Loop through all products
  for (let i = 0; i < count; i++) {
    const product = products.nth(i);
    const productName = (await product.innerText()).trim();
    const productUrl = await product.getAttribute('href');

    console.log(`\n➤ Opening Product [${i + 1}]: ${productName}`);
    console.log(`   URL: ${productUrl}`);

    // Open in new tab
    const newPage = await page.context().newPage();
    await newPage.goto(productUrl, { timeout: 60000 });
    await newPage.waitForLoadState('domcontentloaded');

    // 👁️ Visible delay (2–3 seconds)
    await newPage.waitForTimeout(2500);

    // Close tab
    await newPage.close();
  }
});
