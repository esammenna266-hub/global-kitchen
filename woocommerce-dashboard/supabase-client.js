/**
 * Supabase Cloud Client & Realtime Manager
 * Realtime Synchronization between Global Kitchen Store & WooDash Pro Dashboard
 */

const DEFAULT_SUPABASE_CONFIG = {
    URL: localStorage.getItem('woodash_supabase_url') || 'https://demo-globalkitchen.supabase.co',
    KEY: localStorage.getItem('woodash_supabase_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_anon_key'
};

class SupabaseManager {
    constructor() {
        this.client = null;
        this.isConfigured = false;
        this.init();
    }

    init() {
        if (window.supabase && DEFAULT_SUPABASE_CONFIG.URL && DEFAULT_SUPABASE_CONFIG.KEY) {
            try {
                this.client = window.supabase.createClient(DEFAULT_SUPABASE_CONFIG.URL, DEFAULT_SUPABASE_CONFIG.KEY);
                this.isConfigured = true;
            } catch (e) {
                console.warn("Supabase initialization fallback:", e.message);
            }
        }
    }

    // Save user credentials from Settings page
    saveCredentials(url, key) {
        localStorage.setItem('woodash_supabase_url', url);
        localStorage.setItem('woodash_supabase_key', key);
        DEFAULT_SUPABASE_CONFIG.URL = url;
        DEFAULT_SUPABASE_CONFIG.KEY = key;
        this.init();
    }

    // Fetch Products from Supabase or Fallback Local Storage
    async getProducts() {
        if (this.isConfigured && this.client) {
            try {
                const { data, error } = await this.client.from('products').select('*').order('created_at', { ascending: false });
                if (!error && data && data.length > 0) {
                    return data.map(p => ({
                        id: p.id,
                        title: p.title,
                        sku: p.sku,
                        price: parseFloat(p.price) || 0,
                        regular_price: parseFloat(p.regular_price) || 0,
                        stock: parseInt(p.stock) || 10,
                        category: p.category,
                        spec: p.spec,
                        image: p.image,
                        source: 'سحابة Supabase',
                        description: p.description
                    }));
                }
            } catch (e) {
                console.log("Supabase fetch products fallback:", e.message);
            }
        }
        return window.wcStore.getProducts();
    }

    // Upsert / Add Product to Supabase
    async upsertProduct(product) {
        if (this.isConfigured && this.client) {
            try {
                await this.client.from('products').upsert({
                    id: product.id,
                    title: product.title,
                    sku: product.sku,
                    price: product.price,
                    regular_price: product.regular_price || product.price,
                    stock: product.stock,
                    category: product.category,
                    spec: product.spec || '',
                    image: product.image,
                    description: product.description || ''
                });
            } catch (e) {
                console.warn("Supabase upsert error:", e.message);
            }
        }
        // Always persist to local store as well
        return window.wcStore.addProduct(product);
    }

    // Delete Product from Supabase
    async deleteProduct(productId) {
        if (this.isConfigured && this.client) {
            try {
                await this.client.from('products').delete().eq('id', productId);
            } catch (e) {
                console.warn("Supabase delete error:", e.message);
            }
        }
        window.wcStore.deleteProduct(productId);
    }

    // Fetch Orders from Supabase
    async getOrders() {
        if (this.isConfigured && this.client) {
            try {
                const { data, error } = await this.client.from('orders').select('*').order('created_at', { ascending: false });
                if (!error && data && data.length > 0) {
                    return data.map(o => ({
                        id: o.id,
                        customer: {
                            name: o.customer_name,
                            phone: o.customer_phone,
                            email: o.customer_email,
                            address: o.customer_address,
                            city: o.customer_city
                        },
                        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
                        total: parseFloat(o.total),
                        payment_method: o.payment_method,
                        status: o.status,
                        status_label: o.status === 'pending' ? 'لم يتم التعليق / معلق' : (o.status === 'delivered' ? 'تم التسليم بنجاح' : 'قيد المعالجة'),
                        date: new Date(o.created_at || Date.now()).toLocaleString('ar-EG')
                    }));
                }
            } catch (e) {
                console.log("Supabase fetch orders fallback:", e.message);
            }
        }
        return window.wcStore.getOrders();
    }

    // Insert New Order from Store to Supabase
    async insertOrder(order) {
        if (this.isConfigured && this.client) {
            try {
                await this.client.from('orders').insert({
                    id: order.id,
                    customer_name: order.customer.name,
                    customer_phone: order.customer.phone,
                    customer_email: order.customer.email,
                    customer_address: order.customer.address,
                    customer_city: order.customer.city,
                    items: order.items,
                    total: order.total,
                    payment_method: order.payment_method,
                    status: 'pending'
                });
            } catch (e) {
                console.warn("Supabase insert order error:", e.message);
            }
        }
        // Save into local storage
        const existing = window.wcStore.getOrders();
        existing.unshift(order);
        window.wcStore.saveOrders(existing);
    }

    // Update Order Status in Supabase
    async updateOrderStatus(orderId, newStatus) {
        if (this.isConfigured && this.client) {
            try {
                await this.client.from('orders').update({ status: newStatus }).eq('id', orderId);
            } catch (e) {
                console.warn("Supabase update order status error:", e.message);
            }
        }
        window.wcStore.updateOrderStatus(orderId, newStatus);
    }

    // Subscribe to Realtime Orders Channel
    subscribeToRealtimeOrders(onNewOrderCallback) {
        if (this.isConfigured && this.client) {
            try {
                this.client
                    .channel('realtime-orders')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
                        console.log('⚡ Realtime Order Received from Supabase:', payload.new);
                        this.playNotificationSound();
                        if (onNewOrderCallback) onNewOrderCallback(payload.new);
                    })
                    .subscribe();
            } catch (e) {
                console.warn("Supabase Realtime subscription error:", e.message);
            }
        }
    }

    // Play Chime Audio Notification
    playNotificationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        } catch(e) {
            console.log("Audio notification played");
        }
    }
}

window.supabaseManager = new SupabaseManager();
