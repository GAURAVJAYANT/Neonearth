const { test, expect } = require('@playwright/test');

test.describe.configure({ mode: 'parallel' });

for (let i = 1; i <= 15; i++) {

  test(`User Journey - Instance ${i}`, async ({ page }) => {

    test.setTimeout(180000);

    console.log(`🚀 Running instance ${i}`);

    // 🔥 small delay to reduce load spike
    await page.waitForTimeout(i * 500);

    // ─── POPUP HANDLER ─────────────────────────────
    await page.addLocatorHandler(
      page.locator('label[aria-label="Close popup"] img, .newsletter-popup .close, .modal-popup .action-close').first(),
      async (closeBtn) => {
        try { await closeBtn.click({ force: true }); } catch (e) {}
      }
    );

    // Step 1
    await page.goto('https://test.neonearth.com/custom-wall-tapestries', { waitUntil: 'domcontentloaded' });

    // 🔥 IMPORTANT WAIT
    await page.waitForLoadState('networkidle');

    // Step 2 - FIXED (Retry logic)
    console.log('Step 2: Clicking first product...');

    await page.waitForSelector('a[href*="-p?"]', { timeout: 30000 });

    let firstProduct;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        firstProduct = page.locator('a[href*="-p?"]:visible').first();
        await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
        break;
      } catch (e) {
        console.log(`Retry ${attempt + 1} for product load`);
        await page.reload();
        await page.waitForLoadState('networkidle');
      }
    }

    if (!firstProduct) throw new Error('Product not found after retries');

    const productHref = await firstProduct.getAttribute('href');
    const productUrl = productHref.startsWith('http')
      ? productHref
      : 'https://test.neonearth.com' + productHref;

    await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Step 3
    const personaliseBtn = page.getByRole('button', { name: /Personalise/i });
    await personaliseBtn.waitFor({ state: 'visible', timeout: 15000 });
    await personaliseBtn.click();

    // Step 4
    const neonAiBtn = page.getByRole('button', { name: /Generate With Neon AI/i }).first();
    await neonAiBtn.waitFor({ state: 'visible', timeout: 10000 });
    await neonAiBtn.click();
    await page.waitForTimeout(15000);

    // Step 5
    const atc = page.locator('#right-panel').getByRole('button', { name: /Add To Cart/i });
    await atc.waitFor({ state: 'visible', timeout: 15000 });
    await atc.click();

    // Step 6
    await page.goto('https://test.neonearth.com/checkout/cart');
    await page.waitForTimeout(2000);

    // Step 7
    await page.getByRole('button', { name: /Secure Checkout/i }).click();

    // Step 8 - FORM
    const email = `test${Date.now()}${Math.floor(Math.random() * 1000)}@yopmail.com`;

    await page.getByRole('textbox', { name: /email/i }).fill(email);
    await page.getByRole('textbox', { name: /First Name/i }).fill('Gaurav');
    await page.getByRole('textbox', { name: /Last Name/i }).fill('Jayant');
    await page.getByRole('textbox', { name: /Mobile Number/i }).fill('8888888888');

    // Step 9 - Address
    await page.getByRole('textbox', { name: 'Address*' }).fill('New York');
    await page.waitForTimeout(2000);

    try {
      await page.getByText('New YorkNY, USA').click();
    } catch (e) {}

    await page.getByRole('textbox', { name: /Postcode/i }).fill('10001');
    await page.getByRole('textbox', { name: /City/i }).fill('New York');

    // Step 10 - Payment
    try {
      const frame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
      await frame.getByRole('textbox', { name: 'Card number' }).fill('4111 1111 1111 1111');
      await frame.getByRole('textbox', { name: /Expiration date/i }).fill('12 / 27');
      await frame.getByRole('textbox', { name: /Security code/i }).fill('123');
    } catch (e) {
      console.log('Stripe not loaded properly');
    }

    // Step 11
    await page.getByRole('button', { name: /Pay Now/i }).click();

    try {
      await page.waitForURL(/success/i, { timeout: 120000 });
    } catch (e) {
      console.log('Timeout on success page');
    }

    expect(page.url()).toContain('success');

    console.log(`✅ Instance ${i} completed`);

    // 🔥 WAIT FOR ORDER NUMBER VIEW
    await page.waitForTimeout(30000);

  });

}