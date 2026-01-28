const { test } = require('@playwright/test');

test('Sitemap products price & quantity validation', async ({ page }) => {
  test.setTimeout(0);

  const BASE_DOMAIN = 'https://www.coversandall.com';
  const SITEMAP_URL = `${BASE_DOMAIN}/sitemap`;

  await page.goto(SITEMAP_URL, { timeout: 90000 });

  const PRODUCTS_XPATH =
    "//p[normalize-space()='Products']/following-sibling::ul[1]//li//a";

  const products = page.locator(PRODUCTS_XPATH);
  const count = await products.count();

  console.log(`Total Products Found: ${count}`);

  let failures = [];

  for (let i = 0; i < count; i++) {
    const product = products.nth(i);
    let productUrl = await product.getAttribute('href');

    if (!productUrl.startsWith('http')) {
      productUrl = `${BASE_DOMAIN}/${productUrl.replace(/^\/+/, '')}`;
    }

    console.log(`\n➤ Opening Product [${i + 1}]`);
    console.log(`   URL: ${productUrl}`);

    const newPage = await page.context().newPage();
    await newPage.goto(productUrl, { timeout: 90000 });
    await newPage.waitForLoadState('domcontentloaded');
    await newPage.waitForTimeout(2500);

    /* ---------- PRODUCT NAME ---------- */
    let productName = 'NOT FOUND';
    const nameLocator = newPage.locator(
      "//h1[contains(@class,'font-medium') and contains(@class,'leading-9')]"
    );

    if (await nameLocator.count() > 0) {
      productName = (await nameLocator.first().innerText()).trim();
    }

    console.log(` Product Name: ${productName}`);

    /* ---------- PRICE FUNCTION ---------- */
    const getPrice = async () => {
      const priceLocator = newPage.locator(
        "//span[contains(@class,'font-semibold') and contains(@class,'text-primary-900')]"
      );
      if (await priceLocator.count() === 0) return 0;

      const priceText = (await priceLocator.first().innerText()).trim();
      return parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    };

    /* ---------- INITIAL PRICE ---------- */
    const initialPrice = await getPrice();
    console.log(` Initial Price: ${initialPrice}`);

    if (initialPrice === 0) {
      failures.push(`ZERO PRICE | ${productName} | ${productUrl}`);
      await newPage.close();
      continue;
    }

    /* ---------- INCREASE QUANTITY ---------- */
    const increaseBtn = newPage.locator("//button[p[normalize-space()='+']]");
    if (await increaseBtn.count() > 0) {
      await increaseBtn.first().click();
      await newPage.waitForTimeout(1500);
    }

    const increasedPrice = await getPrice();
    console.log(` After Increase Price: ${increasedPrice}`);

    /* ---------- DECREASE QUANTITY ---------- */
    const decreaseBtn = newPage.locator("//button1[p[normalize-space()='-']]");
    if (await decreaseBtn.count() > 0) {
      await decreaseBtn.first().click();
      await newPage.waitForTimeout(1500);
    }

    const finalPrice = await getPrice();
    console.log(` After Decrease Price: ${finalPrice}`);

    /* ---------- ASSERT PRICE RESET ---------- */
    if (initialPrice !== finalPrice) {
      console.error(` PRICE MISMATCH AFTER DECREASE`);
      failures.push(
        `PRICE RESET FAIL | ${productName} | Initial: ${initialPrice} | Final: ${finalPrice} | ${productUrl}`
      );
    }

    await newPage.close();
  }

  /* ---------- FINAL RESULT ---------- */
  if (failures.length > 0) {
    console.error('\n FAILURES FOUND:\n');
    failures.forEach((f, i) => console.error(`${i + 1}. ${f}`));
    throw new Error(`Test Failed with ${failures.length} issue(s)`);
  }

  console.log('\n All products passed price & quantity validation');
});
