const { BasePage } = require('./BasePage');

class NeonearthProductPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async getProductName() {
        try {
            // Wait for the h1 element OR fallback to title if h1 is missing
            try { await this.page.waitForSelector('h1', { state: 'attached', timeout: 3000 }); } catch(e) {}
            
            const name = await this.page.evaluate(() => {
                const h1 = document.querySelector('h1');
                if (h1 && h1.innerText.trim()) return h1.innerText.trim();
                
                const ogTitle = document.querySelector('meta[property="og:title"]');
                if (ogTitle && ogTitle.content) return ogTitle.content.split('|')[0].trim();
                
                const title = document.querySelector('title');
                if (title && title.innerText) return title.innerText.split('|')[0].trim();
                
                return 'UNKNOWN_NAME';
            });
            
            return name;
        } catch (e) {
            console.error('Failed to locate product name h1 element.');
            return 'ERROR_LOADING_NAME';
        }
    }
}

module.exports = { NeonearthProductPage };
