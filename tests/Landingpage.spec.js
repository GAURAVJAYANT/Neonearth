const { test, request } = require('@playwright/test');
const fs = require('fs');

const urls = [
  "https://www.coversandall.com/fall-flash-sale",
  "https://www.coversandall.ca/fall-flash-sale",
  "https://www.coversandall.com/welcome-offer",
  "https://www.coversandall.com.au/welcome-offer",
  "https://www.coversandall.co.uk/welcome-offer",
  "https://www.coversandall.ca/welcome-offer",
  "https://www.coversandall.eu/welcome-offer",
  "https://www.coversandall.com/mothers-day-special",
  "https://www.coversandall.com.au/mothers-day-special",
  "https://www.coversandall.ca/mothers-day-special",
  "https://www.coversandall.com/coupons/exclusive-offer-bestseller",
  "https://www.coversandall.com.au/coupons/exclusive-offer-bestseller",
  "https://www.coversandall.co.uk/coupons/exclusive-offer-bestseller",
  "https://www.coversandall.ca/coupons/exclusive-offer-bestseller",
  "https://www.coversandall.eu/coupons/exclusive-offer-bestseller"
  // 👉 keep adding the rest in the SAME format
];

test('Generate Banner Status CSV', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  const results = [["Sno", "URL", "Banner Status"]];
  const apiContext = await request.newContext();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    let status = "Available";
    const sno = i + 1;

    console.log(`[${sno}/${urls.length}] Checking: ${url}`);

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      if (!response || !response.ok()) {
        status = `Not Available (Page Load Error ${response?.status() || 'Timeout'})`;
      } else {
        const heroImg = page.locator('picture img').first();

        if (await heroImg.count() === 0) {
          status = "Not Available (Banner Image Missing)";
        } else {
          const imgSrc = await heroImg.getAttribute('src');

          if (!imgSrc) {
            status = "Not Available (Image src Missing)";
          } else {
            const absoluteImgSrc = new URL(imgSrc, url).href;
            const imgCheck = await apiContext.get(absoluteImgSrc);

            if (!imgCheck.ok()) {
              status = `Not Available (Broken Image ${imgCheck.status()})`;
            }
          }
        }
      }
    } catch (error) {
      status = `Not Available (Error: ${error.message})`;
    }

    results.push([sno, url, status]);
  }

  const csvContent = results.map(row => row.join(",")).join("\n");
  fs.writeFileSync("banner_report.csv", csvContent, "utf-8");

  console.log("\n✅ Report generated: banner_report.csv");
});
