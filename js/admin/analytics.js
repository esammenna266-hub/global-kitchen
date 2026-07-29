/**
 * Analytics & Financial Metrics Module - Integrated Admin
 */

class AnalyticsManager {
    constructor() {
        this.overviewChart = null;
        this.statusChart = null;
        this.fullRevenueChart = null;
        this.topProductsChart = null;
    }

    init() {
        this.updateMetrics();
    }

    updateMetrics() {
        const orders = window.wcStore.getOrders();
        const products = window.wcStore.getProducts();

        // Calculate Revenue in USD
        const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'undelivered' ? Number(o.total) : 0), 0);
        const revenueElem = document.getElementById('stat-total-revenue');
        if (revenueElem) revenueElem.textContent = `$${totalRevenue.toFixed(2)}`;

        this.renderOverviewRevenueChart(orders);
        this.renderStatusChart(orders);
        this.renderFullAnalyticsCharts(orders, products);
        this.renderCustomersTable(orders);
    }

    renderOverviewRevenueChart(orders) {
        const ctx = document.getElementById('overview-revenue-chart');
        if (!ctx) return;

        if (this.overviewChart) this.overviewChart.destroy();

        const labels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'];
        const revenueData = [1200, 1850, 2400, 2100, 3200, 3900, 4800];
        const ordersData = [12, 18, 22, 19, 28, 31, 38];

        this.overviewChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'الإيرادات ($)',
                        data: revenueData,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    },
                    {
                        label: 'عدد الطلبات',
                        data: ordersData,
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#475569', font: { family: 'Tajawal', weight: 'bold' } } }
                },
                scales: {
                    x: { ticks: { color: '#64748b', font: { family: 'Tajawal' } }, grid: { color: '#f1f5f9' } },
                    y: { ticks: { color: '#64748b', font: { family: 'Tajawal' } }, grid: { color: '#f1f5f9' } }
                }
            }
        });
    }

    renderStatusChart(orders) {
        const ctx = document.getElementById('overview-status-chart');
        if (!ctx) return;

        if (this.statusChart) this.statusChart.destroy();

        const pending = orders.filter(o => o.status === 'pending').length;
        const processing = orders.filter(o => o.status === 'processing').length;
        const delivered = orders.filter(o => o.status === 'delivered').length;
        const undelivered = orders.filter(o => o.status === 'undelivered').length;

        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['معلق / لم يعلق', 'قيد المعالجة', 'تم التسليم', 'لم يتم التسليم'],
                datasets: [{
                    data: [pending, processing, delivered, undelivered],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#475569', font: { family: 'Tajawal', weight: 'bold' } } }
                }
            }
        });
    }

    renderFullAnalyticsCharts(orders, products) {
        const revCtx = document.getElementById('analytics-revenue-full-chart');
        const prodCtx = document.getElementById('analytics-top-products-chart');

        if (revCtx) {
            if (this.fullRevenueChart) this.fullRevenueChart.destroy();
            this.fullRevenueChart = new Chart(revCtx, {
                type: 'bar',
                data: {
                    labels: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
                    datasets: [{
                        label: 'مبيعات الأسبوع الحالي ($)',
                        data: [420, 680, 510, 890, 740, 1120, 1450],
                        backgroundColor: '#7c3aed',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#475569', font: { family: 'Tajawal' } } } },
                    scales: {
                        x: { ticks: { color: '#64748b', font: { family: 'Tajawal' } } },
                        y: { ticks: { color: '#64748b', font: { family: 'Tajawal' } } }
                    }
                }
            });
        }

        if (prodCtx) {
            if (this.topProductsChart) this.topProductsChart.destroy();
            const topProducts = products.slice(0, 5);
            this.topProductsChart = new Chart(prodCtx, {
                type: 'bar',
                data: {
                    labels: topProducts.map(p => p.title.substring(0, 18) + '...'),
                    datasets: [{
                        label: 'الوحدات المباعة',
                        data: [45, 38, 29, 24, 18],
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#475569', font: { family: 'Tajawal' } } } },
                    scales: {
                        x: { ticks: { color: '#64748b', font: { family: 'Tajawal' } } },
                        y: { ticks: { color: '#64748b', font: { family: 'Tajawal' } } }
                    }
                }
            });
        }
    }

    renderCustomersTable(orders) {
        const tableBody = document.getElementById('customers-list-table-body');
        if (!tableBody) return;

        const customerMap = {};
        orders.forEach(o => {
            const key = o.customer.phone || o.customer.email;
            if (!customerMap[key]) {
                customerMap[key] = {
                    name: o.customer.name,
                    phone: o.customer.phone,
                    email: o.customer.email,
                    city: o.customer.city,
                    address: o.customer.address,
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrderDate: o.date
                };
            }
            customerMap[key].orderCount += 1;
            customerMap[key].totalSpent += Number(o.total);
        });

        const customers = Object.values(customerMap);

        tableBody.innerHTML = customers.map(c => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="avatar" style="width:32px; height:32px; font-size:0.8rem;">${c.name.charAt(0)}</div>
                        <strong>${c.name}</strong>
                    </div>
                </td>
                <td>
                    <div>${c.phone}</div>
                    <small style="color:var(--text-secondary);">${c.email}</small>
                </td>
                <td>${c.city} - <small style="color:var(--text-secondary);">${c.address}</small></td>
                <td><span class="badge badge-primary">${c.orderCount} طلبات</span></td>
                <td><strong style="color:var(--success-text); font-weight:800;">$${c.totalSpent.toFixed(2)}</strong></td>
                <td><small style="color:var(--text-muted);">${c.lastOrderDate}</small></td>
            </tr>
        `).join('');
    }
}

window.analyticsManager = new AnalyticsManager();
