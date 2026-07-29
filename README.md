# Global Kitchen (المطبخ العالمي) - Unified Store & Admin Platform

Premium E-Commerce Platform for Cookware, Tableware, Home Appliances, and Smart Storage organizers with an Integrated Admin Control Panel (WooDash Admin).

## Unified Project Structure

```text
global-kitchen/
├── assets/                  # Images, icons, and product images
│   ├── logo.jpg
│   └── products/            # 100+ Product Images
├── css/                     # Stylesheets
│   ├── main.css
│   ├── header.css
│   ├── hero.css
│   ├── products.css
│   ├── cart.css
│   ├── checkout.css
│   └── admin.css            # Integrated Control Panel Styles
├── js/                      # Modular Javascript files
│   ├── data.js              # Product catalog database
│   ├── translations.js      # AR/EN localization dictionary
│   ├── cart.js              # Cart state & checkout logic
│   ├── search.js            # Search & category filter logic
│   ├── checkout.js          # Order submission & modal logic
│   ├── supabase-client.js   # Supabase cloud & realtime sync
│   ├── main.js              # Main store coordinator
│   └── admin/               # Integrated Admin Panel Modules
│       ├── app.js
│       ├── analytics.js
│       ├── import-engine.js
│       ├── orders-manager.js
│       ├── products-manager.js
│       └── woocommerce-api.js
├── index.html               # Main Customer Store Entry Page
├── admin.html               # Integrated Admin Control Panel Entry Page
├── package.json             # Dev server configuration
└── README.md                # Project documentation
```

## Features

- **Unified Single Project**: Store & Admin panel fully integrated in one codebase.
- **Bilingual Store**: Complete Arabic (RTL) & English (LTR) switching.
- **Realtime Order & Stock Sync**: Instant synchronization between Store and Admin via Supabase and LocalStorage.
- **Smart PDF & Excel Import**: Advanced parser to extract products, images, and prices directly into the catalog.
- **Full Order & Financial Analytics**: Sales charts, order status tracking, and printable customer invoices.

## How to Run

```bash
npm run dev
```
- Customer Store: `http://localhost:3000/global-kitchen/index.html` (or `http://localhost:3000/`)
- Admin Control Panel: `http://localhost:3000/global-kitchen/admin.html`
