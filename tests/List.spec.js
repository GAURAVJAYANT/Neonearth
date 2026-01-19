const { test, chromium } = require('@playwright/test');
const fs = require('fs');
 
 
 
test('Check multiple URLs and compare products', async () => {
 test.setTimeout(180000);  
    const urlKeys = [
        "social-welcome-offer",
        "email-only-offer",
        "labor-of-love",
        "bestsellers-old",
        "new-user-offer",
        "trick-or-treat",
        "holiday-prep-sale",
        "year-end-sale",
        "black-friday-special",
        "winter-sale",
        "bestsellers"
    ];
 
    const expiredLinks = [];
    const browser = await chromium.launch();
 
    async function isLiveExpired(page) {
        const checks = [
            "Currently Unavailable",
            "Offer has Expired",
            "Sorry! That Offer has Expired"
        ];
 
        for (const text of checks) {
            if (await page.locator(`text=${text}`).count() > 0) return true;
        }
        return false;
    }
 
    async function getUATProducts(key) {
        const page = await browser.newPage();
        const uatURL = `https://uat.alphaprints.in/${key}`;
 
        await page.goto(uatURL, { waitUntil: "domcontentloaded" });
 
        const items = await page.$$eval('div.h-12 a p', nodes =>
            nodes.map(n => n.textContent.trim())
        );
 
        console.log("\nUAT PRODUCTS:", key);
        items.forEach((item, i) => console.log(`${i + 1}. ${item}`));
        console.log("Total UAT:", items.length);
 
        await page.close();
        return items;
    }
 
    async function getLiveProducts(key) {
        const page = await browser.newPage();
        const liveURL = `https://coversandall.com/${key}`;
 
        let response;
        try {
            response = await page.goto(liveURL, { waitUntil: "domcontentloaded" });
        } catch (err) {
            expiredLinks.push(liveURL);
            await page.close();
            return null;
        }
 
        if (!response || response.status() >= 400) {
            expiredLinks.push(liveURL);
            await page.close();
            return null;
        }
 
        if (await isLiveExpired(page)) {
            expiredLinks.push(liveURL);
            await page.close();
            return null;
        }
 
        const items = await page.$$eval('.product-item-name a', nodes =>
            nodes.map(n => n.textContent.trim())
        );
 
        if (items.length === 0) {
            expiredLinks.push(liveURL);
            await page.close();
            return null;
        }
 
        console.log("\nLIVE PRODUCTS:", key);
        items.forEach((item, i) => console.log(`${i + 1}. ${item}`));
        console.log("Total LIVE:", items.length);
 
        await page.close();
        return items;
    }
 
    for (const key of urlKeys) {
        const uatProducts = await getUATProducts(key);
        const liveProducts = await getLiveProducts(key);
 
        fs.writeFileSync(
            `product-list-${key}.json`,
            JSON.stringify({ key, uat: uatProducts, live: liveProducts }, null, 2)
        );
 
        if (!liveProducts) {
            console.log("\nLIVE EXPIRED:", key);
            continue;
        }
 
        if (uatProducts.length !== liveProducts.length) {
            console.log("\nCOUNT MISMATCH", key);
            continue;
        }
 
        const uatSet = new Set(uatProducts);
        let mismatch = false;
 
        for (const product of liveProducts) {
            if (!uatSet.has(product)) {
                console.log("Missing in UAT:", product);
                mismatch = true;
            } else {
                uatSet.delete(product);
            }
        }
 
        if (uatSet.size > 0) {
            console.log("Extra in UAT:", [...uatSet]);
            mismatch = true;
        }
 
        if (!mismatch) {
            console.log("MATCH:", key);
        }
    }
 
    if (expiredLinks.length > 0) {
        fs.writeFileSync("expired-live-links.txt", expiredLinks.join("\n"));
        console.log("\nExpired links saved: expired-live-links.txt");
    }
 
    await browser.close();
});