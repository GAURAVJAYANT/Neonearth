const { BasePage } = require('./BasePage');

class SitemapPage extends BasePage {
    constructor(page) {
        super(page);
        this.productsXpath = "//p[normalize-space()='Products']/following-sibling::ul[1]//li//a";
    }

    async getAllProductLinks() {
        const products = this.page.locator(this.productsXpath);
        const count = await products.count();
        const productLinks = [];

        for (let i = 0; i < count; i++) {
            const product = products.nth(i);
            let productUrl = await product.getAttribute('href');
            productLinks.push(productUrl);
        }
        return productLinks;
    }
}

module.exports = { SitemapPage };
