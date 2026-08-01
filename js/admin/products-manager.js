/**
 * Products Manager Module - USD & Explicit Profit Margin % Layer
 * Flash Sale 🔥 Triggered ONLY when Profit Margin < 30%
 */

class ProductsManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.initListeners();
    }

    initListeners() {
        const searchInput = document.getElementById('products-search-input');
        const catFilter = document.getElementById('products-category-filter');
        const stockFilter = document.getElementById('products-stock-filter');
        const form = document.getElementById('product-form');

        if (searchInput) searchInput.addEventListener('input', () => this.renderTable());
        if (catFilter) catFilter.addEventListener('change', () => this.renderTable());
        if (stockFilter) stockFilter.addEventListener('change', () => this.renderTable());

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveProduct();
            });
        }
    }

    renderTable() {
        const tableBody = document.getElementById('products-list-table-body');
        const catFilter = document.getElementById('products-category-filter');
        if (!tableBody) return;

        let products = window.wcStore ? window.wcStore.getProducts() : [];

        if (catFilter) {
            const currentSelected = catFilter.value;
            const categories = Array.from(new Set(products.map(p => p.category || 'عام')));
            catFilter.innerHTML = '<option value="all">كل الفئات</option>' + 
                categories.map(c => `<option value="${c}" ${c === currentSelected ? 'selected' : ''}>${c}</option>`).join('');
        }

        const query = (document.getElementById('products-search-input')?.value || '').toLowerCase();
        if (query) {
            products = products.filter(p => 
                p.title.toLowerCase().includes(query) || 
                p.sku.toLowerCase().includes(query) || 
                (p.category && p.category.toLowerCase().includes(query))
            );
        }

        const selectedCat = catFilter?.value;
        if (selectedCat && selectedCat !== 'all') {
            products = products.filter(p => p.category === selectedCat);
        }

        const stockState = document.getElementById('products-stock-filter')?.value;
        if (stockState && stockState !== 'all') {
            if (stockState === 'instock') products = products.filter(p => p.stock > 5);
            else if (stockState === 'lowstock') products = products.filter(p => p.stock > 0 && p.stock <= 5);
            else if (stockState === 'outofstock') products = products.filter(p => p.stock === 0);
        }

        const sidebarCount = document.getElementById('sidebar-product-count');
        const statProductCount = document.getElementById('stat-total-products');
        if (sidebarCount) sidebarCount.textContent = products.length;
        if (statProductCount) statProductCount.textContent = products.length;

        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding: 40px; color:var(--text-muted);">
                        <i data-lucide="package-search" style="width:48px; height:48px; margin-bottom:12px;"></i>
                        <p>لا توجد منتجات مطابقة للبحث!</p>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        tableBody.innerHTML = products.map(p => {
            let stockBadge = `<span class="badge badge-success">متوفر (${p.stock})</span>`;
            if (p.stock === 0) stockBadge = `<span class="badge badge-danger">نفد من المخزون</span>`;
            else if (p.stock <= 5) stockBadge = `<span class="badge badge-warning">مخزون منخفض (${p.stock})</span>`;

            const margin = p.profitMargin !== undefined ? p.profitMargin : 30;
            const cost = p.costPrice || (p.price / (1 + margin / 100));
            const sellingPrice = p.price || (cost * (1 + margin / 100));

            const isFlashSale = margin < 30;

            let statusTag = '';
            if (isFlashSale) {
                statusTag = `<span class="badge badge-danger" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; font-size:0.75rem; font-weight:800;">🔥 Flash Sale (${margin}%)</span>`;
            } else {
                statusTag = `<span class="badge badge-success" style="font-size:0.75rem; font-weight:700;">30% ربح قياسي</span>`;
            }

            return `
                <tr>
                    <td>
                        <img src="${p.image}" class="product-img-thumb" alt="${p.title}" onerror="this.src='assets/products/img_p1_1.jpeg'">
                    </td>
                    <td>
                        <strong style="display:block; font-size:0.95rem; color:var(--text-main);">${p.title} ${statusTag}</strong>
                        <small style="color:var(--text-secondary);">${p.spec ? 'السعة: ' + p.spec : ''}</small>
                    </td>
                    <td><code>${p.sku}</code></td>
                    <td><span class="badge badge-primary">${p.category || 'عام'}</span></td>
                    
                    <!-- Cost Price -->
                    <td>
                        <div style="display:flex; align-items:center; gap:2px;">
                            <span style="color:var(--text-muted); font-size:0.85rem;">$</span>
                            <input type="number" step="0.01" value="${Number(cost).toFixed(2)}" class="custom-input" style="width:75px; padding:3px 6px; font-weight:700; color:var(--text-main);" onchange="window.productsManager.quickUpdateCostPrice('${p.id}', this.value)">
                        </div>
                    </td>

                    <!-- Profit Margin % -->
                    <td>
                        <div style="display:flex; align-items:center; gap:2px;">
                            <input type="number" step="1" value="${margin}" class="custom-input" style="width:60px; padding:3px 6px; font-weight:800; text-align:center; ${isFlashSale ? 'color:#b91c1c; border-color:#fca5a5; background:#fff5f5;' : 'color:#047857;'}" onchange="window.productsManager.quickUpdateProfitMargin('${p.id}', this.value)">
                            <span style="font-weight:800; font-size:0.85rem;">%</span>
                        </div>
                    </td>

                    <!-- Store Selling Price -->
                    <td>
                        <div style="display:flex; align-items:center; gap:2px;">
                            <span style="color:var(--success); font-weight:900; font-size:1.05rem;">$</span>
                            <strong style="font-size:1.05rem; font-weight:900; color:${isFlashSale ? '#b91c1c' : 'var(--success-text)'};">${Number(sellingPrice).toFixed(2)}</strong>
                        </div>
                    </td>

                    <td>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <input type="number" value="${p.stock}" class="custom-input" style="width:60px; padding:3px 6px; font-weight:700; text-align:center;" onchange="window.productsManager.quickUpdateStock('${p.id}', this.value)">
                            ${stockBadge}
                        </div>
                    </td>

                    <td>
                        <div class="button-group">
                            <button class="btn btn-secondary btn-sm" onclick="window.productsManager.openEditModal('${p.id}')" title="تعديل تفصيلي كامل">
                                <i data-lucide="edit-3"></i> تعديل
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="window.productsManager.deleteProduct('${p.id}')" title="حذف المنتج">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    }

    quickUpdateCostPrice(productId, newCost) {
        const cost = parseFloat(newCost) || 0;
        const products = window.wcStore ? window.wcStore.getProducts() : [];
        const p = products.find(item => item.id === productId);
        if (p) {
            const margin = p.profitMargin !== undefined ? p.profitMargin : 30;
            window.wcStore.updateProduct(productId, {
                costPrice: cost,
                profitMargin: margin
            });
        }
        this.renderTable();
        if (window.analyticsManager) window.analyticsManager.updateMetrics();
    }

    quickUpdateProfitMargin(productId, newMargin) {
        const margin = parseFloat(newMargin) !== undefined ? parseFloat(newMargin) : 30;
        const products = window.wcStore ? window.wcStore.getProducts() : [];
        const p = products.find(item => item.id === productId);
        if (p) {
            const cost = p.costPrice || (p.price / 1.30);
            window.wcStore.updateProduct(productId, {
                costPrice: cost,
                profitMargin: margin
            });
        }
        this.renderTable();
        if (window.analyticsManager) window.analyticsManager.updateMetrics();
    }

    quickUpdateStock(productId, newStock) {
        if (window.wcStore) window.wcStore.updateProduct(productId, { stock: parseInt(newStock) || 0 });
        this.renderTable();
    }

    openAddModal() {
        document.getElementById('product-modal-title').textContent = "إضافة منتج جديد لمتجر جلوبال كيتشن (نسبة الربح القياسية 30%)";
        document.getElementById('pm-product-id').value = "";
        document.getElementById('pm-title').value = "";
        document.getElementById('pm-sku').value = "GK-" + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('pm-cost-price').value = "10.00";
        document.getElementById('pm-margin-percent').value = "30";
        document.getElementById('pm-category').value = "منظمات ومؤونة";
        document.getElementById('pm-stock').value = "15";
        document.getElementById('pm-stock-status').value = "instock";
        document.getElementById('pm-spec').value = "1.5 L";
        document.getElementById('pm-image').value = "assets/products/img_p1_1.jpeg";
        document.getElementById('pm-img-preview').src = "assets/products/img_p1_1.jpeg";
        document.getElementById('pm-description').value = "";

        document.getElementById('product-modal').classList.remove('hidden');
    }

    openEditModal(productId) {
        const products = window.wcStore ? window.wcStore.getProducts() : [];
        const p = products.find(item => item.id === productId);
        if (!p) return;

        const margin = p.profitMargin !== undefined ? p.profitMargin : 30;
        const cost = p.costPrice || (p.price / 1.30);

        document.getElementById('product-modal-title').textContent = `تعديل تفاصيل المنتج (${p.title})`;
        document.getElementById('pm-product-id').value = p.id;
        document.getElementById('pm-title').value = p.title;
        document.getElementById('pm-sku').value = p.sku;
        document.getElementById('pm-cost-price').value = Number(cost).toFixed(2);
        document.getElementById('pm-margin-percent').value = margin;
        document.getElementById('pm-category').value = p.category || 'عام';
        document.getElementById('pm-stock').value = p.stock;
        document.getElementById('pm-stock-status').value = p.stock === 0 ? 'outofstock' : (p.stock <= 5 ? 'lowstock' : 'instock');
        document.getElementById('pm-spec').value = p.spec || '';
        document.getElementById('pm-image').value = p.image || '';
        document.getElementById('pm-img-preview').src = p.image || '';
        document.getElementById('pm-description').value = p.description || '';

        document.getElementById('product-modal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('product-modal').classList.add('hidden');
    }

    handleSaveProduct() {
        const id = document.getElementById('pm-product-id').value;
        const costPrice = parseFloat(document.getElementById('pm-cost-price').value) || 0;
        const marginPercent = parseFloat(document.getElementById('pm-margin-percent').value) || 30;

        const data = {
            title: document.getElementById('pm-title').value,
            sku: document.getElementById('pm-sku').value,
            costPrice: costPrice,
            profitMargin: marginPercent,
            category: document.getElementById('pm-category').value,
            stock: parseInt(document.getElementById('pm-stock').value),
            spec: document.getElementById('pm-spec').value,
            image: document.getElementById('pm-image').value,
            description: document.getElementById('pm-description').value
        };

        if (window.wcStore) {
            if (id) {
                window.wcStore.updateProduct(id, data);
            } else {
                window.wcStore.addProduct(data);
            }
        }

        this.closeModal();
        this.renderTable();
        if (window.analyticsManager) window.analyticsManager.updateMetrics();
    }

    deleteProduct(productId) {
        if (confirm("هل أنت تأكد من رغبتك في حذف هذا المنتج من الكتالوج والمتجر؟")) {
            if (window.wcStore) window.wcStore.deleteProduct(productId);
            this.renderTable();
            if (window.analyticsManager) window.analyticsManager.updateMetrics();
        }
    }
}

window.productsManager = new ProductsManager();

function openAddProductModal() {
    window.productsManager.openAddModal();
}
function closeProductModal() {
    window.productsManager.closeModal();
}

window.openAddProductModal = openAddProductModal;
window.closeProductModal = closeProductModal;
