/* ==========================================================================
   CHECKOUT MANAGER & FORMS VALIDATOR (Vanilla JS Module)
   ========================================================================== */

const CheckoutManager = {
  activePaymentMethod: 'card',

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Bind payment card selection clicks
    const paymentCards = document.querySelectorAll('.payment-card');
    paymentCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const method = card.getAttribute('data-method');
        this.setPaymentMethod(method);
      });
    });

    // Bind Place Order button submission
    const form = document.getElementById('checkout-billing-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitOrder();
      });
    }
  },

  // Highlight active payment option card
  setPaymentMethod(method) {
    this.activePaymentMethod = method;
    const cards = document.querySelectorAll('.payment-card');
    cards.forEach(card => {
      card.classList.remove('active');
      const radio = card.querySelector('.payment-radio');
      if (radio) radio.checked = false;

      if (card.getAttribute('data-method') === method) {
        card.classList.add('active');
        if (radio) radio.checked = true;
      }
    });
  },

  // Open Checkout Modal dialog
  openCheckout() {
    const modal = document.getElementById('checkout-modal-overlay');
    if (!modal) return;

    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';

    // Verify cart has items
    if (window.CartManager.items.length === 0) {
      window.App.showToast(window.TRANSLATIONS[currentLang].cart_empty, 'error');
      return;
    }

    // Populate order summary in checkout modal
    this.populateOrderSummary();

    // Close sliding cart drawer first
    window.App.closeCart();

    // Show modal overlay
    modal.classList.add('active');
  },

  // Close Checkout Modal dialog
  closeCheckout() {
    const modal = document.getElementById('checkout-modal-overlay');
    if (modal) modal.classList.remove('active');
  },

  // Renders small summary table of cart items inside the checkout modal
  populateOrderSummary() {
    const container = document.getElementById('checkout-summary-items');
    if (!container) return;

    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    let summaryHTML = '';

    window.CartManager.items.forEach(item => {
      const displayName = currentLang === 'ar' ? item.nameAR : item.nameEN;
      summaryHTML += `
        <div class="summary-item-row">
          <span class="summary-item-name" title="${displayName}">${displayName} x ${item.quantity}</span>
          <span class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `;
    });
    container.innerHTML = summaryHTML;

    // Totals calculations
    const totals = window.CartManager.getTotals();
    const chkSubtotal = document.getElementById('chk-subtotal-val');
    if (chkSubtotal) chkSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;

    const chkTotal = document.getElementById('chk-grand-val');
    if (chkTotal) chkTotal.textContent = `$${totals.subtotal.toFixed(2)}`;
  },

  // Simulated validation and order completion
  submitOrder() {
    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    
    // Fetch input values for simple validation
    const fname = document.getElementById('bill-fname').value.trim();
    const lname = document.getElementById('bill-lname').value.trim();
    const email = document.getElementById('bill-email').value.trim();
    const phone = document.getElementById('bill-phone').value.trim();
    const address = document.getElementById('bill-address').value.trim();
    const city = document.getElementById('bill-city').value.trim();

    if (!fname || !lname || !email || !phone || !address || !city) {
      window.App.showToast(window.TRANSLATIONS[currentLang].required_error, 'error');
      return;
    }

    // Propose confirmation success screen view
    const body = document.getElementById('checkout-modal-body-content');
    if (!body) return;

    // Show loading spinner in the place order button
    const placeBtn = document.getElementById('place-order-btn-submit');
    if (placeBtn) {
      placeBtn.disabled = true;
      placeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
    }

    // Save order into woodash_orders for WooCommerce Dashboard sync
    const orderItems = window.CartManager.items.map(item => ({
      name: item.nameAR || item.nameEN,
      qty: item.quantity,
      price: item.price
    }));
    const totalAmount = window.CartManager.getTotals().subtotal;

    const newDashboardOrder = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      customer: {
        name: `${fname} ${lname}`,
        phone: phone,
        email: email,
        address: address,
        city: city
      },
      items: orderItems,
      total: totalAmount,
      payment_method: this.activePaymentMethod === 'card' ? 'بطاقة ائتمان (Credit Card)' : 'الدفع عند الاستلام (COD)',
      status: 'pending', // معلق / لم يتم التعليق
      status_label: 'لم يتم التعليق / معلق',
      date: new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
    };

    try {
      const existingOrders = JSON.parse(localStorage.getItem('woodash_orders')) || [];
      existingOrders.unshift(newDashboardOrder);
      localStorage.setItem('woodash_orders', JSON.stringify(existingOrders));

      if (window.supabaseManager) {
        window.supabaseManager.insertOrder(newDashboardOrder);
      }
    } catch(e) {
      console.error("Order sync error:", e);
    }

    // Simulate server response delay of 1.5 seconds
    setTimeout(() => {
      // Clear Cart state
      window.CartManager.clearCart();

      // Show Order Success panel inside modal
      body.innerHTML = `
        <div class="checkout-success-view">
          <div class="success-icon-wrapper">
            <i class="fa-solid fa-check"></i>
          </div>
          <h3 class="success-title" data-i18n="success_title">${window.TRANSLATIONS[currentLang].success_title}</h3>
          <p class="success-desc" data-i18n="success_desc">${window.TRANSLATIONS[currentLang].success_desc}</p>
          <div class="success-actions">
            <button class="success-btn success-btn-primary" onclick="CheckoutManager.completeAndClose()" data-i18n="success_home">
              ${window.TRANSLATIONS[currentLang].success_home}
            </button>
            <button class="success-btn success-btn-secondary" onclick="window.print()" data-i18n="success_invoice">
              <i class="fa-solid fa-print"></i> ${window.TRANSLATIONS[currentLang].success_invoice}
            </button>
          </div>
        </div>
      `;

      // Hide close button in modal header
      const headerCloseBtn = document.getElementById('checkout-modal-header-close');
      if (headerCloseBtn) headerCloseBtn.style.display = 'none';
      
    }, 1500);
  },

  // Refresh page or return to initial UI state after success button click
  completeAndClose() {
    this.closeCheckout();
    // Reload page to reset forms and go back to home page
    window.location.reload();
  }
};

// Export logic
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { CheckoutManager };
} else {
  window.CheckoutManager = CheckoutManager;
}
