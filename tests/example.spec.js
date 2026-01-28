const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('Sitemap products – price validation + add to cart (FINAL FIXED)', async ({ browser }) => {
  test.setTimeout(0);

  const BASE_DOMAIN = 'https://www.coversandall.com';
  const SITEMAP_URL = `${BASE_DOMAIN}/sitemap`;

  const csvPath = path.join(__dirname, 'product_validation_result.csv');

  /* ---------- REAL-TIME LOGGER (ANTIGRAVITY SAFE) ---------- */
  const log = (msg) => {
    process.stdout.write(`[${new Date().toLocaleTimeString()}] ${msg}\n`);
  };

  /* ---------- CSV HEADER ---------- */
  fs.writeFileSync(
    csvPath,
    'Index,Product Name,URL,Initial Price,Increased Price,Final Price,Status,Remark\n'
  );

  /* ---------- OPEN SITEMAP ---------- */
  const mainContext = await browser.newContext();
  const mainPage = await mainContext.newPage();

  log('Opening sitemap...');
  await mainPage.goto(SITEMAP_URL, { timeout: 90000 });

  const PRODUCTS_XPATH =
    "//p[normalize-space()='Products']/following-sibling::ul[1]//li//a";

  const products = mainPage.locator(PRODUCTS_XPATH);
  const count = await products.count();

  log(`Total Products Found: ${count}`);

  let productUrls = [];
  let failures = [];

  /* ---------- COLLECT PRODUCT URLS ---------- */
  for (let i = 0; i < count; i++) {
    let url = await products.nth(i).getAttribute('href');
    if (!url.startsWith('http')) {
      url = `${BASE_DOMAIN}/${url.replace(/^\/+/, '')}`;
    }
    productUrls.push(url);
  }

  await mainContext.close();

  /* ---------- PROCESS PRODUCTS ONE BY ONE ---------- */
  let index = 1;

  for (const productUrl of productUrls) {
    const context = await browser.newContext(); // fresh cart every time
    const page = await context.newPage();

    let productName = 'NOT FOUND';
    let initialPrice = 0;
    let increasedPrice = 0;
    let finalPrice = 0;
    let status = 'PASS';
    let remark = '';

    try {
      log(`\n[${index}] Opening product: ${productUrl}`);
      await page.goto(productUrl, { timeout: 90000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      /* ---------- PRODUCT NAME ---------- */
      const nameLocator = page.locator(
        "//h1[contains(@class,'font-medium') and contains(@class,'leading-9')]"
      );

      if (await nameLocator.count() > 0) {
        productName = (await nameLocator.first().innerText()).trim();
      }

      log(`Product Name: ${productName}`);

      /* ---------- PRICE FUNCTION ---------- */
      const getPrice = async () => {
        const priceLocator = page.locator(
          "//span[contains(@class,'font-semibold') and contains(@class,'text-primary-900')]"
        );
        if (await priceLocator.count() === 0) return 0;
        const txt = (await priceLocator.first().innerText()).trim();
        return parseFloat(txt.replace(/[^0-9.]/g, '')) || 0;
      };

      /* ---------- INITIAL PRICE ---------- */
      initialPrice = await getPrice();
      log(`Initial Price: ${initialPrice}`);

      if (initialPrice === 0) {
        status = 'FAIL';
        remark = 'Initial price is zero';
        failures.push(`ZERO PRICE | ${productUrl}`);
        continue;
      }

      /* ---------- INCREASE PRICE (PDP) ---------- */
      const increaseBtn = page.locator("//button[p[normalize-space()='+']]");
      if (await increaseBtn.count() > 0) {
        await increaseBtn.first().click();
        await page.waitForTimeout(1500);
      }

      increasedPrice = await getPrice();
      log(`Increased Price: ${increasedPrice}`);

      /* ---------- DECREASE PRICE (PDP) ---------- */
      const decreaseBtn = page.locator("//button[p[normalize-space()='-']]");
      if (await decreaseBtn.count() > 0) {
        await decreaseBtn.first().click();
        await page.waitForTimeout(1500);
      }

      finalPrice = await getPrice();
      log(`Final Price: ${finalPrice}`);

      if (initialPrice !== finalPrice) {
        status = 'FAIL';
        remark = 'Price did not reset after decrease';
        failures.push(`PRICE RESET FAIL | ${productName}`);
        log(`❌ FAIL: ${remark}`);
      } else {
        log('✅ Price reset validated');
      }

      /* ---------- ADD TO CART (AFTER PRICE VALIDATION) ---------- */
      log('Clicking Add to Cart...');
      const addToCartBtn = page.locator(
        "//button[normalize-space()='Add to Cart' and @type='button']"
      );

      if (await addToCartBtn.count() === 0) {
        status = 'FAIL';
        remark = 'Add to Cart button not found';
        failures.push(`ADD TO CART MISSING | ${productUrl}`);
        continue;
      }

      await addToCartBtn.first().click();
      await page.waitForTimeout(5000);

      /* ---------- MINI CART CART BUTTON CHECK ---------- */
      const cartBtn = page.locator('a[href="/checkout/cart"]');

      if (await cartBtn.count() === 0) {
        status = 'FAIL';
        remark = `Add to Cart button is not working for ${productName}`;
        failures.push(`MINI CART BUTTON FAIL | ${productName}`);
        log(`❌ FAIL: ${remark}`);
        continue;
      }

      log('✅ Mini cart opened and Cart button available');

    } catch (e) {
      status = 'ERROR';
      remark = e.message;
      failures.push(`ERROR | ${productUrl}`);
      log(`🔥 ERROR: ${remark}`);
    } finally {
      const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;

      fs.appendFileSync(
        csvPath,
        `${index},${escape(productName)},${escape(productUrl)},${initialPrice},${increasedPrice},${finalPrice},${status},${escape(remark)}\n`
      );

      log(`Result saved for product ${index}`);
      index++;

      await context.close(); // clears cart
    }
  }

  /* ---------- FINAL ASSERT ---------- */
  if (failures.length > 0) {
    log('❌ TEST FAILED – Check CSV for details');
    throw new Error('Test Failed. Check CSV for details.');
  }

  log('🎉 TEST COMPLETED SUCCESSFULLY');
});
