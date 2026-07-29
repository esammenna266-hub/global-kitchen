/* ==========================================================================
   CORE COORDINATOR, SLIDER TIMER & TRANSLATION ENGINE
   ========================================================================== */

const App = {
  currentLang: 'ar', // default to Arabic for local audience, toggleable

  init() {
    this.bindEvents();
    
    // Boot managers
    window.CartManager.init();
    window.FilterManager.init();
    window.CheckoutManager.init();

    // Start Hero slideshow slider loop
    this.startHeroSlider();

    // Set initial language layout
    this.setLanguage(this.currentLang);
  },

  bindEvents() {
    // Bind language switcher clicks
    const langBtn = document.getElementById('lang-switch-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const nextLang = this.currentLang === 'ar' ? 'en' : 'ar';
        this.setLanguage(nextLang);
      });
    }

    // Bind Cart drawer sliders
    const cartTrigger = document.getElementById('navbar-cart-trigger');
    if (cartTrigger) {
      cartTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.openCart();
      });
    }

    const cartCloseBtn = document.getElementById('cart-drawer-close-btn');
    if (cartCloseBtn) {
      cartCloseBtn.addEventListener('click', () => {
        this.closeCart();
      });
    }

    const overlay = document.getElementById('cart-overlay-blur');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeCart();
      });
    }

    // Checkout button inside cart drawer footer
    const chkBtn = document.getElementById('drawer-checkout-btn');
    if (chkBtn) {
      chkBtn.addEventListener('click', () => {
        window.CheckoutManager.openCheckout();
      });
    }

    // Checkout modal close button
    const chkClose = document.getElementById('checkout-modal-header-close');
    if (chkClose) {
      chkClose.addEventListener('click', () => {
        window.CheckoutManager.closeCheckout();
      });
    }
  },

  // Toggle layout direction and translate static texts
  setLanguage(lang) {
    this.currentLang = lang;
    const body = document.body;

    if (lang === 'ar') {
      body.classList.add('rtl-lang');
    } else {
      body.classList.remove('rtl-lang');
    }

    // Loop through elements that have data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (window.TRANSLATIONS[lang][key]) {
        // Handle input placeholders differently
        if (el.tagName === 'INPUT' && el.type === 'text') {
          el.placeholder = window.TRANSLATIONS[lang][key];
        } else {
          el.textContent = window.TRANSLATIONS[lang][key];
        }
      }
    });

    // Translate dynamic elements / redraw panels
    window.CartManager.updateUI();
    window.FilterManager.renderCategoryTabs();
    window.FilterManager.filterAndRender();
  },

  // Open Sliding Cart Sidebar
  openCart() {
    const drawer = document.getElementById('cart-drawer-panel');
    const overlay = document.getElementById('cart-overlay-blur');
    if (drawer && overlay) {
      drawer.classList.add('active');
      overlay.classList.add('active');
    }
  },

  // Close Sliding Cart Sidebar
  closeCart() {
    const drawer = document.getElementById('cart-drawer-panel');
    const overlay = document.getElementById('cart-overlay-blur');
    if (drawer && overlay) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    }
  },

  // Hero Slider Auto Scroll Loop
  startHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    let currentSlideIndex = 0;
    let slideInterval;

    const showSlide = (index) => {
      slides.forEach(slide => slide.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));

      slides[index].classList.add('active');
      dots[index].classList.add('active');
      currentSlideIndex = index;
    };

    const nextSlide = () => {
      let nextIndex = (currentSlideIndex + 1) % slides.length;
      showSlide(nextIndex);
    };

    const prevSlide = () => {
      let prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
      showSlide(prevIndex);
    };

    // Auto rotate every 5 seconds
    slideInterval = setInterval(nextSlide, 5000);

    // Bind slider arrow actions
    const btnNext = document.querySelector('.arrow-next');
    const btnPrev = document.querySelector('.arrow-prev');
    
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        clearInterval(slideInterval);
        nextSlide();
        slideInterval = setInterval(nextSlide, 5000);
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.preventDefault();
        clearInterval(slideInterval);
        prevSlide();
        slideInterval = setInterval(nextSlide, 5000);
      });
    }
  },

  // Toast Alerts Notifications
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideInUp 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Bind to window and boot on DOM Content Load
window.App = App;
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
