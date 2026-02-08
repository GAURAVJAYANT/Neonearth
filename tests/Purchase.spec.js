const { test, expect } = require('@playwright/test');

test('Smart auto-wait ecommerce flow (5 min safe)', async ({ page }) => {

  test.setTimeout(300000); // extra safety

  // -------------------------------------------------
  // 1. Open site
  // -------------------------------------------------
  await page.goto('https://www.coversandall.com/');

  // Wait banner (auto-wait up to 5 min)
  const banner = page.locator("//p[contains(normalize-space(),'Use code:')]");
  await expect(banner).toBeVisible();

  const bannerText = await banner.textContent();
  const couponCode = bannerText?.split(':')[1]?.trim() || 'COVER';
  console.log('Coupon Code:', couponCode);

  // -------------------------------------------------
  // 2. Hover Custom Covers → Click submenu
  // -------------------------------------------------
  const mainMenu = page.getByText('Custom Covers', { exact: true }).first();
  await expect(mainMenu).toBeVisible();
  await mainMenu.hover();

  const subMenu = page.locator(
    "//a[.//p[normalize-space()='Custom Covers']]"
  ).first();

  await expect(subMenu).toBeVisible();
  await subMenu.click();

  // -------------------------------------------------
  // 3. Select Cylinder Shape
  // -------------------------------------------------
  const cylinderLink = page.getByRole('link', { name: /Cylinder/i }).first();
  await expect(cylinderLink).toBeVisible();
  await cylinderLink.click();

  await expect(
    page.getByText('Select or Enter Measurements')
  ).toBeVisible();

  // -------------------------------------------------
  // 4. Fill measurements
  // -------------------------------------------------
  await page.locator('[name="measurements.H"]').fill('20');
  await page.locator('[name="measurements.D"]').fill('20');

  // -------------------------------------------------
  // 5. Select fabric
  // -------------------------------------------------
  const coverTuff = page.getByText('Cover Tuff').first();
  await expect(coverTuff).toBeVisible();
  await coverTuff.click();

  // -------------------------------------------------
  // 6. Add to cart
  // -------------------------------------------------
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await page.getByText('Go To Shopping Cart', { exact: true }).click();

  // -------------------------------------------------
  // 7. Apply coupon
  // -------------------------------------------------
  await page.getByText('Available Offers').click();

  const couponInput = page.getByPlaceholder('Enter Discount Code');
  await expect(couponInput).toBeVisible();
  await couponInput.fill(couponCode);

  await page.getByRole('button', { name: 'Apply' }).click();

  // -------------------------------------------------
  // 8. Capture prices (SMART WAIT)
  // -------------------------------------------------
  const subtotal = page.locator(
    "(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]"
  );

  const discount = page.locator(
    "//div[contains(@class,'justify-between')]//span[contains(text(),'-')]"
  );

  const shipping = page.locator(
    "//p[normalize-space()='Shipping']/following-sibling::div//span"
  );

  await expect(subtotal).toBeVisible();

  const subtotalText = await subtotal.textContent();
  const discountText = await discount.textContent();
  const shippingText = await shipping.textContent();

  console.log('Subtotal:', subtotalText?.trim());
  console.log('Discount:', discountText?.trim());
  console.log('Shipping:', shippingText?.trim());

  // -------------------------------------------------
  // 9. Quantity loop with SMART WAIT (NO CRASH)
  // -------------------------------------------------
  const qtyInput = page.locator('[name="quantity"]');

  for (const qty of [2, 4, 6, 8]) {
    console.log(`\n--- Testing Quantity ${qty} ---`);

    const oldSubtotal = await subtotal.textContent();

    await qtyInput.fill(qty.toString());
    await qtyInput.press('Enter');

    // Wait until subtotal CHANGES (≤ 5 minutes)
    await expect(subtotal).not.toHaveText(oldSubtotal);

    const s = parseFloat((await subtotal.textContent()).replace(/[^0-9.]/g, ''));
    const d = parseFloat((await discount.textContent()).replace(/[^0-9.]/g, ''));
    const sh = parseFloat((await shipping.textContent()).replace(/[^0-9.]/g, ''));

    const percent = s > 0 ? ((d / s) * 100).toFixed(2) : '0';

    console.log(`Qty ${qty} → Subtotal: $${s}, Discount: $${d} (${percent}%), Shipping: $${sh}`);
  }

  // -------------------------------------------------
  // 10. Pause to observe
  // -------------------------------------------------
  console.log('Test completed successfully. Waiting before exit...');
  await page.waitForTimeout(15000);
});
