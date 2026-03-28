const { BasePage } = require('./BasePage');

class NeonearthHomePage extends BasePage {
    constructor(page) {
        super(page);
        // We override base page initialization if needed, but here just calling super.
    }

    async navigate() {
        console.log('Navigating to Neonearth Homepage...');
        await super.navigate('https://test.neonearth.com/');
        await this.page.waitForLoadState('domcontentloaded');
    }

    async clickCategory(categoryName) {
        console.log(`Clicking on category: ${categoryName}`);
        
        // Extract the target Href dynamically to bypass unstable mega-menu hover interactions
        const href = await this.page.evaluate((name) => {
            const links = Array.from(document.querySelectorAll('a'));
            // Look for exact text or fallback to contains
            let target = links.find(a => a.innerText.trim().replace(/\\n/g, ' ') === name);
            if (!target) {
                target = links.find(a => a.innerText.toLowerCase().includes(name.toLowerCase()));
            }
            return target ? target.href : null;
        }, categoryName);

        if (href) {
            console.log(`Extracted href directly: ${href}`);
            await this.page.goto(href, { waitUntil: 'domcontentloaded' });
        } else {
            // Fallback if not found in DOM evaluating 
            console.warn(`Could not extract href for ${categoryName}, falling back to click...`);
            let categoryLink = this.page.locator(`a:text-is("${categoryName}")`).first();
            if (await categoryLink.count() === 0) {
                categoryLink = this.page.locator(`a:has-text("${categoryName}")`).first();
            }
            await categoryLink.click({ force: true });
        }
    }
}

module.exports = { NeonearthHomePage };
