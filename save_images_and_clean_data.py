import os
import json
import base64
import re

json_path = r"C:\Users\Ali Essam\.gemini\antigravity\scratch\global-kitchen\js\extracted_drive_products.json"
img_dir = r"C:\Users\Ali Essam\.gemini\antigravity\scratch\global-kitchen\assets\catalog_images"
os.makedirs(img_dir, exist_ok=True)

with open(json_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Processing {len(products)} products and saving images to disk...")

clean_products = []

for idx, p in enumerate(products):
    img_data = p.get('image', '')
    img_rel_path = "assets/products/img_p1_1.jpeg"
    
    if img_data.startswith('data:image'):
        try:
            # Extract mime & base64
            match = re.match(r'data:image/(\w+);base64,(.+)', img_data)
            if match:
                ext = match.group(1)
                b64_bytes = base64.b64decode(match.group(2))
                if ext == 'jpeg': ext = 'jpg'
                
                img_filename = f"prod_{idx+1}.{ext}"
                full_img_path = os.path.join(img_dir, img_filename)
                
                with open(full_img_path, 'wb') as img_f:
                    img_f.write(b64_bytes)
                
                img_rel_path = f"assets/catalog_images/{img_filename}"
        except Exception as e:
            pass

    clean_p = {
        "id": idx + 1000,
        "nameAR": p["title"],
        "nameEN": p["title"],
        "price": p["costPrice"],
        "sellingPrice": p["price"],
        "profitMargin": 30,
        "sku": p["sku"],
        "category": p["category"],
        "image": img_rel_path,
        "badgeAR": "عرض محدود",
        "badgeEN": "Limited Offer",
        "rating": 4.8,
        "reviewsCount": 12,
        "inStock": True,
        "specAR": f"منتج من فئة {p['category']} - التكلفة ${p['costPrice']} | نسبة الربح 30%",
        "specEN": f"Item from {p['category']}"
    }
    clean_products.append(clean_p)

# Save lightweight js/data.js (~1.5 MB)
data_js_path = r"C:\Users\Ali Essam\.gemini\antigravity\scratch\global-kitchen\js\data.js"
data_content = f"""/**
 * Global Kitchen - Product Catalog Data (1,909 Products extracted from supplier catalogs)
 */
const PRODUCTS = {json.dumps(clean_products, ensure_ascii=False, indent=2)};

if (typeof module !== 'undefined') {{
    module.exports = {{ PRODUCTS }};
}}
"""

with open(data_js_path, 'w', encoding='utf-8') as f:
    f.write(data_content)

print(f"Saved optimized js/data.js! Size: {os.path.getsize(data_js_path) / (1024*1024):.2f} MB")
