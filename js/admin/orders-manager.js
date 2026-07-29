/**
 * Orders & Delivery Tracking Manager - USD Currency for Integrated Admin
 */

class OrdersManager {
    constructor() {
        this.currentStatusFilter = 'all';
        this.initListeners();
    }

    initListeners() {
        const tabs = document.querySelectorAll('#order-status-filter-tabs .filter-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentStatusFilter = tab.dataset.status;
                this.renderOrdersTable();
            });
        });

        const searchInput = document.getElementById('orders-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderOrdersTable());
        }
    }

    renderOrdersTable() {
        const tableBody = document.getElementById('orders-list-table-body');
        const overviewRecentBody = document.getElementById('overview-recent-orders-body');

        let orders = window.wcStore ? window.wcStore.getOrders() : [];

        // Update status counter badges
        const countAll = orders.length;
        const countPending = orders.filter(o => o.status === 'pending').length;
        const countProcessing = orders.filter(o => o.status === 'processing').length;
        const countDelivered = orders.filter(o => o.status === 'delivered').length;
        const countUndelivered = orders.filter(o => o.status === 'undelivered').length;

        const elAll = document.getElementById('count-all-orders');
        const elPending = document.getElementById('count-pending-orders');
        const elProcessing = document.getElementById('count-processing-orders');
        const elDelivered = document.getElementById('count-delivered-orders');
        const elUndelivered = document.getElementById('count-undelivered-orders');

        if (elAll) elAll.textContent = countAll;
        if (elPending) elPending.textContent = countPending;
        if (elProcessing) elProcessing.textContent = countProcessing;
        if (elDelivered) elDelivered.textContent = countDelivered;
        if (elUndelivered) elUndelivered.textContent = countUndelivered;

        // Sidebar and overview stats
        const pendingBadge = document.getElementById('sidebar-pending-count');
        if (pendingBadge) pendingBadge.textContent = countPending;

        const statTotalOrders = document.getElementById('stat-total-orders');
        const statCompletedOrders = document.getElementById('stat-completed-orders');
        const statPendingOrders = document.getElementById('stat-pending-orders');

        if (statTotalOrders) statTotalOrders.textContent = countAll;
        if (statCompletedOrders) statCompletedOrders.textContent = countDelivered;
        if (statPendingOrders) statPendingOrders.textContent = countPending;

        // Render Recent Orders in Overview Tab
        if (overviewRecentBody) {
            const recent = orders.slice(0, 5);
            overviewRecentBody.innerHTML = recent.map(o => `
                <tr>
                    <td><strong>#${o.id}</strong></td>
                    <td>
                        <strong style="display:block;">${o.customer.name}</strong>
                        <small style="color:var(--text-secondary);">${o.customer.phone}</small>
                    </td>
                    <td><small>${o.items.map(i => i.name).join(', ')}</small></td>
                    <td><strong style="color:var(--success-text); font-weight:800;">$${Number(o.total).toFixed(2)}</strong></td>
                    <td>${this.getStatusBadgeHtml(o.status)}</td>
                    <td><small style="color:var(--text-muted);">${o.date}</small></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="window.ordersManager.viewOrderDetails('${o.id}')">
                            <i data-lucide="eye"></i> التفاصيل
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Apply Status Filter
        if (this.currentStatusFilter !== 'all') {
            orders = orders.filter(o => o.status === this.currentStatusFilter);
        }

        // Apply Search Query
        const query = (document.getElementById('orders-search-input')?.value || '').toLowerCase();
        if (query) {
            orders = orders.filter(o => 
                o.id.toLowerCase().includes(query) ||
                o.customer.name.toLowerCase().includes(query) ||
                o.customer.phone.includes(query)
            );
        }

        if (!tableBody) return;

        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding: 40px; color:var(--text-muted);">
                        <i data-lucide="shopping-cart-x" style="width:48px; height:48px; margin-bottom:12px;"></i>
                        <p>لا توجد طلبات في هذه الحالة حالياً!</p>
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        tableBody.innerHTML = orders.map(o => `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td>
                    <strong style="display:block; font-size:0.95rem;">${o.customer.name}</strong>
                    <small style="color:var(--text-secondary);"><i data-lucide="phone" style="width:12px; height:12px; display:inline;"></i> ${o.customer.phone}</small>
                </td>
                <td>
                    <ul style="list-style:none; padding:0; font-size:0.85rem;">
                        ${o.items.map(i => `<li>• ${i.name} (x${i.qty})</li>`).join('')}
                    </ul>
                </td>
                <td><strong style="color:var(--success-text); font-size:1.05rem; font-weight:800;">$${Number(o.total).toFixed(2)}</strong></td>
                <td><small style="color:var(--text-secondary);">${o.payment_method}</small></td>
                <td><small style="color:var(--text-muted);">${o.date}</small></td>
                <td>${this.getStatusBadgeHtml(o.status)}</td>
                <td>
                    <select class="custom-select" style="font-size:0.8rem; padding:4px 8px;" onchange="window.ordersManager.changeStatus('${o.id}', this.value)">
                        <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>لم يتم التعليق / معلق</option>
                        <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>قيد المعالجة</option>
                        <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                        <option value="undelivered" ${o.status === 'undelivered' ? 'selected' : ''}>لم يتم التسليم / مرتجع</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.ordersManager.viewOrderDetails('${o.id}')" title="عرض تفاصيل الفاتورة والعنوان">
                        <i data-lucide="file-text"></i> الفاتورة
                    </button>
                </td>
            </tr>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }

    getStatusBadgeHtml(status) {
        switch(status) {
            case 'pending': return `<span class="badge badge-warning"><i data-lucide="clock"></i> معلق / لم يعلق</span>`;
            case 'processing': return `<span class="badge badge-info"><i data-lucide="refresh-cw"></i> قيد المعالجة</span>`;
            case 'delivered': return `<span class="badge badge-success"><i data-lucide="check-circle"></i> تم التسليم</span>`;
            case 'undelivered': return `<span class="badge badge-danger"><i data-lucide="x-circle"></i> لم يتم التسليم</span>`;
            default: return `<span class="badge badge-secondary">${status}</span>`;
        }
    }

    changeStatus(orderId, newStatus) {
        if (window.wcStore) window.wcStore.updateOrderStatus(orderId, newStatus);
        this.renderOrdersTable();
        if (window.analyticsManager) window.analyticsManager.updateMetrics();
    }

    viewOrderDetails(orderId) {
        const orders = window.wcStore ? window.wcStore.getOrders() : [];
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        document.getElementById('modal-order-id').textContent = `#${order.id}`;

        const content = document.getElementById('modal-order-content');
        content.innerHTML = `
            <div class="invoice-container" style="background:#ffffff; padding:24px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:14px; margin-bottom:16px;">
                    <div>
                        <h2 style="font-size:1.3rem; font-weight:800; color:var(--text-main);">فاتورة طلب رقم #${order.id}</h2>
                        <small style="color:var(--text-secondary);">تاريخ الطلب: ${order.date}</small>
                    </div>
                    <div>${this.getStatusBadgeHtml(order.status)}</div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
                    <div style="background:#f8fafc; padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                        <h4 style="color:var(--primary); font-size:0.9rem; margin-bottom:6px;"><i data-lucide="user"></i> بيانات العميل:</h4>
                        <p style="font-weight:700;">${order.customer.name}</p>
                        <p style="font-size:0.85rem;"><i data-lucide="phone" style="width:12px; height:12px; display:inline;"></i> ${order.customer.phone}</p>
                        <p style="font-size:0.85rem; color:var(--text-secondary);">${order.customer.email}</p>
                    </div>
                    <div style="background:#f8fafc; padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
                        <h4 style="color:var(--primary); font-size:0.9rem; margin-bottom:6px;"><i data-lucide="map-pin"></i> عنوان الشحن والتسليم:</h4>
                        <p style="font-weight:700;">${order.customer.city}</p>
                        <p style="font-size:0.85rem; color:var(--text-secondary);">${order.customer.address}</p>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">طريقة الدفع: ${order.payment_method}</p>
                    </div>
                </div>

                <h4 style="margin-bottom:10px;">المنتجات المطلوبة:</h4>
                <table class="data-table" style="margin-bottom:16px;">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>سعر القطعة</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.qty}</td>
                                <td>$${Number(item.price).toFixed(2)}</td>
                                <td><strong style="color:var(--success-text);">$${Number(item.price * item.qty).toFixed(2)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="text-align:left; font-size:1.25rem; font-weight:800; color:var(--success-text); border-top:1px solid var(--border-subtle); padding-top:12px;">
                    إجمالي الفاتورة: $${Number(order.total).toFixed(2)}
                </div>
            </div>
        `;

        document.getElementById('order-details-modal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    closeDetailsModal() {
        document.getElementById('order-details-modal').classList.add('hidden');
    }
}

window.ordersManager = new OrdersManager();

function closeOrderDetailsModal() {
    window.ordersManager.closeDetailsModal();
}

function printOrderInvoice() {
    window.print();
}

window.closeOrderDetailsModal = closeOrderDetailsModal;
window.printOrderInvoice = printOrderInvoice;
