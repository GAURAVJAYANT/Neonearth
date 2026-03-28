const { BasePage } = require('./BasePage');

class HomePage extends BasePage {
    constructor(page) {
        super(page);
        // Common Magento/E-commerce selectors
        this.searchInput = "input[id='search'], input[name='q']";
        this.searchBtn = "button[type='submit'][title='Search'], button.action.search";
        this.searchResults = ".product-item-link";
        // Mega Menu Selectors
        this.menuItem = (name) => `//span[contains(@class, 'ui-menu-icon')]/following-sibling::span[normalize-space()='${name}'] | //a/span[normalize-space()='${name}']`;
        this.subMenuLink = (name) => `//ul[contains(@class, 'submenu')]//a[span[normalize-space()='${name}']] | //ul[contains(@class, 'submenu')]//a[normalize-space()='${name}']`;
    }

    async navigateToCategory(categoryName, subCategoryName) {
        console.log(`Navigating to ${categoryName} -> ${subCategoryName}`);
        
        const category = this.page.locator(this.menuItem(categoryName)).first();
        await category.hover();
        await this.page.waitForTimeout(500); // Wait for menu to appear

        if (subCategoryName) {
             const subCategory = this.page.locator(this.subMenuLink(subCategoryName)).first();
             await subCategory.click();
        } else {
             await category.click();
        }
        await this.page.waitForLoadState('domcontentloaded');
    }

    async navigate() {
        await this.page.goto('https://www.coversandall.com/', { waitUntil: 'domcontentloaded' });
    }

    async searchForProduct(productName) {
        console.log(`Searching for: ${productName}`);
        
        // Handle Cookie Banner if present
        const cookieBtn = this.page.locator('button:has-text("ACCEPT AND CLOSE"), button:has-text("Allow All")');
        if (await cookieBtn.isVisible()) {
            await cookieBtn.click();
            await this.page.waitForTimeout(500);
        }

        // Try to click search icon first if input is not visible
        const searchIcon = this.page.locator('.action.search, .header-search-icon, button[aria-label="Search"]');
        if (await searchIcon.count() > 0 && await searchIcon.first().isVisible()) {
             console.log('Clicking search icon to reveal input...');
             await searchIcon.first().click();
             await this.page.waitForTimeout(500);
        }
        
        // Try multiple potential selectors
        const searchSelectors = ['#search', '#search_mini_form input', 'input[name="q"]', '.header-search input'];
        let input = null;

        for (const selector of searchSelectors) {
             const el = this.page.locator(selector).first();
             if (await el.isVisible()) {
                 input = el;
                 console.log(`Found search input with selector: ${selector}`);
                 break;
             }
        }

        if (!input) {
            console.log('Search input NOT found. Dumping body text...');
             // Verify if we are on mobile layout
            console.log(await this.page.locator('body').innerText());
            throw new Error('Search input not found');
        }

        await input.fill(productName);
        await this.page.keyboard.press('Enter');
        await this.page.waitForLoadState('networkidle');
    }

    async selectFirstResult() {
        console.log('Selecting first search result...');
        const firstItem = this.page.locator(this.searchResults).first();
        await firstItem.waitFor({ state: 'visible' });
        const name = await firstItem.innerText();
        console.log(`Clicking on product: ${name}`);
        await firstItem.click();
        await this.page.waitForLoadState('domcontentloaded');
        return name;
    }
}

module.exports = { HomePage };
