const { test, expect } = require('@playwright/test');

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

