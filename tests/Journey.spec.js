const { test, expect } = require('@playwright/test');

test('User Journey - Browse to Checkout', async ({ page }) => {
  test.setTimeout(180000);

  // ─── GLOBAL POPUP HANDLER ───────────────────────────────────────────────
  // Specifically targets ONLY the newsletter/banner "Close popup" dismiss button.
  // This is kept very specific to avoid interfering with legitimate modals (like cart confirmation).
  await page.addLocatorHandler(
    page.locator('label[aria-label="Close popup"] img, .newsletter-popup .close, .modal-popup .action-close').first(),
    async (closeBtn) => {
      console.log('>>> Newsletter/Banner Popup detected! Dismissing it...');
      try { await closeBtn.click({ force: true, timeout: 3000 }); } catch (e) {}
    }
  );
  // ────────────────────────────────────────────────────────────────────────

  // Step 1: Navigate directly to the Custom Wall Tapestry category page
  console.log('Step 1: Navigating to Custom Wall Tapestries category...');
  await page.goto('https://test.neonearth.com/custom-wall-tapestries', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Step 2: Click the first product listed
  console.log('Step 2: Clicking first product...');
  const firstProduct = page.locator('a[href*="-p?"]').first();
  await firstProduct.waitFor({ state: 'visible', timeout: 15000 });
  const productHref = await firstProduct.getAttribute('href');
  const productUrl = productHref.startsWith('http') ? productHref : 'https://test.neonearth.com' + productHref;
  console.log(`  Found product: ${productUrl}`);
  await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Step 3: Click "Personalise this Design" button to open customiser
  console.log('Step 3: Clicking Personalise this Design...');
  const personaliseBtn = page.getByRole('button', { name: /Personalise this/i });
  await personaliseBtn.waitFor({ state: 'visible', timeout: 15000 });
  await personaliseBtn.click();
  await page.waitForTimeout(5000); // Wait for customiser

  // Step 4: Click "Generate With Neon AI" to auto-design the tapestry!
  console.log('Step 4: Clicking Generate With Neon AI...');
  const neonAiBtn = page.getByRole('button', { name: /Generate With Neon AI/i }).first();
  await neonAiBtn.waitFor({ state: 'visible', timeout: 10000 });
  await neonAiBtn.click();
  
  // Wait for the AI generation to finish Processing (it usually takes 5-15 seconds)
  console.log('  Waiting for AI image generation to complete...');
  await page.waitForTimeout(15000); // Give AI time to process and apply the design

  // If there's an AI success popup that wasn't caught by the handler, dismiss it manually
  try {
     const closeAiPopup = page.getByLabel('Close popup').getByRole('img', { name: 'close' }).first();
     if (await closeAiPopup.isVisible({ timeout: 3000 })) {
       await closeAiPopup.click({ force: true });
     }
  } catch(e) {}

  // Step 5: Add to cart from the customiser's right panel
  console.log('Step 5: Clicking Customiser Add To Cart...');
  const rightPanelAtc = page.locator('#right-panel').getByRole('button', { name: /Add To Cart/i });
  await rightPanelAtc.waitFor({ state: 'visible', timeout: 15000 });
  await rightPanelAtc.click();
  await page.waitForTimeout(4000);

  // Sometimes a second confirmation pops up after this click too
  try {
    const confirmAtc = page.getByRole('button', { name: /Add To Cart/i }).nth(2);
    if (await confirmAtc.isVisible({ timeout: 3000 })) {
      await confirmAtc.click({ force: true });
      await page.waitForTimeout(2000);
    }
  } catch (e) {}

  // Step 5: Go to Cart page and verify item is there
  console.log('Step 5: Navigating to cart...');
  await page.goto('https://test.neonearth.com/checkout/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const cartContent = await page.content();
  const isEmpty = cartContent.includes('Your cart is empty');
  console.log(`  Cart is ${isEmpty ? 'EMPTY ❌' : 'populated ✅'}`);

  // Step 6: Proceed to Secure Checkout
  console.log('Step 6: Clicking Secure Checkout...');
  const checkoutBtn = page.getByRole('button', { name: /Secure Checkout/i });
  await checkoutBtn.waitFor({ state: 'visible', timeout: 15000 });
  await checkoutBtn.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Step 7: Fill in shipping details
  // Explicitly wait for the form locators to be visible before filling to prevent race conditions
  console.log('Step 7: Filling shipping form...');
  const emailInput = page.getByRole('textbox', { name: /email address/i });
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill('test@yopmail.com');

  const fNameInput = page.getByRole('textbox', { name: /First Name/i });
  await fNameInput.waitFor({ state: 'visible', timeout: 5000 });
  await fNameInput.fill('Gaurav');

  const lNameInput = page.getByRole('textbox', { name: /Last Name/i });
  await lNameInput.waitFor({ state: 'visible', timeout: 5000 });
  await lNameInput.fill('Jayant');

  const phoneInput = page.getByRole('textbox', { name: /Mobile Number/i });
  await phoneInput.waitFor({ state: 'visible', timeout: 5000 });
  await phoneInput.fill('88888888888');

  try { 
    const companyInput = page.getByRole('textbox', { name: /Company Name/i });
    if (await companyInput.isVisible({ timeout: 2000 })) {
      await companyInput.fill('QA Automation'); 
    }
  } catch (e) {}

  // Step 8: Fill in address with autocomplete
  console.log('Step 8: Filling address...');
  const addressInput = page.getByRole('textbox', { name: 'Address*', exact: true });
  await addressInput.waitFor({ state: 'visible', timeout: 10000 });
  await addressInput.fill('New York');
  await page.waitForTimeout(2000);
  
  try {
    await page.getByText('New YorkNY, USA').click({ timeout: 5000 });
    console.log('  Selected autocomplete suggestion');
    await page.waitForTimeout(1500);
  } catch (e) {
    console.log('  Autocomplete not available, continuing...');
  }
  
  try { 
    const aptInput = page.getByRole('textbox', { name: /Apartment/i });
    if (await aptInput.isVisible({ timeout: 2000 })) {
      await aptInput.fill('hno 31'); 
    }
  } catch (e) {}

  const postcodeInput = page.getByRole('textbox', { name: /Postcode/i });
  await postcodeInput.waitFor({ state: 'visible', timeout: 5000 });
  await postcodeInput.fill('10001');

  const cityInput = page.getByRole('textbox', { name: /City/i });
  await cityInput.waitFor({ state: 'visible', timeout: 5000 });
  await cityInput.fill('New York');
  await page.waitForTimeout(1000);

  // Step 9: Fill Stripe payment fields (dynamic iframe name — use prefix match)
  console.log('Step 9: Filling Stripe payment info...');
  try {
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeFrame.getByRole('textbox', { name: 'Card number' }).fill('4111 1111 1111 1111');
    await stripeFrame.getByRole('textbox', { name: /Expiration date/i }).fill('12 / 27');
    await stripeFrame.getByRole('textbox', { name: /Security code/i }).fill('123');
    console.log('  Stripe fields filled successfully');
  } catch (e) {
    console.log(`  Stripe iframe error: ${e.message.split('\n')[0]}`);
  }

  // Step 10: Place order
  console.log('Step 10: Clicking Pay Now...');
  await page.getByRole('button', { name: /Pay Now/i }).click();
  
  // Wait dynamically for the checkout success page (payment processing can take 10-20 seconds on test servers)
  console.log('  Waiting for payment processing and success redirect...');
  try {
    await page.waitForURL(/success/i, { timeout: 120000 });
  } catch (e) {
    console.log('  Timeout waiting for success URL. Current URL:', page.url());
  }

  // Step 11: Verify success
  const finalUrl = page.url();
  console.log(`  Final URL: ${finalUrl}`);
  expect(finalUrl).toContain('success');
  console.log('✅ Journey Complete! Order placed successfully.');
  // 🔥 FINAL WAIT (IMPORTANT)
  console.log('Waiting 30 seconds to view order number...');
  await page.waitForTimeout(20000);

  // Step 12: Close any popup that appeared after order placement
  console.log('Step 12: Closing any popup if visible...');
  try {
    const popupClose = page.locator('label[aria-label="Close popup"] img, .newsletter-popup .close, .modal-popup .action-close').first();
    if (await popupClose.isVisible({ timeout: 3000 })) {
      await popupClose.click({ force: true });
      console.log('  Popup closed successfully.');
    } else {
      console.log('  No popup visible.');
    }
  } catch (e) {
    console.log('  No popup to close or already closed.');
  }

  // Step 13: Print text of all span elements whose text starts with '#'
  console.log('Step 13: Printing span elements starting with "#"...');
  try {
    const hashSpans = page.locator('//span[starts-with(normalize-space(), \'#\')]');
    const count = await hashSpans.count();
    console.log(`  Found ${count} span(s) starting with '#':`);
    for (let i = 0; i < count; i++) {
      const text = await hashSpans.nth(i).innerText();
      console.log(`  [${i + 1}] ${text.trim()}`);
    }
  } catch (e) {
    console.log(`  Could not retrieve hash spans: ${e.message.split('\n')[0]}`);
  }

  // Step 14: Wait 15 seconds before browser closes
  console.log('Waiting 15 seconds before browser closes...');
  await page.waitForTimeout(15000);
  console.log('✅ All steps complete. Browser closing.');
});