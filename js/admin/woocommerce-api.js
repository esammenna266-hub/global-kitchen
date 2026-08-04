/**
 * WooCommerce API & Local Storage Store Layer for Integrated Admin
 * USD Currency & Global Kitchen Direct Synchronization (Explicit Profit Margin % Layer)
 */

const STORAGE_KEYS = {
    SETTINGS: 'woodash_wc_settings',
    PRODUCTS: 'woodash_products_empty_v5',
    ORDERS: 'woodash_orders',
    CUSTOMERS: 'woodash_customers'
};

function getGlobalKitchenSeedProducts() {
    if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS) && PRODUCTS.length > 0) {
        return PRODUCTS.map((p, idx) => {
            const costPrice = parseFloat(p.price || p.costPrice) || 5.00;
            const profitMargin = parseFloat(p.profitMargin !== undefined ? p.profitMargin : 30);
            const sellingPrice = parseFloat(p.sellingPrice || (costPrice * 1.30).toFixed(2));
            const isFlash = profitMargin < 30;

            return {
                id: "gk-prod-" + (p.id || idx + 1000),
                title: p.nameAR || p.nameEN || p.title,
                nameEN: p.nameEN || p.title,
                sku: p.sku || ("GK-" + (idx + 1000)),
                costPrice: costPrice,
                profitMargin: profitMargin,
                price: sellingPrice,
                originalPrice: sellingPrice,
                regular_price: sellingPrice,
                isSale: isFlash,
                isFlashSale: isFlash,
                stock: Math.floor(10 + (idx % 30)),
                category: p.category || 'عام',
                spec: p.specAR || p.specEN || '',
                image: p.image || 'assets/products/img_p1_1.jpeg',
                source: p.source || 'كتالوج المورد',
                description: p.specAR || p.title || ''
            };
        });
    }
    return [];
}

const INITIAL_DEMO_ORDERS = [
    {
        id: "GK-1094",
        customer: {
            name: "أحمد محمود العبد",
            phone: "01098765432",
            email: "ahmed.abdel@gmail.com",
            address: "شارع 9، المعادي، القاهرة",
            city: "القاهرة"
        },
        items: [
            { name: "علبة مونة كبيرة فوميه غطاء سحب ٢.٧ لتر", qty: 2, price: 3.25 },
            { name: "طقم ٣ مراطبين مربع فوميه غطاء سيليكون", qty: 1, price: 3.90 }
        ],
        total: 10.40,
        payment_method: "الدفع عند الاستلام كاش فقط (COD)",
        status: "pending",
        status_label: "لم يتم التعليق / معلق",
        date: "2026-07-27 14:20"
    }
];

class WooCommerceStoreManager {
    constructor() {
        this.initStorage();
    }

    initStorage() {
        // Clear all legacy cache keys from user browser
        localStorage.removeItem('woodash_products');
        localStorage.removeItem('woodash_products_v2');
        localStorage.removeItem('woodash_products_v3');
        localStorage.removeItem('woodash_products_clean_v4');
        
        const seedProducts = getGlobalKitchenSeedProducts();
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(seedProducts));
        if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_DEMO_ORDERS));
        }
    }

    getProducts() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
            if (stored && stored.length > 0) return stored;
            return getGlobalKitchenSeedProducts();
        } catch(e) {
            return getGlobalKitchenSeedProducts();
        }
    }

    saveProducts(products) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }

    clearAllProducts() {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    }

    addProduct(productData) {
        const products = this.getProducts();
        const costPrice = parseFloat(productData.costPrice || productData.price || 2.00);
        const profitMargin = parseFloat(productData.profitMargin !== undefined ? productData.profitMargin : 30);
        const sellingPrice = parseFloat((costPrice + (costPrice * (profitMargin / 100))).toFixed(2));
        const stdPrice30 = parseFloat((costPrice * 1.30).toFixed(2));

        const isFlash = profitMargin < 30;

        const newProduct = {
            id: 'gk-prod-' + Date.now(),
            title: productData.title,
            sku: productData.sku || 'GK-SKU-' + Math.floor(1000 + Math.random() * 9000),
            costPrice: costPrice,
            profitMargin: profitMargin,
            price: sellingPrice,
            originalPrice: stdPrice30,
            regular_price: stdPrice30,
            isSale: isFlash,
            isFlashSale: isFlash,
            stock: parseInt(productData.stock) || 15,
            category: productData.category || 'عام',
            spec: productData.spec || '',
            image: productData.image || 'assets/products/img_p1_1.jpeg',
            source: productData.source || 'إضافة لوحة التحكم',
            description: productData.description || ''
        };
        products.unshift(newProduct);
        this.saveProducts(products);
        return newProduct;
    }

    updateProduct(productId, updatedFields) {
        let products = this.getProducts();
        products = products.map(p => {
            if (p.id === productId) {
                const merged = { ...p, ...updatedFields };
                const costPrice = parseFloat(merged.costPrice || merged.price || 1.00);
                const profitMargin = parseFloat(merged.profitMargin !== undefined ? merged.profitMargin : 30);
                const sellingPrice = parseFloat((costPrice + (costPrice * (profitMargin / 100))).toFixed(2));
                const stdPrice30 = parseFloat((costPrice * 1.30).toFixed(2));

                const isFlash = profitMargin < 30;

                return {
                    ...merged,
                    costPrice: costPrice,
                    profitMargin: profitMargin,
                    price: sellingPrice,
                    originalPrice: stdPrice30,
                    regular_price: stdPrice30,
                    isSale: isFlash,
                    isFlashSale: isFlash
                };
            }
            return p;
        });
        this.saveProducts(products);
    }

    deleteProduct(productId) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== productId);
        this.saveProducts(products);
    }

    getOrders() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || INITIAL_DEMO_ORDERS;
        } catch(e) {
            return INITIAL_DEMO_ORDERS;
        }
    }

    saveOrders(orders) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }

    updateOrderStatus(orderId, newStatus) {
        let orders = this.getOrders();
        orders = orders.map(order => {
            if (order.id === orderId) {
                let status_label = "";
                switch(newStatus) {
                    case 'pending': status_label = 'لم يتم التعليق / معلق'; break;
                    case 'processing': status_label = 'قيد المعالجة والتجهيز'; break;
                    case 'delivered': status_label = 'تم التسليم بنجاح'; break;
                    case 'undelivered': status_label = 'لم يتم التسليم / مرتجع'; break;
                }
                return { ...order, status: newStatus, status_label };
            }
            return order;
        });
        this.saveOrders(orders);
    }

    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
                store_url: 'index.html',
                consumer_key: 'ck_globalkitchen_live_key',
                consumer_secret: 'cs_globalkitchen_live_secret',
                is_connected: true
            };
        } catch(e) {
            return { store_url: 'index.html', consumer_key: '', consumer_secret: '', is_connected: true };
        }
    }

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
}

window.wcStore = new WooCommerceStoreManager();
