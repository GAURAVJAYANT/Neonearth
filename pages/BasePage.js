class BasePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    async navigate(url) {
        await this.page.goto(url, { timeout: 90000 });
    }

    async getTitle() {
        return await this.page.title();
    }

    async wait(ms) {
        await this.page.waitForTimeout(ms);
    }
}

module.exports = { BasePage };
