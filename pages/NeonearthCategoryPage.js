const { BasePage } = require('./BasePage');

class NeonearthCategoryPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async getProductLinks() {
        console.log('Extracting product links from Category PLP...');
        
        const links = await this.page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a[href]'));
            
            return allLinks
                .map(a => a.href)
                .filter(href => {
                    // Filter logic: neonearth products usually contain '-p' in the path or variant_sku query param
                    return (href.includes('-p?') || href.includes('variant_sku=') || /-p($|\?)/.test(href)) 
                            && !href.includes('fabric-swatch');
                })
                .filter((v, i, a) => a.indexOf(v) === i); // Return unique values
        });
        
        return links;
    }

    async getProductsData() {
        console.log('Extracting product links and names from Category PLP...');
        
        const products = await this.page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a[href]'));
            
            const productLinks = allLinks.filter(a => {
                const href = a.href;
                return (href.includes('-p?') || href.includes('variant_sku=') || /-p($|\?)/.test(href)) 
                        && !href.includes('fabric-swatch');
            });

            const uniqueMap = new Map();
            for (const a of productLinks) {
                let textName = a.innerText.trim();
                if (!textName && a.querySelector('img')) {
                    textName = a.querySelector('img').alt || '';
                }
                const currentName = uniqueMap.has(a.href) ? uniqueMap.get(a.href).name : '';
                if (textName.length > currentName.length) {
                    uniqueMap.set(a.href, { url: a.href, name: textName.replace(/\n/g, ' - ') });
                }
            }
            
            return Array.from(uniqueMap.values());
        });
        
        return products;
    }
}

module.exports = { NeonearthCategoryPage };
