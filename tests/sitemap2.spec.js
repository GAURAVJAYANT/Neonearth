const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('Sitemap products – price validation + add to cart (10 PARALLEL ORDERED CSV)', async ({ browser }) => {
  test.setTimeout(0);

  const BASE_DOMAIN = 'https://www.coversandall.com';
  const SITEMAP_URL = `${BASE_DOMAIN}/sitemap`;
  const PARALLEL_LIMIT = 10;

  const csvPath = path.join(__dirname, 'product_validation_result.csv');

  /* ---------- LOGGER ---------- */
  const log = (msg) => {
    process.stdout.write(`[${new Date().toLocaleTimeString()}] ${msg}\n`);
  };

  /* ---------- CSV HEADER ---------- */
  fs.writeFileSync(
    csvPath,
    'Index,Product Name,URL,Initial Price,Increased Price,Final Price,Add To Cart Status,Status,Remark\n'
  );

  /* ---------- GET PRODUCT URLS ---------- */
  const mainContext = await browser.newContext();
  const mainPage = await mainContext.newPage();

  await mainPage.goto(SITEMAP_URL, { timeout: 90000 });

  const PRODUCTS_XPATH =
    "//p[normalize-space()='Products']/following-sibling::ul[1]//li//a";

  const products = mainPage.locator(PRODUCTS_XPATH);
  const count = await products.count();

  let productUrls = [];
  for (let i = 0; i < count; i++) {
    let url = await products.nth(i).getAttribute('href');
    if (!url.startsWith('http')) {
      url = `${BASE_DOMAIN}/${url.replace(/^\/+/, '')}`;
    }
    productUrls.push(url);
  }

  await mainContext.close();
  log(`Total Products Found: ${productUrls.length}`);

  /* ---------- RESULT STORE (ORDER SAFE) ---------- */
  const results = [];

  /* ---------- WORKER FUNCTION ---------- */
  const processProduct = async (productUrl, index) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    let result = {
      index,
      productName: 'NOT FOUND',
      url: productUrl,
      initialPrice: 0,
      increasedPrice: 0,
      finalPrice: 0,
      addToCartStatus: 'FAIL',
      status: 'PASS',
      remark: ''
    };

    try {
      log(`[${index}] Opening ${productUrl}`);
      await page.goto(productUrl, { timeout: 90000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      /* PRODUCT NAME */
      const nameLocator = page.locator(
        "//h1[contains(@class,'font-medium') and contains(@class,'leading-9')]"
      );
      if (await nameLocator.count() > 0) {
        result.productName = (await nameLocator.first().innerText()).trim();
      }

      /* PRICE */
      const getPrice = async () => {
        const priceLocator = page.locator(
          "//span[contains(@class,'font-semibold') and contains(@class,'text-primary-900')]"
        );
        if (await priceLocator.count() === 0) return 0;
        const txt = (await priceLocator.first().innerText()).trim();
        return parseFloat(txt.replace(/[^0-9.]/g, '')) || 0;
      };

      const waitForPriceChange = async (oldPrice, timeout = 6000) => {
        await page.waitForFunction(
          (prev) => {
            const el = document.querySelector(
              'span.font-semibold.text-primary-900'
            );
            if (!el) return false;
            const current =
              parseFloat(el.innerText.replace(/[^0-9.]/g, '')) || 0;
            return current !== prev;
          },
          oldPrice,
          { timeout }
        );
      };

      /* INITIAL PRICE */
      result.initialPrice = await getPrice();
      if (result.initialPrice === 0) {
        result.status = 'FAIL';
        result.remark = 'Initial price is zero';
        return result;
      }

      /* INCREASE */
      const increaseBtn = page.locator("//button[p[normalize-space()='+']]");
      if (await increaseBtn.count() > 0) {
        await increaseBtn.first().click();
        await waitForPriceChange(result.initialPrice);
      }
      result.increasedPrice = await getPrice();

      /* DECREASE */
      const decreaseBtn = page.locator("//button[p[normalize-space()='-']]");
      if (await decreaseBtn.count() > 0) {
        await decreaseBtn.first().click();
        await waitForPriceChange(result.increasedPrice);
      }
      result.finalPrice = await getPrice();

      if (result.initialPrice !== result.finalPrice) {
        result.status = 'FAIL';
        result.remark = 'Price did not reset';
      }

      /* ADD TO CART */
      const addToCartBtn = page.locator(
        "//button[normalize-space()='Add to Cart' and @type='button']"
      );
      if (await addToCartBtn.count() > 0) {
        await page.waitForTimeout(200);
        await addToCartBtn.first().click();
        await page.waitForTimeout(5000);

        const cartBtn = page.locator('a[href="/checkout/cart"]');
        if (await cartBtn.count() > 0) {
          result.addToCartStatus = 'PASS';
        } else {
          result.addToCartStatus = 'FAIL';
          result.status = 'FAIL';
          result.remark = 'Mini cart not opened';
        }
      }

    } catch (e) {
      result.status = 'ERROR';
      result.remark = e.message;
    } finally {
      await context.close();
      return result;
    }
  };

  /* ---------- RUN PARALLEL IN BATCHES ---------- */
  let globalIndex = 1;

  for (let i = 0; i < productUrls.length; i += PARALLEL_LIMIT) {
    const batch = productUrls.slice(i, i + PARALLEL_LIMIT);

    const batchResults = await Promise.all(
      batch.map((url) => processProduct(url, globalIndex++))
    );

    results.push(...batchResults);
  }

  /* ---------- WRITE CSV IN CORRECT ORDER ---------- */
  results
    .sort((a, b) => a.index - b.index)
    .forEach((r) => {
      const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
      fs.appendFileSync(
        csvPath,
        `${r.index},${escape(r.productName)},${escape(r.url)},${r.initialPrice},${r.increasedPrice},${r.finalPrice},${r.addToCartStatus},${r.status},${escape(r.remark)}\n`
      );
    });

  log('🎉 TEST COMPLETED WITH ORDERED CSV');
});
