const { test, request } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Read URLs from CSV file
const csvPath = path.resolve(__dirname, '../Landing page.csv');
const fileContent = fs.readFileSync(csvPath, 'utf-8');
const urls = fileContent
  .split('\n')
  .slice(1) // Skip header row
  .map(line => line.trim())
  .filter(line => line.length > 0 && line.startsWith('http'));

console.log(`Loaded ${urls.length} URLs from ${csvPath}`);

test('Generate Banner & Product Status CSV', async ({ browser }) => {
  test.setTimeout(600000); // 10 minutes

  // Initialize queue
  const queue = urls.map((url, index) => ({ url, sno: index + 1 }));
  const results = [["Sno", "URL", "Banner Status", "Product Images Status"]];

  // Thread-safe results collection
  const collectResult = (sno, url, bannerStatus, productStatus) => {
    results.push([sno, url, bannerStatus, productStatus]);
  };

  const MAX_CONCURRENCY = 10;
  console.log(`Starting check for ${urls.length} URLs with concurrency: ${MAX_CONCURRENCY}`);

  // Worker function
  const runWorker = async (workerId) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const apiContext = await context.request;

    try {
      while (queue.length > 0) {
        const task = queue.shift();
        if (!task) break;

        const { url, sno } = task;
        let bannerStatus = "Available";
        let productStatus = "All OK";
        let brokenProducts = [];

        console.log(`[Worker ${workerId}] Checking [${sno}/${urls.length}]: ${url}`);

        try {
          const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });

          if (!response || !response.ok()) {
            bannerStatus = `Page Error ${response?.status() || 'Timeout'}`;
            productStatus = "Skipped";
          } else {
            // --- 1. Check Hero Banner ---
            const heroImg = page.locator('picture img').first();
            if (await heroImg.count() === 0) {
              bannerStatus = "Banner Missing";
            } else {
              const imgSrc = await heroImg.getAttribute('src');
              if (!imgSrc) {
                bannerStatus = "Banner src Missing";
              } else {
                const absoluteImgSrc = new URL(imgSrc, url).href;
                try {
                    const imgCheck = await apiContext.get(absoluteImgSrc);
                    if (!imgCheck.ok()) {
                      bannerStatus = `Banner Broken (${imgCheck.status()})`;
                    }
                } catch (e) {
                    bannerStatus = `Banner Check Failed`;
                }
              }
            }

            // --- 2. Check Product Grid Images ---
            const productImages = page.locator("//div[contains(@class,'grid-cols')]//a//img");
            const productCount = await productImages.count();
            
            if (productCount === 0) {
                productStatus = "No Products Found";
            } else {
                for (let i = 0; i < productCount; i++) {
                    const img = productImages.nth(i);
                    const src = await img.getAttribute('src');
                    if (src) {
                        try {
                            const absoluteSrc = new URL(src, url).href;
                            const res = await apiContext.get(absoluteSrc);
                            if (!res.ok()) {
                                brokenProducts.push(`Img ${i+1} (${res.status()})`);
                            }
                        } catch (e) {
                            brokenProducts.push(`Img ${i+1} (Error)`);
                        }
                    } else {
                        brokenProducts.push(`Img ${i+1} (No src)`);
                    }
                }
                
                if (brokenProducts.length > 0) {
                    productStatus = `Broken: ${brokenProducts.join(', ')}`;
                } else {
                    productStatus = `All ${productCount} OK`;
                }
            }
          }
        } catch (error) {
          bannerStatus = `Error: ${error.message}`;
          productStatus = "Skipped";
        }

        collectResult(sno, url, bannerStatus, productStatus);
      }
    } finally {
      await context.close();
    }
  };

  // Launch workers
  const workers = Array(MAX_CONCURRENCY).fill(null).map((_, i) => runWorker(i + 1));
  await Promise.all(workers);

  // Sort and Save
  const header = results[0];
  const dataRows = results.slice(1).sort((a, b) => a[0] - b[0]);
  const finalOutput = [header, ...dataRows];

  const csvContent = finalOutput.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  fs.writeFileSync("banner_product_report.csv", csvContent, "utf-8");

  console.log("\n✅ Report generated: banner_product_report.csv");
});
