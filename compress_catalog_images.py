import os
import json
from PIL import Image

img_dir = r"C:\Users\Ali Essam\.gemini\antigravity\scratch\global-kitchen\assets\catalog_images"
data_js_path = r"C:\Users\Ali Essam\.gemini\antigravity\scratch\global-kitchen\js\data.js"

print("Compressing cropped product images to high-efficiency JPEG (75% quality)...")

files = [f for f in os.listdir(img_dir) if f.endswith('.png')]
print(f"Found {len(files)} PNG images to compress...")

for idx, f in enumerate(files):
    png_path = os.path.join(img_dir, f)
    jpg_filename = f.replace('.png', '.jpg')
    jpg_path = os.path.join(img_dir, jpg_filename)
    
    try:
        with Image.open(png_path) as img:
            rgb_img = img.convert('RGB')
            rgb_img.save(jpg_path, 'JPEG', quality=75, optimize=True)
        os.remove(png_path)
    except Exception as e:
        pass

print("Updating js/data.js image paths to .jpg...")
with open(data_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('.png', '.jpg')

with open(data_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Image compression & data.js update complete!")
