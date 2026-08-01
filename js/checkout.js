/* ==========================================================================
   CHECKOUT MANAGER & FORMS VALIDATOR (Cash On Delivery Only + $4 Shipping Lebanon)
   ========================================================================== */

const CheckoutManager = {
  activePaymentMethod: 'cod', // COD Only

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Form submission
    const form = document.getElementById('checkout-billing-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitOrder();
      });
    }
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

  // Renders summary table of cart items & shipping ($4.00) inside checkout modal
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

    // Totals calculations ($4.00 flat rate shipping for Lebanon)
    const totals = window.CartManager.getTotals();
    const chkSubtotal = document.getElementById('chk-subtotal-val');
    if (chkSubtotal) chkSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;

    const chkShipping = document.getElementById('chk-shipping-val');
    if (chkShipping) chkShipping.textContent = `$${totals.shipping.toFixed(2)}`;

    const chkTotal = document.getElementById('chk-grand-val');
    if (chkTotal) chkTotal.textContent = `$${totals.grandTotal.toFixed(2)} USD`;
  },

  // Order completion and dispatching to Dashboard & Supabase
  submitOrder() {
    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    
    // Fetch input values
    const fname = document.getElementById('bill-fname').value.trim();
    const lname = document.getElementById('bill-lname').value.trim();
    const email = document.getElementById('bill-email').value.trim();
    const phone = document.getElementById('bill-phone').value.trim();
    const address = document.getElementById('bill-address').value.trim();
    const city = document.getElementById('bill-city').value.trim();

    if (!fname || !lname || !phone || !address || !city) {
      window.App.showToast(window.TRANSLATIONS[currentLang].required_error, 'error');
      return;
    }

    const body = document.getElementById('checkout-modal-body-content');
    if (!body) return;

    // Show loading spinner in place order button
    const placeBtn = document.getElementById('place-order-btn-submit');
    if (placeBtn) {
      placeBtn.disabled = true;
      placeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب للداشبورد...`;
    }

    const totals = window.CartManager.getTotals();
    const orderItems = window.CartManager.items.map(item => ({
      name: item.nameAR || item.nameEN,
      qty: item.quantity,
      price: item.price
    }));

    const orderId = "GK-LB-" + Math.floor(1000 + Math.random() * 9000).toString();

    const newDashboardOrder = {
      id: orderId,
      customer: {
        name: `${fname} ${lname}`,
        phone: phone,
        email: email || `${phone}@client.lb`,
        address: address,
        city: `${city} (لبنان)`
      },
      items: orderItems,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.grandTotal,
      payment_method: 'الدفع عند الاستلام كاش فقط (COD)',
      status: 'pending',
      status_label: 'لم يتم التعليق / معلق',
      date: new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
    };

    try {
      // 1. Save locally to woodash_orders
      const existingOrders = JSON.parse(localStorage.getItem('woodash_orders')) || [];
      existingOrders.unshift(newDashboardOrder);
      localStorage.setItem('woodash_orders', JSON.stringify(existingOrders));

      // 2. Broadcast via LocalStorage & Custom Events for same-origin tabs
      localStorage.setItem('woodash_last_new_order', JSON.stringify({ order: newDashboardOrder, time: Date.now() }));
      window.dispatchEvent(new CustomEvent('new_order_submitted', { detail: newDashboardOrder }));

      // 3. Save to Supabase Cloud if configured
      if (window.supabaseManager) {
        window.supabaseManager.insertOrder(newDashboardOrder);
      }
    } catch(e) {
      console.error("Order sync error:", e);
    }

    // Process order success UI after 1 second
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
          <p class="success-desc">تم تسجيل طلبك رقم <strong>#${orderId}</strong> بقيمة إجمالية <strong>$${totals.grandTotal.toFixed(2)} USD</strong> (تشمل 4$ شحن لكافة مناطق لبنان) والدفع كاش عند الاستلام.</p>
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
      
    }, 1000);
  },

  completeAndClose() {
    this.closeCheckout();
    window.location.reload();
  }
};

// Export logic
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { CheckoutManager };
} else {
  window.CheckoutManager = CheckoutManager;
}
