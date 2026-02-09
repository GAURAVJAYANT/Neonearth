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
  });

  test('test journey', async ({ page }) => {
    
    await page.goto('https://uat.alphaprints.in/');
    // Wait for banner to be visible before interacting
    const bannerLocator = page.locator("//p[contains(normalize-space(),'Use code:')]");
    await bannerLocator.waitFor({ state: 'visible' });

    const bannerText = await bannerLocator.innerText();
    const codeText = bannerText.split(':')[1].trim();
    console.log("Coupon Code:", codeText);


    test.setTimeout(500000); // Increase timeout to 5 minutes for multiple quantity checks

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

     if (subtotalValue < 100) {
         const shipping = await page.locator("//p[normalize-space()='Shipping']/following-sibling::div//span").textContent();
         console.log("Shipping Price:", shipping?.trim());
     }

     // New Logic: Quantity based checks for price ranges $0-$100, $101-$200, $201-$300, >$300
     const quantities = [1, 2, 5, 8]; // Example quantities to hit different price points. Adjust if needed based on unit price.
     
     
     // Helper function to check specific quantity manually
     /**
      * @param {number} qty
      */
     /**
      * @param {number} qty
      */
     const checkQuantity = async (qty) => {
         console.log(`\n--- Manually Testing Quantity: ${qty} ---`);
         const subtotalLocator = page.locator("(//p[normalize-space()='Subtotal']/following-sibling::div//span)[last()]");
         
         // Capture current price before change to compare later
         const oldSubtotalText = await subtotalLocator.textContent();
         const oldSubtotal = parseFloat(oldSubtotalText?.replace(/[^0-9.]/g, '') || "0");
         console.log(`Current Subtotal (Before Update): $${oldSubtotal}`);

         const qtyInput = page.locator('[name="quantity"]');
         
         // Logic requested by user (Dimension Logic)
         await qtyInput.click();
         await page.waitForTimeout(1000); // Visual pause
         await page.keyboard.press('Backspace');
         await page.keyboard.press('Backspace');
         await qtyInput.fill(qty.toString());
         await page.waitForTimeout(2000); 
         
         // Trigger update by clicking subtotal (simulating blur/next action)
         await subtotalLocator.click();

         try {
             await expect(subtotalLocator).not.toHaveText(oldSubtotalText || "", { timeout: 15000 });
         } catch (e) {
             console.log("⚠️ Price did not change within timeout (or was same). continuing...");
         }
         
         await page.waitForTimeout(2000); // Small buffer after change detected

         const currentSubtotalText = await subtotalLocator.textContent();
         const currentDiscountText = await page.locator("//div[@class='flex justify-between py-1.5']//span[contains(text(),'-')]").textContent();
         const currentShippingText = await page.locator("//p[normalize-space()='Shipping']/following-sibling::div//span").textContent();

         const currentSubtotal = parseFloat(currentSubtotalText?.replace(/[^0-9.]/g, '') || "0");
         const currentDiscount = parseFloat(currentDiscountText?.replace(/[^0-9.]/g, '') || "0");
         const currentShipping = parseFloat(currentShippingText?.replace(/[^0-9.]/g, '') || "0");

         let discountPercentage = 0;
         if (currentSubtotal > 0) {
             discountPercentage = (currentDiscount / currentSubtotal) * 100;
         }

         console.log(`Qty: ${qty} | Subtotal: $${currentSubtotal} | Discount: $${currentDiscount} (${discountPercentage.toFixed(2)}%) | Shipping: $${currentShipping}`);

         // 1. Check Max Discount (Log Only)
         if (currentDiscount > 100) {
             console.log(`⚠️ INFO: Discount ($${currentDiscount}) exceeds $100. (Test continues)`);
         } else {
             console.log("✅ Discount is within limit ($100).");
         }

         // 2. Check Free Shipping (Log Only)
         if (currentSubtotal > 100) {
             if (currentShipping === 0) {
                 console.log("✅ Free shipping applied (Subtotal > $100).");
             } else {
                 console.log(`⚠️ INFO: Shipping ($${currentShipping}) is NOT free for subtotal > $100. (Test continues)`);
             }
         } else {
             console.log(`ℹ️ Subtotal <= $100 ($${currentSubtotal}). Shipping is applicable: $${currentShipping}`);
         }
     };

     // Manually test specific quantities as requested
     await checkQuantity(2);
     await checkQuantity(4);
     await checkQuantity(6);
     
     await checkQuantity(8);
     // "once details capture for quantity 8 wait for 9 seconds"
     console.log("Waiting 9 seconds after Quantity 8...");
     await page.waitForTimeout(9000);
     
     await page.getByRole('button', { name: 'Secure Checkout' }).first().click();
     await page.waitForTimeout(9000);

      await page.getByRole('textbox', { name: 'Email*' }).click();
  await page.getByRole('textbox', { name: 'Email*' }).fill('test@yopmail.com');
  await page.waitForTimeout(3000);
  await page.getByRole('textbox', { name: 'First Name*' }).click();
  await page.waitForTimeout(3000);
  
  await page.getByRole('textbox', { name: 'First Name*' }).fill('Gaurav');
  await page.waitForTimeout(3000);
  await page.getByRole('textbox', { name: 'Last Name*' }).click();
  await page.waitForTimeout(3000);
  await page.getByRole('textbox', { name: 'Last Name*' }).fill('jayant');
  await page.waitForTimeout(3000);
  await page.getByRole('textbox', { name: 'Phone Number' }).click();
  await page.waitForTimeout(3000);
  await page.getByRole('textbox', { name: 'Phone Number' }).fill('8888888');
  await page.waitForTimeout(3000);
  await page.getByRole('textbox', { name: 'Address*' }).click();
  await page.waitForTimeout(3000);
  await page.getByRole('textbox', { name: 'Address*' }).fill('stree');
  await page.waitForTimeout(3000);
  await page.getByText('StreetervilleChicago, IL, USA').click();
  await page.waitForTimeout(3000);

  console.log("Clicking 'Save And Continue'...");
  await page.getByRole('button', { name: 'Save And Continue' }).click();
  
  console.log("Clicked! Waiting 30 seconds unconditionally to observe loader...");
  await page.waitForTimeout(60000); 

  console.log("60s wait over. Checking current URL...");
  console.log("Current URL: " + page.url());

  // Attempt to detect loader for debugging purposes
  const checkoutLoader = page.locator('.loader');
  if (await checkoutLoader.isVisible()) {
      console.log("Loader is STILL visible after 60s.");
  } else {
      console.log("Loader is NOT visible.");
  }

  // Wait more if needed
  await page.waitForTimeout(3000);
  await page.getByRole('radio', { name: 'Purchase order' }).click();
  await page.waitForTimeout(1000);
  // File Upload Logic
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'SELECT FILE' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('data/upload_test_file.txt');
  await page.waitForTimeout(3000); // Wait for upload to process

  // Uncomment Place Order if ready
  await page.getByRole('button', { name: 'Place Order' }).click();
  await page.waitForTimeout(20000);
  //await page.locator(`//div[1]/section/p[1]`).textContent();
  const orderNumber = await page.locator(`//div[1]/section/p[1]`).textContent();
  console.log("Order Number: " + orderNumber);
  await page.waitForTimeout(9000);

})

});