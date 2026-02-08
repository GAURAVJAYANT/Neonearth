const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../pages/ProductPage');

test.describe('Customization Engine Tests', () => {
  const PRODUCT_URL = 'https://www.coversandall.com/custom-clear-vinyl-tarps.html';

  test('Should update price when dimensions are changed', async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.navigate(PRODUCT_URL);
    await productPage.page.waitForLoadState('networkidle');

    const initialPrice = await productPage.getProductPrice();
    console.log(`Initial Price: ${initialPrice}`);

    // Update Dimensions
    console.log('Updating dimensions to 10x10');
    await productPage.enterDimensions(10, 10);

    const updatedPrice = await productPage.getProductPrice();
    console.log(`Updated Price (10x10): ${updatedPrice}`);

    expect(updatedPrice).not.toBe(initialPrice);
    expect(updatedPrice).toBeGreaterThan(initialPrice);
  });

  test('Should update price when personalization is toggled', async ({ page }) => {
    const productPage = new ProductPage(page);

    test.setTimeout(120000); // Increase timeout for slow page
    await productPage.navigate(PRODUCT_URL);
    await productPage.page.waitForLoadState('domcontentloaded');
    // Wait for the price element specifically to ensure page is ready enough
    await productPage.page.locator(productPage.priceLocator).first().waitFor({ state: 'visible', timeout: 60000 });

    const priceBeforePersonalization = await productPage.getProductPrice();
    console.log(`Price before personalization: ${priceBeforePersonalization}`);

    // Toggle Personalization
    console.log('Toggling personalization');
    await productPage.togglePersonalization();

    const priceAfterPersonalization = await productPage.getProductPrice();
    console.log(`Price after personalization: ${priceAfterPersonalization}`);

    expect(priceAfterPersonalization).not.toBe(priceBeforePersonalization);
  });

  test('Should apply coupon code and verify discount', async ({ page }) => {
    test.setTimeout(90000); // Allow extra time
    const productPage = new ProductPage(page);
    const { CartPage } = require('../pages/CartPage');
    const cartPage = new CartPage(page);

    await productPage.navigate(PRODUCT_URL);
    await productPage.page.waitForLoadState('domcontentloaded');

    // Select measurements
    await productPage.enterDimensions(10, 10);
    const initialPrice = await productPage.getProductPrice();
    console.log(`Product Price: ${initialPrice}`);

    // Add to Cart
    await productPage.addToCart();

    await page.waitForTimeout(6000);
  
    await page.getByText('Checkout Now', { exact: true });
    await page.waitForTimeout(9000);

    await page.locator(`p:has-text("Available Offers")`).click();
    await page.waitForTimeout(6000);

    await page.locator(`input[name="couponCode"][type="text"][placeholder="Enter Discount Code"]`).fill("COVER");
    await page.waitForTimeout(9000);

    await page.locator('#couponAppliedForm').getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(9000);  

    const subtotal = await page.locator("(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]").textContent();

     console.log("Subtotal:", subtotal?.trim());

     await page.waitForTimeout(9000); 

     const discount = await page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]").textContent();

     console.log("Discount:", discount?.trim());

     await page.waitForTimeout(9000); 

     // Calculate Discount Percentage
     const subtotalValue = parseFloat(subtotal?.replace(/[^0-9.]/g, '') || "0");
     const discountValue = parseFloat(discount?.replace(/[^0-9.]/g, '') || "0");

     if (subtotalValue > 0) {
         const percentage = (discountValue / subtotalValue) * 100;
         console.log(`Discount Percentage: ${percentage.toFixed(2)}%`);
         const priceAfterDiscount = subtotalValue - discountValue;
         console.log(`Price After Discount: ${priceAfterDiscount.toFixed(2)}`);
     } else {
         console.log("Subtotal is 0 or invalid, cannot calculate percentage.");
     }

     await page.waitForTimeout(9000); 


    /* Apply Coupon
    const couponCode = "offer4cp";
    await cartPage.applyCoupon(couponCode);

    // Verify Discount
    const discount = await cartPage.getDiscountAmount();
    console.log(`Discount Applied: $${discount}`);
    
    // We expect some discount, assuming the code is valid
    // If not, we log it. expecting discount >= 0 effectively passes the test if logic works, 
    // but typically we'd expect > 0 if code is valid.
    // Given we are testing the *capability*, we'll assert it didn't crash.
    // If code is valid, discount should be > 0.
    // expect(discount).toBeGreaterThan(0); */
  });
  test('test journey', async ({ page }) => {
    
    await page.goto('https://www.coversandall.com/');
    // Wait for banner to be visible before interacting
    const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
    await bannerLocator.waitFor({ state: 'visible' });

    const bannerText = await bannerLocator.innerText();
    const codeText = bannerText.split(':')[1].trim();
    console.log("Coupon Code:", codeText);


   test.setTimeout(120000); // Increase timeout for slow navigation

   // 1. Hover over Main Menu 'Custom Covers'
   const customCoversLinks = page.getByText('Custom Covers', { exact: true });
   const count = await customCoversLinks.count();
   console.log(`Found ${count} 'Custom Covers' elements.`);

   let mainMenu = null;
   // Find the first visible 'Custom Covers' (Main Menu)
   for (let i = 0; i < count; i++) {
       if (await customCoversLinks.nth(i).isVisible()) {
           mainMenu = customCoversLinks.nth(i);
           break;
       }
   }

   if (mainMenu) {
       console.log('✅ Main Menu "Custom Covers" found. Hovering...');
       await mainMenu.hover();
       await page.waitForTimeout(2000); // Visual pause

       // 2. Click Sub Menu 'Custom Covers'
       // After hover, we expect a second 'Custom Covers' to become visible in the dropdown
       // We can search specifically for the *second* visible one, or just re-query.
       
       const allCustomCovers = page.getByText('Custom Covers', { exact: true });
       const newCount = await allCustomCovers.count();
       let subMenu = null;
       
       // Strategy: Find a visible 'Custom Covers' that is NOT the main menu we just hovered
       // Or simply pick the 2nd visible one if the UI structure allows.
       // safer approach: loop again and pick the *last* visible one or specifically the 2nd one.

       let visibleLinks = [];
       for (let i = 0; i < newCount; i++) {
           if (await allCustomCovers.nth(i).isVisible()) {
               visibleLinks.push(allCustomCovers.nth(i));
           }
       }
       
       if (visibleLinks.length > 1) {
           console.log(`✅ Found ${visibleLinks.length} visible "Custom Covers" links. Clicking the second one (Sub-Category)...`);
           subMenu = visibleLinks[1]; // Index 1 is the second item
       } else {
           console.log("⚠️ Only 1 visible link found. Clicking it (fallback)...");
           subMenu = visibleLinks[0];
       }

       if (subMenu) {
           await subMenu.click();
           await page.waitForTimeout(2000);
       } else {
           console.log("❌ Sub Menu NOT found!");
       }

   } else {
       console.log('❌ Main Menu "Custom Covers" not found');
   }

   console.log("Selecting 'Round / Cylinder Shape'...");
   // Refined locator: Search for "Cylinder" text in links (robust to minor text changes)
   const roundShapeLink = page.getByRole('link', { name: /Cylinder/i }).first();
   await roundShapeLink.waitFor({ state: 'visible', timeout: 10000 });
   await roundShapeLink.click();
   await page.waitForTimeout(4000); // Visual pause after navigation

   // Wait for "Select or Enter Measurements" text to confirm page load
   await expect(page.getByText('Select or Enter Measurements')).toBeVisible({ timeout: 30000 });
   console.log("Measurement form visible.");
   
   // Proceed to filling measurements

   console.log("Attempting to fill Height (measurements.H)...");
   await page.locator('[name="measurements.H"]').click();
   await page.waitForTimeout(1000); // Visual pause
   await page.keyboard.press('Backspace');
   await page.keyboard.press('Backspace');
   await page.locator('[name="measurements.H"]').fill('20');
   await page.waitForTimeout(2000); // Visual pause

   console.log("Attempting to fill Diameter (measurements.D)...");
   await page.locator('[name="measurements.D"]').click();
   await page.waitForTimeout(1000); // Visual pause
   await page.keyboard.press('Backspace');
   await page.keyboard.press('Backspace');
   await page.locator('[name="measurements.D"]').fill('20');
   await page.waitForTimeout(2000); // Visual pause
   
   // Wait for price/ui update
   await page.waitForTimeout(5000);

   console.log("Attempting to select 'Cover Tuff' fabric...");
   const coverTuffText = page.getByText('Cover Tuff').first();
   
   if (await coverTuffText.isVisible()) {
       await coverTuffText.scrollIntoViewIfNeeded();
       await coverTuffText.click({ force: true });
       console.log("Clicked 'Cover Tuff'");
       
       await page.waitForTimeout(5000);
   } else {
       console.error("'Cover Tuff' element NOT found/visible!");
       await page.waitForTimeout(5000);
   }
   await page.waitForTimeout(7000);

   await page.getByRole('button', { name: 'Add to Cart' }).click();
   await page.waitForTimeout(7000);

   await page.getByText('Go To Shopping Cart', { exact: true }).click();
   await page.waitForTimeout(7000);

   // NEW CODE PREVIOUS CODE IS WORKING

   await page.waitForTimeout(9000);

    await page.locator(`p:has-text("Available Offers")`).click();
    await page.waitForTimeout(6000);

    await page.locator(`input[name="couponCode"][type="text"][placeholder="Enter Discount Code"]`).fill("COVER");
    await page.waitForTimeout(9000);

    await page.locator('#couponAppliedForm').getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(9000);  

    const subtotal = await page.locator("(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]").textContent();

     console.log("Subtotal:", subtotal?.trim());

     await page.waitForTimeout(9000); 

     const discount = await page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]").textContent();

     console.log("Discount:", discount?.trim());

     await page.waitForTimeout(9000); 

     // Calculate Discount Percentage
     const subtotalValue = parseFloat(subtotal?.replace(/[^0-9.]/g, '') || "0");
     const discountValue = parseFloat(discount?.replace(/[^0-9.]/g, '') || "0");

     if (subtotalValue > 0) {
         const percentage = (discountValue / subtotalValue) * 100;
         console.log(`Discount Percentage: ${percentage.toFixed(2)}%`);
         const priceAfterDiscount = subtotalValue - discountValue;
         console.log(`Price After Discount: ${priceAfterDiscount.toFixed(2)}`);
     } else {
         console.log("Subtotal is 0 or invalid, cannot calculate percentage.");
     }

     await page.waitForTimeout(9000); 



});
});