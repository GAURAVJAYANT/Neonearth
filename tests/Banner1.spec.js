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

test('Generate Banner Status CSV', async ({ browser }) => {
  test.setTimeout(600000); // 10 minutes

  // Initialize queue with index to preserve order if needed (though CSV checks likely don't strictly need order)
  const queue = urls.map((url, index) => ({ url, sno: index + 1 }));
  const results = [["Sno", "URL", "Banner Status"]];
  
  // Thread-safe results collection (JS is single-threaded)
  const collectResult = (sno, url, status) => {
    results.push([sno, url, status]);
  };

  const MAX_CONCURRENCY = 10;
  console.log(`Starting check for ${urls.length} URLs with concurrency: ${MAX_CONCURRENCY}`);

  // Worker function
  const runWorker = async (workerId) => {
    // Create a new context for this worker to ensure isolation
    const context = await browser.newContext();
    const page = await context.newPage();
    const apiContext = await context.request;

    try {
      while (queue.length > 0) {
        // Get next task
        const task = queue.shift();
        if (!task) break; // Queue empty

        const { url, sno } = task;
        let status = "Available";
        console.log(`[Worker ${workerId}] Checking [${sno}/${urls.length}]: ${url}`);

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

        collectResult(sno, url, status);
      }
    } finally {
      await context.close();
    }
  };

  // Launch workers
  const workers = Array(MAX_CONCURRENCY).fill(null).map((_, i) => runWorker(i + 1));
  await Promise.all(workers);

  // Sort results by Sno before writing (since parallel completion is out of order)
  // Skip header row (index 0)
  const header = results[0];
  const dataRows = results.slice(1).sort((a, b) => a[0] - b[0]);
  const finalOutput = [header, ...dataRows];

  const csvContent = finalOutput.map(row => row.join(",")).join("\n");
  fs.writeFileSync("banner_report.csv", csvContent, "utf-8");

  console.log("\n✅ Report generated: banner_report.csv");
});
