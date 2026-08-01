/* ==========================================================================
   CATALOG FILTERING & REAL-TIME SEARCH (With Automatic Flash Sale 🔥 Detection)
   ========================================================================== */

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
    const categories = [
      { id: 'all', label: currentLang === 'ar' ? 'جميع الأقسام' : 'All Categories' },
      { id: 'flash_sale', label: currentLang === 'ar' ? '🔥 عروض محدودة (Flash Sale)' : '🔥 Flash Sales' },
      { id: 'cookware', label: currentLang === 'ar' ? 'القدور وقوالب الخبز' : 'Cookware' },
      { id: 'utensils', label: currentLang === 'ar' ? 'الأدوات والمقاشر' : 'Utensils' },
      { id: 'tableware', label: currentLang === 'ar' ? 'المائدة والأكواب' : 'Tableware' },
      { id: 'appliances', label: currentLang === 'ar' ? 'الأجهزة الكهربائية' : 'Appliances' },
      { id: 'storage', label: currentLang === 'ar' ? 'التخزين والمنظمات' : 'Smart Storage' }
    ];

    let tabsHTML = '';
    categories.forEach(cat => {
      const activeClass = cat.id === this.activeCategory ? 'active' : '';
      const specialClass = cat.id === 'flash_sale' ? 'flash-sale-tab' : '';
      tabsHTML += `
        <button class="category-tab ${activeClass} ${specialClass}" data-category="${cat.id}" onclick="FilterManager.setCategory('${cat.id}')">
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
        if (categoryId === 'all') tab.classList.add('active-red');
      }
    });

    this.filterAndRender();
  },

  filterAndRender() {
    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    const grid = document.getElementById('products-grid-row');
    if (!grid) return;

    // Fetch dynamic products from local store or data.js
    const catalogSource = (window.wcStore && typeof window.wcStore.getProducts === 'function') 
      ? window.wcStore.getProducts() 
      : (window.PRODUCTS || []);

    const filtered = catalogSource.filter(prod => {
      const isFlash = prod.isSale || prod.isFlashSale || (prod.originalPrice && prod.price < prod.originalPrice);
      
      let matchesCategory = false;
      if (this.activeCategory === 'all') {
        matchesCategory = true;
      } else if (this.activeCategory === 'flash_sale') {
        matchesCategory = isFlash;
      } else {
        matchesCategory = prod.category === this.activeCategory;
      }

      const titleStr = (prod.nameAR || prod.nameEN || prod.title || '').toLowerCase();
      const matchesSearch = this.searchQuery === '' || titleStr.includes(this.searchQuery);
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
          <i class="fa-solid fa-fire-burner" style="font-size: 48px; color: #cbd5e1; margin-bottom: 12px;"></i>
          <p data-i18n="no_results">${window.TRANSLATIONS[currentLang].no_results}</p>
        </div>
      `;
      return;
    }

    let cardsHTML = '';
    filtered.forEach(prod => {
      const name = currentLang === 'ar' ? (prod.nameAR || prod.title) : (prod.nameEN || prod.title);
      const spec = currentLang === 'ar' ? (prod.specAR || prod.spec || '') : (prod.specEN || prod.spec || '');
      
      const isFlash = prod.isSale || prod.isFlashSale || (prod.originalPrice && prod.price < prod.originalPrice);

      let badgesHTML = '';
      if (isFlash) {
        badgesHTML += `<span class="badge badge-sale badge-flash-sale-live" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; font-weight: 800; border-radius: 20px; padding: 4px 10px; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4); border: 1px solid #fca5a5;">🔥 عرض محدود | Flash Sale</span>`;
      } else if (prod.isNew) {
        badgesHTML += `<span class="badge badge-new" data-i18n="new_badge">${window.TRANSLATIONS[currentLang].new_badge}</span>`;
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

      let buttonHTML = '';
      if (quantityInCart > 0) {
        buttonHTML = `
          <div class="add-to-cart-container">
            <button class="add-to-cart-btn-wide" onclick="CartManager.addItem('${prod.id}')">
              ${window.TRANSLATIONS[currentLang].add_to_cart}
            </button>
            <span class="cart-qty-indicator">${quantityInCart}</span>
          </div>
        `;
      } else {
        buttonHTML = `
          <div class="add-to-cart-container">
            <button class="add-to-cart-btn-wide" onclick="CartManager.addItem('${prod.id}')">
              ${window.TRANSLATIONS[currentLang].add_to_cart}
            </button>
          </div>
        `;
      }

      cardsHTML += `
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
    });
    grid.innerHTML = cardsHTML;
  }
};

// Export logic
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { FilterManager };
} else {
  window.FilterManager = FilterManager;
}
