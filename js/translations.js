/* ==========================================================================
   BILINGUAL LOCALIZATION DICTIONARY (Arabic / English)
   ========================================================================== */

const TRANSLATIONS = {
  en: {
    // Navbar
    logo_text_1: "Global",
    logo_text_2: "Kitchen",
    search_placeholder: "Search for premium kitchenware...",
    lang_btn: "العربية",
    cart_title: "Shopping Cart",
    cart_empty: "Your cart is currently empty.",
    continue_shopping: "Continue Shopping",
    
    // Banner / Slider
    slide1_badge: "Premium Cookware",
    slide1_title: "Baking is from the Heart!",
    slide1_desc: "Discover our premium cast iron, tri-ply stainless steel pans, and high-quality baking molds designed for professional chefs.",
    slide1_btn: "Shop Cookware Now",
    
    slide2_badge: "Smart Kitchen",
    slide2_title: "Upgrade Your Culinary Gear",
    slide2_desc: "Explore modern coffee grinders, electric kettles, and high-performance kitchen organizers that make cooking effortless.",
    slide2_btn: "Explore Smart Gear",
    
    // Categories
    cat_all: "All Categories",
    cat_cookware: "Cookware & Bakeware",
    cat_utensils: "Utensils & Gadgets",
    cat_tableware: "Tableware & Glass",
    cat_appliances: "Kitchen Appliances",
    cat_storage: "Smart Storage",
    
    // Product List Headers
    section_title: "Explore Our Catalog",
    no_results: "No products matched your search or selection.",
    original_price: "Original Price",
    add_to_cart: "Add to Cart",
    new_badge: "New",
    sale_badge: "Sale",
    
    // Cart Drawer
    cart_item_removed: "Item removed from cart.",
    cart_item_added: "Item added to cart!",
    cart_item_updated: "Cart updated.",
    subtotal: "Subtotal",
    shipping: "Shipping (Lebanon Flat Rate)",
    shipping_val: "$4.00 USD",
    grand_total: "Total Amount",
    checkout_btn: "Proceed to Checkout",
    
    // Checkout Modal
    checkout_title: "Complete Your Order",
    shipping_details: "1. Shipping Details (Lebanon)",
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email Address",
    phone: "Phone Number",
    address: "Delivery Address",
    city: "City / Area",
    payment_method: "2. Payment Method",
    pay_card: "Credit Card (Disabled)",
    pay_cod: "Cash On Delivery (COD) Only",
    order_summary: "Order Summary",
    place_order: "Confirm & Send Order (Cash On Delivery)",
    required_error: "Please fill out all required fields.",
    
    // Checkout Success
    success_title: "Thank You For Your Order!",
    success_desc: "Your order has been sent directly to our dispatch dashboard. We will contact you soon to deliver your items in Lebanon for Cash On Delivery.",
    success_home: "Back to Home",
    success_invoice: "Print Receipt"
  },
  ar: {
    // Navbar
    logo_text_1: "المطبخ",
    logo_text_2: "العالمي",
    search_placeholder: "ابحث عن أدوات مطبخ فاخرة...",
    lang_btn: "English",
    cart_title: "سلة المشتريات",
    cart_empty: "سلة المشتريات فارغة حالياً.",
    continue_shopping: "متابعة التسوق",
    
    // Banner / Slider
    slide1_badge: "أدوات طهي فاخرة",
    slide1_title: "الخبز والطهي من القلب!",
    slide1_desc: "اكتشفي مجموعة القدور ثلاثية الطبقات والحديد الزهر وقوالب السيليكون المصممة خصيصاً لتناسب الطهاة المحترفين.",
    slide1_btn: "تسوق أدوات الطهي الآن",
    
    slide2_badge: "مطبخ ذكي ومنظم",
    slide2_title: "ارتقِ بمستوى مطبخك اليوم",
    slide2_desc: "تصفح مطاحن القهوة، غلايات التحكم بالحرارة، والمنظمات الذكية التي تسهل عليك مهام المطبخ اليومية.",
    slide2_btn: "استكشف الأجهزة الذكية",
    
    // Categories
    cat_all: "جميع الأقسام",
    cat_cookware: "القدور وقوالب الخبز",
    cat_utensils: "الأدوات والمقاشر",
    cat_tableware: "المائدة والأكواب",
    cat_appliances: "الأجهزة الكهربائية",
    cat_storage: "التخزين والمنظمات",
    
    // Product List Headers
    section_title: "استكشف منتجاتنا",
    no_results: "لم نعثر على أي منتجات مطابقة لبحثك.",
    original_price: "السعر الأصلي",
    add_to_cart: "إضافة للسلة",
    new_badge: "جديد",
    sale_badge: "خصم",
    
    // Cart Drawer
    cart_item_removed: "تمت إزالة المنتج من السلة.",
    cart_item_added: "تمت إضافة المنتج للسلة!",
    cart_item_updated: "تم تحديث السلة.",
    subtotal: "المجموع الفرعي",
    shipping: "رسوم الشحن لكافة مناطق لبنان",
    shipping_val: "$4.00 دولار",
    grand_total: "الإجمالي النهائي",
    checkout_btn: "الذهاب للدفع",
    
    // Checkout Modal
    checkout_title: "إتمام عملية الشراء",
    shipping_details: "١. تفاصيل الشحن والتوصيل (لبنان)",
    first_name: "الاسم الأول",
    last_name: "الاسم الأخير",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    address: "عنوان التوصيل (المنطقة / الشارع)",
    city: "المدينة / القضاء",
    payment_method: "٢. طريقة الدفع",
    pay_card: "بطاقة ائتمان (غير متاحة حالياً)",
    pay_cod: "الدفع عند الاستلام كاش فقط",
    order_summary: "ملخص الطلب",
    place_order: "تأكيد وإرسال الطلب (الدفع كاش عند الاستلام)",
    required_error: "يرجى ملء جميع الحقول المطلوبة.",
    
    // Checkout Success
    success_title: "تم إرسال طلبك بنجاح للوحة التحكم!",
    success_desc: "شكراً لتسوقك معنا. تم إرسال الطلب فوراً للداشبورد وسنقوم بالتواصل معك لتسليم المنتجات كاش عند الاستلام في أي مكان في لبنان.",
    success_home: "العودة للرئيسية",
    success_invoice: "طباعة الفاتورة"
  }
};

// Export logic
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { TRANSLATIONS };
} else {
  window.TRANSLATIONS = TRANSLATIONS;
}
