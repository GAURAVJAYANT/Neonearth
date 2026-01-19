const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('Sitemap products price & quantity validation (CSV Output)', async ({ page }) => {
  test.setTimeout(0);

  const BASE_DOMAIN = 'https://www.coversandall.com';
  const SITEMAP_URL = `${BASE_DOMAIN}/sitemap`;
  const BATCH_SIZE = 5;

  const csvPath = path.join(__dirname, 'product_validation_result.csv');

  // Create CSV Header
  fs.writeFileSync(
    csvPath,
    'Index,Product Name,URL,Initial Price,Increased Price,Final Price,Status,Remark\n'
  );

  await page.goto(SITEMAP_URL, { timeout: 90000 });

  const PRODUCTS_XPATH =
    "//p[normalize-space()='Products']/following-sibling::ul[1]//li//a";

  const products = page.locator(PRODUCTS_XPATH);
  const count = await products.count();

  console.log(`Total Products Found: ${count}`);

  let failures = [];
  let productUrls = [];

  /* ---------- COLLECT URLS ---------- */
  for (let i = 0; i < count; i++) {
    let url = await products.nth(i).getAttribute('href');
    if (!url.startsWith('http')) {
      url = `${BASE_DOMAIN}/${url.replace(/^\/+/, '')}`;
    }
    productUrls.push(url);
  }

  /* ---------- PROCESS 5 TABS AT A TIME ---------- */
  let index = 1;

  for (let i = 0; i < productUrls.length; i += BATCH_SIZE) {
    const batch = productUrls.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (productUrl) => {
        const newPage = await page.context().newPage();

        let productName = 'NOT FOUND';
        let initialPrice = 0;
        let increasedPrice = 0;
        let finalPrice = 0;
        let status = 'PASS';
        let remark = '';

        try {
          await newPage.goto(productUrl, { timeout: 90000 });
          await newPage.waitForLoadState('domcontentloaded');
          await newPage.waitForTimeout(2000);

          const nameLocator = newPage.locator(
            "//h1[contains(@class,'font-medium') and contains(@class,'leading-9')]"
          );

          if (await nameLocator.count() > 0) {
            productName = (await nameLocator.first().innerText()).trim();
          }

          const getPrice = async () => {
            const priceLocator = newPage.locator(
              "//span[contains(@class,'font-semibold') and contains(@class,'text-primary-900')]"
            );
            if (await priceLocator.count() === 0) return 0;
            const txt = (await priceLocator.first().innerText()).trim();
            return parseFloat(txt.replace(/[^0-9.]/g, '')) || 0;
          };

          initialPrice = await getPrice();

          if (initialPrice === 0) {
            status = 'FAIL';
            remark = 'Initial price is zero';
            failures.push(`ZERO PRICE | ${productUrl}`);
            return;
          }

          const increaseBtn = newPage.locator("//button[p[normalize-space()='+']]");
          if (await increaseBtn.count() > 0) {
            await increaseBtn.first().click();
            await newPage.waitForTimeout(1500);
          }

          increasedPrice = await getPrice();

          const decreaseBtn = newPage.locator("//button[p[normalize-space()='-']]");
          if (await decreaseBtn.count() > 0) {
            await decreaseBtn.first().click();
            await newPage.waitForTimeout(1500);
          }

          finalPrice = await getPrice();

          if (initialPrice !== finalPrice) {
            status = 'FAIL';
            remark = 'Price did not reset after decrease';
            failures.push(
              `PRICE RESET FAIL | ${productName} | ${productUrl}`
            );
          }

        } catch (e) {
          status = 'ERROR';
          remark = e.message;
          failures.push(`ERROR | ${productUrl}`);
        } finally {
          const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;

          fs.appendFileSync(
            csvPath,
            `${index},${escape(productName)},${escape(productUrl)},${initialPrice},${increasedPrice},${finalPrice},${status},${escape(remark)}\n`
          );

          index++;
          await newPage.close();
        }
      })
    );
  }

  /* ---------- FINAL ASSERT ---------- */
  if (failures.length > 0) {
    throw new Error(`Test Failed. Check CSV for details.`);
  }

  console.log('✅ Execution completed. CSV file generated successfully.');
});
