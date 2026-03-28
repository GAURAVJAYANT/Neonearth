const { BasePage } = require('./BasePage');

class CategoryPage extends BasePage {
    constructor(page) {
        super(page);
        this.filterHeader = (name) => `//div[contains(@class, 'filter-options-title') and normalize-space()='${name}']`;
        this.filterOption = (name) => `//a[contains(text(), '${name}')]`;
        this.sorterSelect = "#sorter";
        this.productList = ".product-item";
        this.productPrice = ".price";
    }

    async applyFilter(filterName, optionName) {
        console.log(`Applying Filter: ${filterName} -> ${optionName}`);
        
        const filterHead = this.page.locator(this.filterHeader(filterName));
        // Check if filter is expanded, if not click it
        const content = this.page.locator(`//div[contains(@class, 'filter-options-title') and normalize-space()='${filterName}']/following-sibling::div[contains(@class,'filter-options-content')]`);
        
        if (!(await content.isVisible())) {
            await filterHead.click();
            await this.page.waitForTimeout(500);
        }

        const option = this.page.locator(this.filterOption(optionName)).first();
        await option.click();
        await this.page.waitForLoadState('networkidle');
    }

    async sortBy(sortOption) {
        console.log(`Sorting by: ${sortOption}`);
        // sortOption examples: 'price', 'name', 'position'
        // For standard magento, value might be 'price'
        await this.page.selectOption(this.sorterSelect, { value: sortOption });
        await this.page.waitForLoadState('networkidle');
    }

    async toggleSortDirection(direction) {
        // direction: 'asc' or 'desc'
        const currentLink = this.page.locator('.action.sorter-action');
        const currentData = await currentLink.getAttribute('data-value');
        
        if (currentData !== direction) {
            await currentLink.click();
            await this.page.waitForLoadState('networkidle');
        }
    }

    async getProductPrices() {
        const prices = await this.page.locator(this.productPrice).allInnerTexts();
        return prices.map(p => parseFloat(p.replace(/[^0-9.]/g, ''))).filter(p => !isNaN(p));
    }
}

module.exports = { CategoryPage };
