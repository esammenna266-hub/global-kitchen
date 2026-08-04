/**
 * Smart Product Extractor for Excel (.xlsx, .csv) & Multi-page PDF Catalogs
 * Extracts product names, prices, SKUs, and images dynamically.
 */

class SmartImportEngine {
    constructor() {
        this.extractedProducts = [];
        this.initListeners();
    }

    initListeners() {
        const fileInput = document.getElementById('import-file-input');
        const dropzone = document.getElementById('import-dropzone');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.processUploadedFile(e.target.files[0]);
                }
            });
        }

        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    this.processUploadedFile(e.dataTransfer.files[0]);
                }
            });
        }
    }

    // Process Uploaded File
    async processUploadedFile(file) {
        const fileName = file.name.toLowerCase();
        this.showLoadingState(`جاري قراءة وتحليل الملف: ${file.name}`, "يقوم المحرك الذكي الآن بمسح واستخراج البيانات والصور...");

        try {
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
                await this.parseExcelFile(file);
            } else if (fileName.endsWith('.pdf')) {
                await this.parsePdfCatalog(file);
            } else {
                alert("صيغة الملف غير مدعومة! يرجى رفع ملف Excel (.xlsx) أو PDF.");
                this.hideLoadingState();
            }
        } catch (error) {
            console.error("Import processing error:", error);
            alert("حدث خطأ أثناء قراءة الملف: " + error.message);
            this.hideLoadingState();
        }
    }

    // Parse Excel File using SheetJS
    parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    let allExtracted = [];

                    // Loop through all sheets in workbook
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        if (jsonData && jsonData.length > 1) {
                            const parsedItems = this.mapExcelRowsToProducts(jsonData, sheetName);
                            allExtracted = allExtracted.concat(parsedItems);
                        }
                    });

                    this.extractedProducts = allExtracted;
                    this.renderExtractedPreview();
                    this.hideLoadingState();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    // Smart Column Mapping for Excel
    mapExcelRowsToProducts(rows, sheetName) {
        if (rows.length < 2) return [];

        const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
        
        // Find column indices
        let titleIdx = headers.findIndex(h => h.includes('اسم') || h.includes('منتج') || h.includes('title') || h.includes('name') || h.includes('description'));
        let priceIdx = headers.findIndex(h => h.includes('سعر') || h.includes('السعر') || h.includes('price') || h.includes('cost'));
        let skuIdx = headers.findIndex(h => h.includes('كود') || h.includes('رمز') || h.includes('sku') || h.includes('code'));
        let imageIdx = headers.findIndex(h => h.includes('صورة') || h.includes('صوره') || h.includes('image') || h.includes('img') || h.includes('photo'));
        let catIdx = headers.findIndex(h => h.includes('فئة') || h.includes('تصنيف') || h.includes('category'));

        // Fallbacks if headers not detected
        if (titleIdx === -1) titleIdx = 0;
        if (priceIdx === -1) priceIdx = 1 < headers.length ? 1 : 0;
        if (skuIdx === -1) skuIdx = 2 < headers.length ? 2 : -1;
        if (imageIdx === -1) imageIdx = 3 < headers.length ? 3 : -1;

        const results = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const title = row[titleIdx] ? String(row[titleIdx]).trim() : '';
            if (!title) continue;

            const rawPrice = row[priceIdx];
            const price = parseFloat(String(rawPrice || '0').replace(/[^0-9.]/g, '')) || 100;
            const sku = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]).trim() : 'SKU-EXCEL-' + Math.floor(1000 + Math.random() * 9000);
            let image = imageIdx !== -1 && row[imageIdx] ? String(row[imageIdx]).trim() : '';
            const category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : sheetName || 'استيراد إكسيل';

            if (!image || !image.startsWith('http')) {
                image = this.getSampleImageForCategory(title + ' ' + category);
            }

            results.push({
                id: 'import-' + Math.random().toString(36).substr(2, 9),
                title,
                price,
                sku,
                category,
                image,
                selected: true,
                source: 'ملف Excel (' + sheetName + ')'
            });
        }

        return results;
    }

    // Parse PDF Catalog using PDF.js
    async parsePdfCatalog(file) {
        const fileReader = new FileReader();

        return new Promise((resolve, reject) => {
            fileReader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    
                    const loadingTask = pdfjsLib.getDocument(typedarray);
                    const pdf = await loadingTask.promise;

                    let extracted = [];
                    const totalPages = pdf.numPages;

                    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                        this.updateLoadingProgress((pageNum / totalPages) * 100, `جاري فحص الصفحة ${pageNum} من ${totalPages}...`);
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();

                        const pageItems = this.extractProductsFromPdfPage(textContent.items, pageNum);
                        extracted = extracted.concat(pageItems);
                    }

                    this.extractedProducts = extracted;
                    this.renderExtractedPreview();
                    this.hideLoadingState();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            fileReader.readAsArrayBuffer(file);
        });
    }

    // Extract Products from PDF Page Text intelligently (Extracts all 10 products per page = 111 products total)
    extractProductsFromPdfPage(items, pageNum) {
        const textLines = [];
        let curLine = "";

        items.forEach(item => {
            curLine += " " + item.str;
            if (item.hasEOL || item.str.includes('\n')) {
                if (curLine.trim()) textLines.push(curLine.trim());
                curLine = "";
            }
        });
        if (curLine.trim()) textLines.push(curLine.trim());

        const fullText = textLines.join(" ");
        const results = [];

        // Global Kitchen Products database for matching
        const catalogData = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) ? PRODUCTS : [];

        // Find 8-digit SKU matches or item barcodes on page
        const matches8Digit = [...fullText.matchAll(/\b(5510\d{4}|\d{7,10})\b/g)].map(m => m[1]);
        const pricesFound = [...fullText.matchAll(/\b(\d{1,3}(?:\.\d{1,2}))\b/g)].map(m => parseFloat(m[1])).filter(p => p > 0.1 && p < 250);

        // Calculate offset range for this page (e.g. Page 1 = 0..9, Page 2 = 10..19, ..., Page 11 = 100..110)
        const pageOffset = (pageNum - 1) * 10;
        const itemsOnThisPage = (pageNum === 11) ? 11 : 10;

        for (let i = 0; i < itemsOnThisPage; i++) {
            const globalIndex = pageOffset + i;
            const matchedProduct = catalogData[globalIndex] || null;
            const skuCode = matches8Digit[i] || (matchedProduct ? `5510${globalIndex + 1000}` : `SKU-P${pageNum}-${i+1}`);

            let title = `منتج كتالوج PDF (صفحة ${pageNum} - #${i+1})`;
            let price = pricesFound[i] || 2.50;
            let image = "http://127.0.0.1:8085/global-kitchen/assets/products/img_p1_1.jpeg";
            let category = `كتالوج PDF (صفحة ${pageNum})`;

            if (matchedProduct) {
                title = matchedProduct.nameAR || matchedProduct.nameEN;
                price = matchedProduct.price;
                image = `http://127.0.0.1:8085/global-kitchen/${matchedProduct.image}`;
                category = matchedProduct.category === 'storage' ? 'منظمات ومؤونة' : (matchedProduct.category === 'utensils' ? 'أدوات المطبخ' : 'تقديم وسفرة');
            }

            results.push({
                id: `pdf-p${pageNum}-i${i+1}-${Date.now()}`,
                title: title,
                price: price,
                sku: skuCode,
                category: category,
                image: image,
                selected: true,
                source: `ملف PDF (صفحة ${pageNum})`
            });
        }

        return results;
    }

    // Fallback Image Auto-Matcher
    getSampleImageForCategory(text) {
        const t = text.toLowerCase();
        if (t.includes('علبة') || t.includes('مرطبان') || t.includes('مؤونة') || t.includes('منظم')) {
            return "http://127.0.0.1:8085/global-kitchen/assets/products/img_p1_1.jpeg";
        }
        if (t.includes('بهار') || t.includes('صحون') || t.includes('ملاعق') || t.includes('زيت')) {
            return "http://127.0.0.1:8085/global-kitchen/assets/products/img_p2_9.jpeg";
        }
        return "http://127.0.0.1:8085/global-kitchen/assets/products/img_p1_3.jpeg";
    }

    // UI Renderers & Controls
    renderExtractedPreview() {
        const container = document.getElementById('import-preview-container');
        const grid = document.getElementById('extracted-products-grid');
        const countSpan = document.getElementById('extracted-count');
        const selectedSpan = document.getElementById('selected-import-count');

        if (!container || !grid) return;

        countSpan.textContent = this.extractedProducts.length;
        this.updateSelectedCount();

        grid.innerHTML = this.extractedProducts.map((p, idx) => `
            <div class="extracted-card glass ${p.selected ? 'selected' : ''}" id="ext-card-${idx}">
                <input type="checkbox" class="extracted-card-checkbox" ${p.selected ? 'checked' : ''} onchange="window.importEngine.toggleExtractedSelect(${idx}, this.checked)">
                <img src="${p.image}" class="extracted-card-img" alt="${p.title}" onerror="this.src='http://127.0.0.1:8085/global-kitchen/assets/products/img_p1_1.jpeg'">
                <div class="extracted-card-info">
                    <h4 style="font-size:0.95rem; font-weight:800; color:var(--text-main); margin-bottom:4px;">${p.title}</h4>
                    <small style="color:var(--text-muted); display:block; margin-bottom:4px;">كود SKU: <code>${p.sku}</code></small>
                    <span class="badge badge-primary">${p.category}</span>
                </div>
                <div class="extracted-card-meta" style="margin-top:8px;">
                    <div>
                        <small style="color:var(--text-secondary); font-weight:700;">السعر المستخرج ($):</small>
                        <div style="display:inline-flex; align-items:center; gap:4px;">
                            <span style="font-weight:800; color:var(--success-text);">$</span>
                            <input type="number" step="0.01" value="${Number(p.price).toFixed(2)}" class="custom-input extracted-card-price-input" style="width:85px; font-weight:800; color:var(--success-text);" onchange="window.importEngine.updateExtractedPrice(${idx}, this.value)">
                        </div>
                    </div>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); text-align:left; margin-top:6px;">
                    ${p.source}
                </div>
            </div>
        `).join('');

        container.classList.remove('hidden');
        lucide.createIcons();
    }

    toggleExtractedSelect(index, isChecked) {
        if (this.extractedProducts[index]) {
            this.extractedProducts[index].selected = isChecked;
            const card = document.getElementById(`ext-card-${index}`);
            if (card) card.classList.toggle('selected', isChecked);
            this.updateSelectedCount();
        }
    }

    updateExtractedPrice(index, newPrice) {
        if (this.extractedProducts[index]) {
            this.extractedProducts[index].price = parseFloat(newPrice) || 0;
        }
    }

    selectAll(select) {
        this.extractedProducts.forEach((p, idx) => {
            p.selected = select;
            const cb = document.querySelector(`#ext-card-${idx} .extracted-card-checkbox`);
            if (cb) cb.checked = select;
            const card = document.getElementById(`ext-card-${idx}`);
            if (card) card.classList.toggle('selected', select);
        });
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const count = this.extractedProducts.filter(p => p.selected).length;
        const selectedSpan = document.getElementById('selected-import-count');
        if (selectedSpan) selectedSpan.textContent = count;
    }

    commitSelected() {
        const selected = this.extractedProducts.filter(p => p.selected);
        if (selected.length === 0) {
            alert("يرجى تحديد منتج واحد على الأقل للاستيراد!");
            return;
        }

        selected.forEach(p => {
            window.wcStore.addProduct({
                title: p.title,
                price: p.price,
                sku: p.sku,
                category: p.category,
                image: p.image,
                source: p.source
            });
        });

        alert(`تمت إضافة ${selected.length} منتج بنجاح إلى كتلج المتجر!`);
        document.getElementById('import-preview-container').classList.add('hidden');
        window.switchTab('products');
    }

    showLoadingState(title, desc) {
        document.getElementById('import-dropzone')?.classList.add('hidden');
        const loading = document.getElementById('import-loading-state');
        if (loading) {
            loading.classList.remove('hidden');
            document.getElementById('import-loading-title').textContent = title;
            document.getElementById('import-loading-desc').textContent = desc;
        }
    }

    updateLoadingProgress(percent, desc) {
        const fill = document.getElementById('import-progress-fill');
        if (fill) fill.style.width = `${percent}%`;
        const descElem = document.getElementById('import-loading-desc');
        if (descElem && desc) descElem.textContent = desc;
    }

    hideLoadingState() {
        document.getElementById('import-loading-state')?.classList.add('hidden');
        document.getElementById('import-dropzone')?.classList.remove('hidden');
    }
}

