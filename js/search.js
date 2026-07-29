/* ==========================================================================
   CATALOG FILTERING & REAL-TIME SEARCH (Vanilla JS Module)
   ========================================================================== */

const FilterManager = {
  activeCategory: 'all',
  searchQuery: '',

  init() {
    // Bind search inputs
    const searchInput = document.getElementById('search-input-box');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.filterAndRender();
      });
    }

    // Render category tab filters dynamically
    this.renderCategoryTabs();
    this.filterAndRender();
  },

  // Renders category selector filters at top of listing
  renderCategoryTabs() {
    const tabContainer = document.getElementById('category-tabs-row');
    if (!tabContainer) return;

    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    const categories = [
      { id: 'all', labelKey: 'cat_all' },
      { id: 'cookware', labelKey: 'cat_cookware' },
      { id: 'utensils', labelKey: 'cat_utensils' },
      { id: 'tableware', labelKey: 'cat_tableware' },
      { id: 'appliances', labelKey: 'cat_appliances' },
      { id: 'storage', labelKey: 'cat_storage' }
    ];

    let tabsHTML = '';
    categories.forEach(cat => {
      const activeClass = cat.id === this.activeCategory ? 'active' : '';
      const redClass = (cat.id === this.activeCategory && cat.id === 'all') ? 'active-red' : '';
      tabsHTML += `
        <button class="category-tab ${activeClass} ${redClass}" data-category="${cat.id}" onclick="FilterManager.setCategory('${cat.id}')" data-i18n="${cat.labelKey}">
          ${window.TRANSLATIONS[currentLang][cat.labelKey]}
        </button>
      `;
    });
    tabContainer.innerHTML = tabsHTML;
  },

  // Updates currently selected category and triggers redraw
  setCategory(categoryId) {
    this.activeCategory = categoryId;
    
    // Highlight active tab
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active', 'active-red');
      if (tab.getAttribute('data-category') === categoryId) {
        tab.classList.add('active');
        if (categoryId === 'all') {
          tab.classList.add('active-red');
        }
      }
    });

    this.filterAndRender();
  },

  // Filters catalog list based on search queries and active categories
  filterAndRender() {
    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    const grid = document.getElementById('products-grid-row');
    if (!grid) return;

    // Filter items
    const filtered = window.PRODUCTS.filter(prod => {
      const matchesCategory = this.activeCategory === 'all' || prod.category === this.activeCategory;
      const matchesSearch = this.searchQuery === '' || 
        prod.nameEN.toLowerCase().includes(this.searchQuery) ||
        prod.nameAR.includes(this.searchQuery);
      return matchesCategory && matchesSearch;
    });

    // Render items in grid
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fa-solid fa-hourglass-empty"></i>
          <p data-i18n="no_results">${window.TRANSLATIONS[currentLang].no_results}</p>
        </div>
      `;
      return;
    }

    let cardsHTML = '';
    filtered.forEach(prod => {
      const name = currentLang === 'ar' ? prod.nameAR : prod.nameEN;
      const spec = currentLang === 'ar' ? prod.specAR : prod.specEN;
      
      // Badges
      let badgesHTML = '';
      if (prod.isNew) {
        badgesHTML += `<span class="badge badge-new" data-i18n="new_badge">${window.TRANSLATIONS[currentLang].new_badge}</span>`;
      }
      if (prod.isSale) {
        badgesHTML += `<span class="badge badge-sale" data-i18n="sale_badge">${window.TRANSLATIONS[currentLang].sale_badge}</span>`;
      }

      // Pricing layout
      let priceHTML = `<span class="current-price">$${prod.price.toFixed(2)}</span>`;
      if (prod.isSale && prod.originalPrice) {
        priceHTML += `<span class="original-price">$${prod.originalPrice.toFixed(2)}</span>`;
      }

      // Check quantity in cart
      let quantityInCart = 0;
      if (window.CartManager && window.CartManager.items) {
        const cartItem = window.CartManager.items.find(item => item.id === prod.id);
        if (cartItem) quantityInCart = cartItem.quantity;
      }

      // Wide Add to Cart Button with Quantity indicator next to it if in cart (Houzecart style)
      let buttonHTML = '';
      if (quantityInCart > 0) {
        buttonHTML = `
          <div class="add-to-cart-container">
            <button class="add-to-cart-btn-wide" onclick="CartManager.addItem(${prod.id})">
              ${window.TRANSLATIONS[currentLang].add_to_cart}
            </button>
            <span class="cart-qty-indicator">${quantityInCart}</span>
          </div>
        `;
      } else {
        buttonHTML = `
          <div class="add-to-cart-container">
            <button class="add-to-cart-btn-wide" onclick="CartManager.addItem(${prod.id})">
              ${window.TRANSLATIONS[currentLang].add_to_cart}
            </button>
          </div>
        `;
      }

      cardsHTML += `
        <div class="product-card" data-id="${prod.id}">
          <div class="product-image-container">
            <img src="${prod.image}" alt="${name}" class="product-image" loading="lazy">
            <div class="product-badges">${badgesHTML}</div>
            <div class="product-spec">${spec}</div>
          </div>
          <div class="product-info">
            <h3 class="product-name">${name}</h3>
            <div class="product-rating">
              <i class="fa-solid fa-star"></i>
              <span>${prod.rating} (${prod.reviewsCount})</span>
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
