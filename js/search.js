/* ==========================================================================
   DYNAMIC CATEGORY SECTIONS & REAL-TIME SEARCH ENGINE
   ========================================================================== */

const CATEGORY_META = {
  storage: { ar: 'المنظمات وحافظات التخزين', en: 'Smart Storage & Organizers', icon: 'fa-boxes-stacked' },
  cookware: { ar: 'مستلزمات الطهي والطبخ', en: 'Cookware & Cooking Supplies', icon: 'fa-fire-burner' },
  utensils: { ar: 'مستلزمات الطهي والطبخ', en: 'Cookware & Cooking Supplies', icon: 'fa-kitchen-set' },
  tableware: { ar: 'التقديم والسفرة الفاخرة', en: 'Luxury Tableware & Dining', icon: 'fa-utensils' }
};

function getCategoryInfo(catKey, lang) {
  if (CATEGORY_META[catKey]) {
    return {
      label: lang === 'ar' ? CATEGORY_META[catKey].ar : CATEGORY_META[catKey].en,
      icon: CATEGORY_META[catKey].icon
    };
  }
  // Dynamic fallback for newly uploaded categories
  return {
    label: catKey,
    icon: 'fa-layer-group'
  };
}

const FilterManager = {
  activeCategory: 'all',
  searchQuery: '',

  init() {
    const searchInput = document.getElementById('search-input-box');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.filterAndRender();
      });
    }

    this.renderCategoryTabs();
    this.filterAndRender();
  },

  renderCategoryTabs() {
    const tabContainer = document.getElementById('category-tabs-row');
    if (!tabContainer) return;

    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    const catalogSource = (window.wcStore && typeof window.wcStore.getProducts === 'function') 
      ? window.wcStore.getProducts() 
      : (window.PRODUCTS || []);

    // Dynamically extract unique categories present in catalog
    const rawCategories = Array.from(new Set(catalogSource.map(p => p.category || 'عام'))).filter(c => c !== 'appliances');
    
    // Group utensils & cookware into one clean key for tab display
    const uniqueCatKeys = [];
    rawCategories.forEach(c => {
      let mappedKey = c;
      if (c === 'utensils') mappedKey = 'cookware';
      if (!uniqueCatKeys.includes(mappedKey)) uniqueCatKeys.push(mappedKey);
    });

    const categoryList = [
      { id: 'all', label: currentLang === 'ar' ? 'جميع الأقسام' : 'All Categories', icon: 'fa-border-all' }
    ];

    uniqueCatKeys.forEach(catKey => {
      const info = getCategoryInfo(catKey, currentLang);
      categoryList.push({ id: catKey, label: info.label, icon: info.icon });
    });

    let tabsHTML = '';
    categoryList.forEach(cat => {
      const activeClass = cat.id === this.activeCategory ? 'active' : '';
      tabsHTML += `
        <button class="category-tab ${activeClass}" data-category="${cat.id}" onclick="FilterManager.setCategory('${cat.id}')">
          <i class="fa-solid ${cat.icon}" style="margin-left: 6px;"></i>
          ${cat.label}
        </button>
      `;
    });
    tabContainer.innerHTML = tabsHTML;
  },

  setCategory(categoryId) {
    this.activeCategory = categoryId;
    
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active', 'active-red');
      if (tab.getAttribute('data-category') === categoryId) {
        tab.classList.add('active');
      }
    });

    this.filterAndRender();
  },

  renderSingleProductCard(prod, currentLang) {
    const name = currentLang === 'ar' ? (prod.nameAR || prod.title) : (prod.nameEN || prod.title);
    const spec = currentLang === 'ar' ? (prod.specAR || prod.spec || '') : (prod.specEN || prod.spec || '');
    
    const margin = prod.profitMargin !== undefined ? prod.profitMargin : 30;
    const isFlash = margin < 30 || prod.isFlashSale === true;

    let badgesHTML = '';
    if (isFlash) {
      badgesHTML += `<span class="badge badge-sale" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; font-weight: 800; border-radius: 20px; padding: 4px 10px; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);">🔥 عرض خاص</span>`;
    } else if (prod.isNew) {
      badgesHTML += `<span class="badge badge-new" data-i18n="new_badge">${window.TRANSLATIONS[currentLang]?.new_badge || 'جديد'}</span>`;
    }

    let priceHTML = `<span class="current-price" style="font-weight: 900; font-size: 1.2rem; color: #0f172a;">$${Number(prod.price).toFixed(2)}</span>`;
    if (isFlash && prod.originalPrice) {
      priceHTML += `<span class="original-price" style="text-decoration: line-through; color: #94a3b8; margin-right: 8px; font-size: 0.9rem;">$${Number(prod.originalPrice).toFixed(2)}</span>`;
    }

    let quantityInCart = 0;
    if (window.CartManager && window.CartManager.items) {
      const cartItem = window.CartManager.items.find(item => item.id === prod.id);
      if (cartItem) quantityInCart = cartItem.quantity;
    }

    const buttonHTML = `
      <div class="add-to-cart-container">
        <button class="add-to-cart-btn-wide" onclick="CartManager.addItem('${prod.id}')">
          ${window.TRANSLATIONS[currentLang]?.add_to_cart || 'إضافة للسلة'}
        </button>
        ${quantityInCart > 0 ? `<span class="cart-qty-indicator">${quantityInCart}</span>` : ''}
      </div>
    `;

    return `
      <div class="product-card" data-id="${prod.id}">
        <div class="product-image-container">
          <img src="${prod.image}" alt="${name}" class="product-image" loading="lazy" onerror="this.src='assets/products/img_p1_1.jpeg'">
          <div class="product-badges">${badgesHTML}</div>
          ${spec ? `<div class="product-spec">${spec}</div>` : ''}
        </div>
        <div class="product-info">
          <h3 class="product-name">${name}</h3>
          <div class="product-rating">
            <i class="fa-solid fa-star"></i>
            <span>${prod.rating || '4.9'} (${prod.reviewsCount || 12})</span>
          </div>
          <div class="product-bottom">
            <div class="product-price">${priceHTML}</div>
            ${buttonHTML}
          </div>
        </div>
      </div>
    `;
  },

  filterAndRender() {
    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    const mainSection = document.getElementById('explore-products');
    if (!mainSection) return;

    const catalogSource = (window.wcStore && typeof window.wcStore.getProducts === 'function') 
      ? window.wcStore.getProducts() 
      : (window.PRODUCTS || []);

    // Filter out unwanted appliances category and apply search query
    const filtered = catalogSource.filter(prod => {
      if (prod.category === 'appliances') return false;

      let matchesCategory = false;
      if (this.activeCategory === 'all') {
        matchesCategory = true;
      } else if (this.activeCategory === 'cookware') {
        matchesCategory = (prod.category === 'cookware' || prod.category === 'utensils');
      } else {
        matchesCategory = prod.category === this.activeCategory;
      }

      const titleStr = (prod.nameAR || prod.nameEN || prod.title || '').toLowerCase();
      const matchesSearch = this.searchQuery === '' || titleStr.includes(this.searchQuery);
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      mainSection.innerHTML = `
        <div class="no-results" style="text-align: center; padding: 60px 20px;">
          <i class="fa-solid fa-box-open" style="font-size: 48px; color: #cbd5e1; margin-bottom: 12px;"></i>
          <p style="font-size:1.1rem; color:#64748b;">لا توجد منتجات مطابقة للبحث!</p>
        </div>
      `;
      return;
    }

    // IF VIEWING ALL: Group products into distinct Category Blocks
    if (this.activeCategory === 'all' && this.searchQuery === '') {
      const grouped = {};
      filtered.forEach(p => {
        let catKey = p.category || 'other';
        if (catKey === 'utensils') catKey = 'cookware';
        if (!grouped[catKey]) grouped[catKey] = [];
        grouped[catKey].push(p);
      });

      let sectionsHTML = '';
      Object.keys(grouped).forEach(catKey => {
        const catProds = grouped[catKey];
        const info = getCategoryInfo(catKey, currentLang);

        sectionsHTML += `
          <div class="category-block-section" style="margin-bottom: 50px;">
            <div class="category-block-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="background: rgba(225, 29, 72, 0.1); color: var(--primary-red); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                  <i class="fa-solid ${info.icon}"></i>
                </div>
                <div>
                  <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">${info.label}</h2>
                  <small style="color: #64748b; font-size: 0.85rem;">(${catProds.length} منتج متاح)</small>
                </div>
              </div>
              <button onclick="FilterManager.setCategory('${catKey}')" style="background: none; border: 1px solid #e2e8f0; color: var(--primary-red); padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                <span>عرض الكل</span>
                <i class="fa-solid fa-arrow-left"></i>
              </button>
            </div>
            <div class="products-grid grid-cols-4">
              ${catProds.map(prod => this.renderSingleProductCard(prod, currentLang)).join('')}
            </div>
          </div>
        `;
      });

      mainSection.innerHTML = sectionsHTML;
    } else {
      // SINGLE CATEGORY OR SEARCH RESULTS VIEW
      const info = getCategoryInfo(this.activeCategory, currentLang);
      const headerTitle = this.searchQuery ? `نتائج البحث: "${this.searchQuery}"` : info.label;

      mainSection.innerHTML = `
        <div class="category-block-header" style="display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 24px;">
          <div style="background: rgba(225, 29, 72, 0.1); color: var(--primary-red); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            <i class="fa-solid ${info.icon}"></i>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">${headerTitle}</h2>
            <small style="color: #64748b; font-size: 0.85rem;">(${filtered.length} منتج)</small>
          </div>
        </div>
        <div class="products-grid grid-cols-4">
          ${filtered.map(prod => this.renderSingleProductCard(prod, currentLang)).join('')}
        </div>
      `;
    }
  }
};

// Export logic
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { FilterManager };
} else {
  window.FilterManager = FilterManager;
}