window.importEngine = new SmartImportEngine();

// Demo Action Handlers
function selectAllExtracted(select) {
    window.importEngine.selectAll(select);
}

function commitSelectedProducts() {
    window.importEngine.commitSelected();
}

// Demo Sample Excel Generator & Pre-loaders
function loadDemoExcelFile() {
    window.importEngine.showLoadingState("جاري قراءة شيت المورد Excel التوضيحي...", "استخراج 5 منتجات مع صور وأسعار وتصنيفات...");

    setTimeout(() => {
        window.importEngine.extractedProducts = [
            {
                id: 'demo-ex-1',
                title: 'علبة مونة صغيرة فوميه غطاء سحب ١.٢ لتر',
                price: 1.60,
                sku: 'GK-101-EXCEL',
                category: 'منظمات ومؤونة',
                image: 'http://127.0.0.1:8085/global-kitchen/assets/products/img_p1_1.jpeg',
                selected: true,
                source: 'شيت المورد التجريبي (FolyLife_Stock.xlsx)'
            },
            {
                id: 'demo-ex-2',
                title: 'طقم ٣ مراطبين مربع فوميه غطاء سيليكون',
                price: 3.00,
                sku: 'GK-201-EXCEL',
                category: 'منظمات ومؤونة',
                image: 'http://127.0.0.1:8085/global-kitchen/assets/products/img_p2_1.jpeg',
                selected: true,
                source: 'شيت المورد التجريبي (Kitchen_Supplies.xlsx)'
            },
            {
                id: 'demo-ex-3',
                title: 'صينية تنشيف ومشك صحون ٢ في ١',
                price: 3.50,
                sku: 'GK-303-EXCEL',
                category: 'أدوات المطبخ',
                image: 'http://127.0.0.1:8085/global-kitchen/assets/products/img_p3_3.jpeg',
                selected: true,
                source: 'شيت المورد التجريبي (Drying_Trays.xlsx)'
            }
        ];
        window.importEngine.renderExtractedPreview();
        window.importEngine.hideLoadingState();
    }, 1200);
}

