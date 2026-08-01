/* ==========================================================================
   CART STATE MANAGER & SIDEBAR RENDERER WITH PRODUCT GRID SYNC
   ========================================================================== */

const CartManager = {
  items: [],
  FIXED_SHIPPING_FEE: 4.00, // Fixed $4.00 Flat Shipping Rate for Lebanon

  // Load cart items from local storage
  init() {
    const savedCart = localStorage.getItem('global_kitchen_cart');
    if (savedCart) {
      try {
        this.items = JSON.parse(savedCart);
      } catch (e) {
        this.items = [];
      }
    }
    this.updateUI();
  },

  // Save cart to local storage
  save() {
    localStorage.setItem('global_kitchen_cart', JSON.stringify(this.items));
  },

  // Add a product to the cart
  addItem(productId) {
    const product = window.PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingItem = this.items.find(item => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        nameEN: product.nameEN,
        nameAR: product.nameAR,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }

    this.save();
    this.updateUI();
    
    // Show toast message
    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    window.App.showToast(window.TRANSLATIONS[currentLang].cart_item_added, 'success');
  },

  // Remove a product entirely from the cart
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
    this.updateUI();

    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    window.App.showToast(window.TRANSLATIONS[currentLang].cart_item_removed, 'info');
  },

  // Change quantity of an item (+1 or -1)
  changeQuantity(productId, delta) {
    const item = this.items.find(item => item.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(productId);
    } else {
      this.save();
      this.updateUI();
    }
  },

  // Clear all items from cart
  clearCart() {
    this.items = [];
    this.save();
    this.updateUI();
  },

  // Calculate subtotal, fixed shipping ($4.00 for Lebanon), and grand total
  getTotals() {
    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = this.items.length > 0 ? this.FIXED_SHIPPING_FEE : 0.00;
    const grandTotal = subtotal > 0 ? subtotal + shipping : 0.00;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      count: this.items.reduce((sum, item) => sum + item.quantity, 0)
    };
  },

  // Update navbar cart count badge and sliding drawer UI
  updateUI() {
    const totals = this.getTotals();
    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    
    // Update navbar count
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      badge.textContent = totals.count;
      badge.style.display = totals.count > 0 ? 'flex' : 'none';
    }

    // Render cart items list inside the drawer
    const cartBody = document.getElementById('cart-items-container');
    if (!cartBody) return;

    if (this.items.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <i class="fa-solid fa-basket-shopping"></i>
          <p data-i18n="cart_empty">${window.TRANSLATIONS[currentLang].cart_empty}</p>
          <button class="shop-now-btn" onclick="window.App.closeCart()" data-i18n="continue_shopping">${window.TRANSLATIONS[currentLang].continue_shopping}</button>
        </div>
      `;
      // Disable checkout button if cart is empty
      const chkBtn = document.getElementById('drawer-checkout-btn');
      if (chkBtn) chkBtn.style.display = 'none';
    } else {
      let itemsHTML = '';
      this.items.forEach(item => {
        const displayName = currentLang === 'ar' ? item.nameAR : item.nameEN;
        itemsHTML += `
          <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${displayName}" class="cart-item-img">
            <div class="cart-item-details">
              <div class="cart-item-name">${displayName}</div>
              <div class="cart-item-price">$${item.price.toFixed(2)}</div>
              <div class="cart-item-actions">
                <div class="quantity-controls">
                  <button class="qty-btn" onclick="CartManager.changeQuantity(${item.id}, -1)">-</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button class="qty-btn" onclick="CartManager.changeQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="item-remove-btn" onclick="CartManager.removeItem(${item.id})">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });
      cartBody.innerHTML = itemsHTML;

      // Show checkout button
      const chkBtn = document.getElementById('drawer-checkout-btn');
      if (chkBtn) chkBtn.style.display = 'flex';
    }

    // Update prices on the bottom drawer card
    const subtotalLabel = document.getElementById('cart-subtotal-val');
    if (subtotalLabel) {
      subtotalLabel.textContent = `$${totals.subtotal.toFixed(2)}`;
    }
    const shippingLabel = document.getElementById('cart-shipping-val');
    if (shippingLabel) {
      shippingLabel.textContent = `$${totals.shipping.toFixed(2)}`;
    }
    const grandLabel = document.getElementById('cart-grand-val');
    if (grandLabel) {
      grandLabel.textContent = `$${totals.grandTotal.toFixed(2)} USD`;
    }

    // Dynamic grid synchronization
    if (window.FilterManager && typeof window.FilterManager.filterAndRender === 'function') {
      window.FilterManager.filterAndRender();
    }
  }
};

// Export logic
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { CartManager };
} else {
  window.CartManager = CartManager;
}
