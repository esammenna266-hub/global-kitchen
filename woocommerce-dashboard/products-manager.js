/**
 * Products Manager Module - USD & Advanced Edit Controls
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

        let products = window.wcStore.getProducts();

        // Update categories dropdown dynamically
        if (catFilter) {
            const currentSelected = catFilter.value;
            const categories = Array.from(new Set(products.map(p => p.category || 'عام')));
            catFilter.innerHTML = '<option value="all">كل الفئات</option>' + 
                categories.map(c => `<option value="${c}" ${c === currentSelected ? 'selected' : ''}>${c}</option>`).join('');
        }

        // Apply Search Filter
        const query = (document.getElementById('products-search-input')?.value || '').toLowerCase();
        if (query) {
            products = products.filter(p => 
                p.title.toLowerCase().includes(query) || 
                p.sku.toLowerCase().includes(query) || 
                (p.category && p.category.toLowerCase().includes(query))
            );
        }

        // Apply Category Filter
        const selectedCat = catFilter?.value;
        if (selectedCat && selectedCat !== 'all') {
            products = products.filter(p => p.category === selectedCat);
        }

        // Apply Stock Filter
        const stockState = document.getElementById('products-stock-filter')?.value;
        if (stockState && stockState !== 'all') {
            if (stockState === 'instock') products = products.filter(p => p.stock > 5);
            else if (stockState === 'lowstock') products = products.filter(p => p.stock > 0 && p.stock <= 5);
            else if (stockState === 'outofstock') products = products.filter(p => p.stock === 0);
        }

        // Update Total Badges
        const sidebarCount = document.getElementById('sidebar-product-count');
        const statProductCount = document.getElementById('stat-total-products');
        if (sidebarCount) sidebarCount.textContent = products.length;
        if (statProductCount) statProductCount.textContent = products.length;

        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding: 40px; color:var(--text-muted);">
                        <i data-lucide="package-search" style="width:48px; height:48px; margin-bottom:12px;"></i>
                        <p>لا توجد منتجات مطابقة للبحث!</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        tableBody.innerHTML = products.map(p => {
            let stockBadge = `<span class="badge badge-success">متوفر (${p.stock})</span>`;
            if (p.stock === 0) stockBadge = `<span class="badge badge-danger">نفد من المخزون</span>`;
            else if (p.stock <= 5) stockBadge = `<span class="badge badge-warning">مخزون منخفض (${p.stock})</span>`;

            const priceUSD = `$${Number(p.price).toFixed(2)}`;

            return `
                <tr>
                    <td>
                        <img src="${p.image}" class="product-img-thumb" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=500&q=80'">
                    </td>
                    <td>
                        <strong style="display:block; font-size:0.95rem; color:var(--text-main);">${p.title}</strong>
                        <small style="color:var(--text-secondary);">${p.spec ? 'السعة: ' + p.spec : ''}</small>
                    </td>
                    <td><code>${p.sku}</code></td>
                    <td><span class="badge badge-primary">${p.category || 'عام'}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="color:var(--success); font-weight:800; font-size:1.05rem;">$</span>
                            <input type="number" step="0.01" value="${Number(p.price).toFixed(2)}" class="custom-input" style="width:85px; padding:4px 8px; font-weight:800; color:var(--success-text);" onchange="window.productsManager.quickUpdatePrice('${p.id}', this.value)">
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <input type="number" value="${p.stock}" class="custom-input" style="width:65px; padding:4px 6px; font-weight:700; text-align:center;" onchange="window.productsManager.quickUpdateStock('${p.id}', this.value)">
                            ${stockBadge}
                        </div>
                    </td>
                    <td><small style="color:var(--text-muted);">${p.source || 'جلوبال كيتشن'}</small></td>
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

        lucide.createIcons();
    }

    quickUpdatePrice(productId, newPrice) {
        window.wcStore.updateProduct(productId, { price: parseFloat(newPrice) || 0 });
        if (window.analyticsManager) window.analyticsManager.updateMetrics();
    }

    quickUpdateStock(productId, newStock) {
        window.wcStore.updateProduct(productId, { stock: parseInt(newStock) || 0 });
        this.renderTable();
    }

    openAddModal() {
        document.getElementById('product-modal-title').textContent = "إضافة منتج جديد لمتجر جلوبال كيتشن";
        document.getElementById('pm-product-id').value = "";
        document.getElementById('pm-title').value = "";
        document.getElementById('pm-sku').value = "GK-" + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('pm-price').value = "2.50";
        document.getElementById('pm-regular-price').value = "3.00";
        document.getElementById('pm-category').value = "منظمات ومؤونة";
        document.getElementById('pm-stock').value = "15";
        document.getElementById('pm-stock-status').value = "instock";
        document.getElementById('pm-spec').value = "1.5 L";
        document.getElementById('pm-image').value = "http://127.0.0.1:8085/global-kitchen/assets/products/img_p1_1.jpeg";
        document.getElementById('pm-img-preview').src = "http://127.0.0.1:8085/global-kitchen/assets/products/img_p1_1.jpeg";
        document.getElementById('pm-description').value = "";

        document.getElementById('product-modal').classList.remove('hidden');
    }

    openEditModal(productId) {
        const products = window.wcStore.getProducts();
        const p = products.find(item => item.id === productId);
        if (!p) return;

        document.getElementById('product-modal-title').textContent = `تعديل تفاصيل المنتج (${p.title})`;
        document.getElementById('pm-product-id').value = p.id;
        document.getElementById('pm-title').value = p.title;
        document.getElementById('pm-sku').value = p.sku;
        document.getElementById('pm-price').value = p.price;
        document.getElementById('pm-regular-price').value = p.regular_price || p.price;
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
        const data = {
            title: document.getElementById('pm-title').value,
            sku: document.getElementById('pm-sku').value,
            price: parseFloat(document.getElementById('pm-price').value),
            regular_price: parseFloat(document.getElementById('pm-regular-price').value),
            category: document.getElementById('pm-category').value,
            stock: parseInt(document.getElementById('pm-stock').value),
            spec: document.getElementById('pm-spec').value,
            image: document.getElementById('pm-image').value,
            description: document.getElementById('pm-description').value
        };

        if (id) {
            window.wcStore.updateProduct(id, data);
        } else {
            window.wcStore.addProduct(data);
        }

        this.closeModal();
        this.renderTable();
        if (window.analyticsManager) window.analyticsManager.updateMetrics();
    }

    deleteProduct(productId) {
        if (confirm("هل أنت تأكد من رغبتك في حذف هذا المنتج من الكتالوج والمتجر؟")) {
            window.wcStore.deleteProduct(productId);
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