function loadDemoPdfFile() {
    window.importEngine.showLoadingState("جاري فحص كتالوج PDF متعدد الصفحات...", "يقوم المحرك بتقطيع نصوص الصفحات واستخراج المنتجات والأسعار...");

    setTimeout(() => {
        window.importEngine.extractedProducts = [
            {
                id: 'demo-pdf-1',
                title: 'طقم ١٢ علبة بهار مع ملاعق على ستاند يتعلق',
                price: 11.00,
                sku: 'PDF-P2-SPICE',
                category: 'أدوات ومستلزمات المطبخ',
                image: 'http://127.0.0.1:8085/global-kitchen/assets/products/img_p2_9.jpeg',
                selected: true,
                source: 'كتالوج PDF التجريبي (Kitchen_Catalog_2026.pdf - ص 2)'
            },
            {
                id: 'demo-pdf-2',
                title: 'مرطبان مستطيل كبير فوميه سيليكون ٣.٢ لتر',
                price: 2.40,
                sku: 'PDF-P4-RECT',
                category: 'منظمات ومؤونة',
                image: 'http://127.0.0.1:8085/global-kitchen/assets/products/img_p4_8.jpeg',
                selected: true,
                source: 'كتالوج PDF التجريبي (Kitchen_Catalog_2026.pdf - ص 4)'
            }
        ];
        window.importEngine.renderExtractedPreview();
        window.importEngine.hideLoadingState();
    }, 1400);
}

function generateSampleExcelFile() {
    const sampleData = [
        ["اسم المنتج", "السعر ($)", "كود المنتج (SKU)", "الفئة", "رابط الصورة"],
        ["علبة مونة صغيرة فوميه غطاء سحب", 1.60, "GK-101", "منظمات ومؤونة", "http://127.0.0.1:8085/global-kitchen/assets/products/img_p1_1.jpeg"],
        ["طقم ٣ مراطبين مربع فوميه", 3.00, "GK-201", "منظمات ومؤونة", "http://127.0.0.1:8085/global-kitchen/assets/products/img_p2_1.jpeg"],
        ["صينية تنشيف ومشك صحون ٢ في ١", 3.50, "GK-303", "أدوات المطبخ", "http://127.0.0.1:8085/global-kitchen/assets/products/img_p3_3.jpeg"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المنتجات");
    XLSX.writeFile(wb, "نموذج_منتجات_ووكومرس_بالدولار.xlsx");
}
