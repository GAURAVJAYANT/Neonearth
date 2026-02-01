
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
    const reportPath = path.resolve('./test-results/report.html');
    const pdfPath = path.resolve('./test-results/report.pdf');

    if (!fs.existsSync(reportPath)) {
        console.error('Report file not found:', reportPath);
        process.exit(1);
    }

    // 1. Patch the HTML report to hide the footer/links permanently
    console.log('Patching report to hide footer links...');
    let htmlContent = fs.readFileSync(reportPath, 'utf8');
    const hideFooterCss = `
    <style>
        /* Hiding the specific Microsoft/Playwright link or footer */
        .mcr-footer, footer, .mcr-page-footer { display: none !important; }
        a[href*="github.com/microsoft/playwright"] { display: none !important; }
    </style>
    `;

    if (!htmlContent.includes('/* Hiding the specific Microsoft/Playwright link */')) {
        // Append at the end of body or just append to file
        htmlContent = htmlContent.replace('</body>', `${hideFooterCss}</body>`);
        fs.writeFileSync(reportPath, htmlContent);
    }

    console.log('Generating PDF from report...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to the report
    await page.goto(`file://${reportPath}`, { waitUntil: 'networkidle' });

    // Add some custom CSS to make it printable and professional
    await page.addStyleTag({
        content: `
            body { 
                -webkit-print-color-adjust: exact; 
                font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                color: #333;
                background-color: #f0f4f8 !important; /* Soft Blue Background */
            }
            /* Key: Prevent rows/items from breaking across pages */
            tr, .mcr-item, .mcr-row { 
                page-break-inside: avoid !important; 
                break-inside: avoid !important;
            }
            
            /* Ensure full width */
            .mcr-report { 
                margin: 0 !important; 
                width: 100% !important;
                background-color: #f0f4f8 !important;
            }

            /* Hide UI elements that don't make sense in PDF */
            .mcr-header-toolbar, .mcr-side-bar, .mcr-float-btn { display: none !important; }
        `
    });

    // Give it a moment to render charts/animations
    await page.waitForTimeout(4000);

    // Use Landscape mode for better width visibility (Complete columns)
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        landscape: true, // Landscape captures wide columns better
        printBackground: true,
        scale: 0.85, // Slight scale down to ensure "Everything" fits
        displayHeaderFooter: true,
        headerTemplate: `
            <div style="font-size:10px; margin:0 auto; width:100%; text-align:center; color:#888;">
                <span>Test Automation Dashboard</span>
            </div>
        `,
        footerTemplate: `
            <div style="font-size:10px; margin:0 auto; width:100%; text-align:center; color:#888;">
                Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>
        `,
        margin: {
            top: '15mm',
            bottom: '15mm',
            left: '10mm',
            right: '10mm'
        }
    });

    console.log(`PDF Report generated successfully: ${pdfPath}`);
    await browser.close();
})();
