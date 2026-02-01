# Run Playwright tests and open Report
Write-Host "`n🚀 Running Playwright tests...`n" -ForegroundColor Cyan

# Run the tests
npx playwright test

# Check if tests ran successfully (regardless of pass/fail)
if ($LASTEXITCODE -ne $null) {
    Write-Host "`n✅ Tests completed!" -ForegroundColor Green
    
    # Generate PDF from Report
    Write-Host "📄 Generating PDF Report..." -ForegroundColor Cyan
    node generate-pdf-report.js
    
} else {
    Write-Host "`n⚠️ Tests execution finished.`n" -ForegroundColor Yellow
}
