const { test } = require('@playwright/test');
const fs = require('fs');

test('Sitemap products price & quantity validation (Live CSV + Console)', async ({ page }) => {
  test.setTimeout(0);

  const BASE_DOMAIN = 'https://www.coversandall.com/sitemap';
  const SITEMAP_URL = `${BASE_DOMAIN}/sitemap`;
  const CSV_FILE = 'sitemap_product_price_live.csv';

  // Create CSV stream
  const csvStream = fs.createWriteStream(CSV_FILE, { flags: 'w' });
  csvStream.write(
    'Product Name,Product URL,Initial Price,Price After Increase,Price After Decrease,Price Reset Match,Zero Price,Status\n'
  );

  await page.goto(SITEMAP_URL, { timeout: 90000 });

  const PRODUCTS_XPATH =
    "//p[normalize-space()='Products']/following-sibling::ul[1]//li//a";

  const products = page.locator(PRODUCTS_XPATH);
  const count = await products.count();

  console.log(`\n🚀 Total Products Found: ${count}\n`);

  let failures = 0;

  for (let i = 0; i < count; i++) {
    const product = products.nth(i);
    let productUrl = await product.getAttribute('href');

    if (!productUrl.startsWith('http')) {
      productUrl = `${BASE_DOMAIN}/${productUrl.replace(/^\/+/, '')}`;
    }

    console.log(`\n➤ Product ${i + 1}`);
    console.log(`URL         : ${productUrl}`);

    const newPage = await page.context().newPage();
    await newPage.goto(productUrl, { timeout: 90000 });
    await newPage.waitForLoadState('domcontentloaded');
    await newPage.waitForTimeout(2000);

    /* ---------- PRODUCT NAME ---------- */
    let productName = 'NOT FOUND';
    const nameLocator = newPage.locator(
      "//h1[contains(@class,'font-medium') and contains(@class,'leading-9')]"
    );
    if (await nameLocator.count() > 0) {
      productName = (await nameLocator.first().innerText()).trim();
    }

    console.log(`Name        : ${productName}`);

    /* ---------- PRICE FUNCTION ---------- */
    const getPrice = async () => {
      const priceLocator = newPage.locator(
        "//span[contains(@class,'font-semibold') and contains(@class,'text-primary-900')]"
      );
      if (await priceLocator.count() === 0) return 0;
      const priceText = (await priceLocator.first().innerText()).trim();
      return parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    };

    /* ---------- PRICES ---------- */
    const initialPrice = await getPrice();
    console.log(`Initial     : ${initialPrice}`);

    let increasedPrice = initialPrice;
    let finalPrice = initialPrice;

    const increaseBtn = newPage.locator("//button[p[normalize-space()='+']]");
    if (await increaseBtn.count() > 0) {
      await increaseBtn.first().click();
      await newPage.waitForTimeout(1500);
      increasedPrice = await getPrice();
    }
    console.log(`After +     : ${increasedPrice}`);

    const decreaseBtn = newPage.locator("//button[p[normalize-space()='-']]");
    if (await decreaseBtn.count() > 0) {
      await decreaseBtn.first().click();
      await newPage.waitForTimeout(1500);
      finalPrice = await getPrice();
    }
    console.log(`After -     : ${finalPrice}`);

    /* ---------- VALIDATION ---------- */
    const zeroPrice = initialPrice === 0 ? 'YES' : 'NO';
    const priceResetMatch = initialPrice === finalPrice ? 'YES' : 'NO';

    let status = 'PASS';
    if (zeroPrice === 'YES' || priceResetMatch === 'NO') {
      status = 'FAIL';
      failures++;
    }

    console.log(`Result      : ${status}`);
    console.log('--------------------------------------------------');

    /* ---------- WRITE CSV LIVE ---------- */
    csvStream.write(
      `"${productName.replace(/"/g, '""')}",` +
      `"${productUrl}",` +
      `${initialPrice},` +
      `${increasedPrice},` +
      `${finalPrice},` +
      `${priceResetMatch},` +
      `${zeroPrice},` +
      `${status}\n`
    );

    await newPage.close();
  }

  csvStream.end();

  console.log(`\n📄 CSV updated live: ${CSV_FILE}`);

  if (failures > 0) {
    throw new Error(`❌ Test Failed: ${failures} product(s) failed validation`);
  }

  console.log('\n✅ All products passed price & quantity validation');
});
