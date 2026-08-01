/* ==========================================================================
   CHECKOUT MANAGER & FORMS VALIDATOR (Cash On Delivery Only + $4 Shipping Lebanon)
   ========================================================================== */

const CheckoutManager = {
  activePaymentMethod: 'cod', // COD Only
  lastPlacedOrder: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const form = document.getElementById('checkout-billing-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitOrder();
      });
    }
  },

  openCheckout() {
    const modal = document.getElementById('checkout-modal-overlay');
    if (!modal) return;

    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';

    if (window.CartManager.items.length === 0) {
      window.App.showToast(window.TRANSLATIONS[currentLang].cart_empty, 'error');
      return;
    }

    this.populateOrderSummary();
    window.App.closeCart();
    modal.classList.add('active');
  },

  closeCheckout() {
    const modal = document.getElementById('checkout-modal-overlay');
    if (modal) modal.classList.remove('active');
  },

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

    const totals = window.CartManager.getTotals();
    const chkSubtotal = document.getElementById('chk-subtotal-val');
    if (chkSubtotal) chkSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;

    const chkShipping = document.getElementById('chk-shipping-val');
    if (chkShipping) chkShipping.textContent = `$${totals.shipping.toFixed(2)}`;

    const chkTotal = document.getElementById('chk-grand-val');
    if (chkTotal) chkTotal.textContent = `$${totals.grandTotal.toFixed(2)} USD`;
  },

  submitOrder() {
    const currentLang = document.body.classList.contains('rtl-lang') ? 'ar' : 'en';
    
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

    const placeBtn = document.getElementById('place-order-btn-submit');
    if (placeBtn) {
      placeBtn.disabled = true;
      placeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب...`;
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

    this.lastPlacedOrder = newDashboardOrder;

    try {
      const existingOrders = JSON.parse(localStorage.getItem('woodash_orders')) || [];
      existingOrders.unshift(newDashboardOrder);
      localStorage.setItem('woodash_orders', JSON.stringify(existingOrders));

      localStorage.setItem('woodash_last_new_order', JSON.stringify({ order: newDashboardOrder, time: Date.now() }));
      window.dispatchEvent(new CustomEvent('new_order_submitted', { detail: newDashboardOrder }));

      if (window.supabaseManager) {
        window.supabaseManager.insertOrder(newDashboardOrder);
      }
    } catch(e) {
      console.error("Order sync error:", e);
    }

    setTimeout(() => {
      window.CartManager.clearCart();

      body.innerHTML = `
        <div class="checkout-success-view" style="text-align: center; padding: 20px 10px;">
          <div class="success-icon-wrapper" style="width: 70px; height: 70px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 15px;">
            <i class="fa-solid fa-check"></i>
          </div>
          <h3 class="success-title" style="font-size: 22px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">تم إرسال طلبك بنجاح!</h3>
          <p class="success-desc" style="color: #64748b; font-size: 15px; max-width: 480px; margin: 0 auto 20px; line-height: 1.6;">
            رقم الطلب: <strong style="color: #C41E3A;">#${orderId}</strong><br>
            الإجمالي النهائي: <strong style="color: #0f172a;">$${totals.grandTotal.toFixed(2)} USD</strong> (تشمل $4.00 رسوم شحن لبنان).<br>
            طريقة الدفع: <strong>الدفع عند الاستلام كاش فقط 💵</strong>
          </p>
          <div class="success-actions" style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="success-btn success-btn-primary" onclick="CheckoutManager.completeAndClose()" style="background: #1e293b; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer;">
              العودة للرئيسية
            </button>
            <button class="success-btn success-btn-secondary" onclick="CheckoutManager.showInvoiceModal()" style="background: #C41E3A; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-file-invoice"></i> عرض الفاتورة (Screenshot)
            </button>
          </div>
        </div>
      `;

      const headerCloseBtn = document.getElementById('checkout-modal-header-close');
      if (headerCloseBtn) headerCloseBtn.style.display = 'none';
      
    }, 1000);
  },

  // Display clean visual Invoice card modal for Screenshot
  showInvoiceModal(order = null) {
    const targetOrder = order || this.lastPlacedOrder;
    if (!targetOrder) return;

    const modal = document.getElementById('customer-invoice-modal');
    const container = document.getElementById('invoice-modal-printable-content');
    if (!modal || !container) return;

    let itemsRowsHTML = '';
    targetOrder.items.forEach((item, idx) => {
      itemsRowsHTML += `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 8px; font-weight: 600; color: #1e293b;">${idx + 1}. ${item.name}</td>
          <td style="padding: 10px 8px; text-align: center; color: #475569;">${item.qty}</td>
          <td style="padding: 10px 8px; text-align: left; font-weight: 600; color: #0f172a;">$${(item.price * item.qty).toFixed(2)}</td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; background: #ffffff;">
        <!-- Invoice Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #C41E3A; font-size: 24px; font-weight: 900; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-utensils"></i> المطبخ العالمي (Global Kitchen)
            </h2>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">فاتورة طلب رسمية - لبنان 🇱🇧</p>
          </div>
          <div style="text-align: left;">
            <span style="background: #fef2f2; color: #991b1b; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 20px; border: 1px solid #fecaca;">
              #${targetOrder.id}
            </span>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">${targetOrder.date}</div>
          </div>
        </div>

        <!-- Customer & Delivery Box -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 10px; color: #334155; font-size: 14px; font-weight: 800;">👤 بيانات التوصيل والعميل:</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; color: #475569;">
            <div><strong>الاسم:</strong> ${targetOrder.customer.name}</div>
            <div><strong>رقم الهاتف:</strong> <span style="direction: ltr; display: inline-block;">${targetOrder.customer.phone}</span></div>
            <div style="grid-column: span 2;"><strong>العنوان:</strong> ${targetOrder.customer.address} - ${targetOrder.customer.city}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; color: #475569; font-weight: 800;">
              <th style="padding: 8px; text-align: right; border-radius: 0 6px 6px 0;">المنتج</th>
              <th style="padding: 8px; text-align: center;">الكمية</th>
              <th style="padding: 8px; text-align: left; border-radius: 6px 0 0 6px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHTML}
          </tbody>
        </table>

        <!-- Totals Summary Box -->
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
            <span>المجموع الفرعي:</span>
            <span>$${targetOrder.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4f46e5; font-weight: 700; margin-bottom: 10px;">
            <span>رسوم الشحن (لبنان):</span>
            <span>$${targetOrder.shipping.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; color: #0f172a; font-weight: 900; border-top: 2px dashed #cbd5e1; padding-top: 10px;">
            <span>الإجمالي النهائي المستحق:</span>
            <span style="color: #C41E3A;">$${targetOrder.total.toFixed(2)} USD</span>
          </div>
        </div>

        <!-- Payment Footer Note -->
        <div style="margin-top: 15px; text-align: center; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-weight: 800; padding: 10px; border-radius: 8px; font-size: 13px;">
          💵 طريقة الدفع: الدفع عند الاستلام كاش فقط (Cash on Delivery)
        </div>
      </div>
    `;

    // Open Modal
    modal.classList.add('active');
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
