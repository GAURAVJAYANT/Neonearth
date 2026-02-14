const { execSync } = require('child_process');

async function globalTeardown() {
    console.log('\n✅ Tests completed!');

    try {
        console.log('📄 Generating PDF Report...');
        // Execute the PDF generation script synchronously
        execSync('node generate-pdf-report.js', { stdio: 'inherit' });
        console.log('✨ PDF Report generated successfully: test-results/report.pdf');
    } catch (error) {
        console.error('❌ Failed to generate PDF report:', error.message);
    }
}

module.exports = globalTeardown;
