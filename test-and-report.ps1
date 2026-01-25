# Run Playwright tests and open Allure report
Write-Host "`n🚀 Running Playwright tests...`n" -ForegroundColor Cyan

# Run the tests
npx playwright test

# Check if tests ran successfully (regardless of pass/fail)
if ($LASTEXITCODE -ne $null) {
    Write-Host "`n✅ Tests completed!`n" -ForegroundColor Green
    Write-Host "📊 Opening Allure report...`n" -ForegroundColor Yellow
    
    # Open Allure report
    npx allure serve allure-results
} else {
    Write-Host "`n⚠️ Tests execution finished.`n" -ForegroundColor Yellow
    Write-Host "📊 Opening Allure report...`n" -ForegroundColor Yellow
    
    # Open Allure report anyway
    npx allure serve allure-results
}
