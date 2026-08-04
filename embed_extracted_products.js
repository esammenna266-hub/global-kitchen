const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const jsonPath = path.join(__dirname, 'js', 'extracted_drive_products.json');

if (!fs.existsSync(jsonPath)) {
    console.error("JSON file not found yet!");
    process.exit(1);
}

const extractedProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
console.log(`Loaded ${extractedProducts.length} extracted products from JSON.`);

const formattedDataJsProducts = extractedProducts.map((p, idx) => ({
    id: idx + 1000,
    nameAR: p.title,
    nameEN: p.title,
    price: p.costPrice,
    sellingPrice: p.price,
    profitMargin: 30,
    sku: p.sku,
    category: p.category,
    image: p.image || 'assets/products/img_p1_1.jpeg',
    badgeAR: 'عرض محدود',
    badgeEN: 'Limited Offer',
    rating: 4.8,
    reviewsCount: 12,
    inStock: true,
    specAR: `منتج من فئة ${p.category} - التكلفة $${p.costPrice} | نسبة الربح 30%`,
    specEN: `Item from ${p.category}`
}));

const dataJsPath = path.join(__dirname, 'js', 'data.js');
const dataJsContent = `/**
 * Global Kitchen - Product Catalog Data (Extracted directly from Supplier PDF Catalogs)
 */
const PRODUCTS = ${JSON.stringify(formattedDataJsProducts, null, 2)};

if (typeof module !== 'undefined') {
    module.exports = { PRODUCTS };
}
`;
fs.writeFileSync(dataJsPath, dataJsContent, 'utf-8');
console.log(`Updated js/data.js with ${formattedDataJsProducts.length} real products!`);
