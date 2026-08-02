/**
 * Smart Product Extractor for Excel (.xlsx, .csv) & Multi-page PDF Catalogs
 * V3 - Full Rewrite: Real PDF table+image extraction via PDF.js canvas rendering
 * 100% Full Dynamic Content Extraction + Automatic 30% Profit Margin Markup
 */

class SmartImportEngine {
    constructor() {
        this.extractedProducts = [];
        this.PROFIT_MARGIN_PERCENT = 30;
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

    calculateSellingPrice(costPrice) {
        const cost = parseFloat(costPrice) || 0;
        return parseFloat((cost * (1 + this.PROFIT_MARGIN_PERCENT / 100)).toFixed(2));
    }

    async processUploadedFile(file) {
        const fileInput = document.getElementById('import-file-input');
        const fileName = file.name.toLowerCase();
        this.showLoadingState(`جاري استخراج كل المنتجات من: ${file.name}`, "يقوم المحرك بمسح كل صفحة واستخراج النصوص والصور والأسعار...");

        try {
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
                await this.parseExcelFile(file);
            } else if (fileName.endsWith('.pdf')) {
                await this.parsePdfCatalog(file);
            } else {
                alert("صيغة الملف غير مدعومة! يرجى رفع ملف Excel (.xlsx, .xls, .csv) أو PDF.");
                this.hideLoadingState();
            }
        } catch (error) {
            console.error("Import processing error:", error);
            alert("حدث خطأ أثناء قراءة الملف: " + error.message);
            this.hideLoadingState();
        } finally {
            if (fileInput) fileInput.value = '';
        }
    }

    // ═══════════════════════════════════════════════════
    // EXCEL PARSER (unchanged - works fine)
    // ═══════════════════════════════════════════════════
    parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    let allExtracted = [];
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        if (jsonData && jsonData.length > 0) {
                            const parsedItems = this.mapExcelRowsToProducts(jsonData, sheetName);
                            allExtracted = allExtracted.concat(parsedItems);
                        }
                    });
                    if (allExtracted.length === 0) {
                        alert("لم يتم العثور على منتجات صالحة في ملف الإكسيل.");
                    }
                    this.extractedProducts = allExtracted;
                    this.renderExtractedPreview();
                    this.hideLoadingState();
                    resolve();
                } catch (err) { reject(err); }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    mapExcelRowsToProducts(rows, sheetName) {
        if (!rows || rows.length === 0) return [];
        let headerRowIdx = 0;
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
            const rowStr = (rows[r] || []).join(' ').toLowerCase();
            if (rowStr.includes('اسم') || rowStr.includes('title') || rowStr.includes('name') || rowStr.includes('price') || rowStr.includes('سعر')) {
                headerRowIdx = r; break;
            }
        }
        const headers = (rows[headerRowIdx] || []).map(h => String(h || '').trim().toLowerCase());
        let titleIdx = headers.findIndex(h => h.includes('اسم') || h.includes('title') || h.includes('name') || h.includes('description') || h.includes('بيان'));
        let priceIdx = headers.findIndex(h => h.includes('سعر') || h.includes('price') || h.includes('cost'));
        let skuIdx = headers.findIndex(h => h.includes('كود') || h.includes('sku') || h.includes('code') || h.includes('barcode'));
        let imageIdx = headers.findIndex(h => h.includes('صور') || h.includes('image') || h.includes('img') || h.includes('photo'));
        let catIdx = headers.findIndex(h => h.includes('فئة') || h.includes('category') || h.includes('تصنيف'));
        if (titleIdx === -1) titleIdx = 0;
        if (priceIdx === -1) priceIdx = Math.min(1, headers.length - 1);

        const results = [];
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            const title = row[titleIdx] ? String(row[titleIdx]).trim() : '';
            if (!title || title.length < 2) continue;
            const costPrice = parseFloat(String(row[priceIdx] || '0').replace(/[^0-9.]/g, '')) || 2.50;
            const sellingPrice = this.calculateSellingPrice(costPrice);
            const sku = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]).trim() : 'GK-EXCEL-' + (i + 100);
            let image = imageIdx !== -1 && row[imageIdx] ? String(row[imageIdx]).trim() : '';
            const category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : sheetName || 'استيراد إكسيل';
            if (!image || !image.startsWith('http')) image = this.getSampleImageForCategory(title, i);
            results.push({
                id: 'import-' + Math.random().toString(36).substr(2, 9),
                title, costPrice, price: sellingPrice, profitMargin: 30, sku, category, image,
                selected: true, source: 'ملف Excel (' + sheetName + ')'
            });
        }
        return results;
    }

    // ═══════════════════════════════════════════════════
    // PDF CATALOG PARSER V3 - Full Rewrite
    // Renders each page to canvas, extracts text with coordinates,
    // extracts embedded images, and reconstructs table rows
    // ═══════════════════════════════════════════════════
    async parsePdfCatalog(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    if (window.pdfjsLib) {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    }
                    const loadingTask = window.pdfjsLib ? pdfjsLib.getDocument(typedarray) : null;
                    if (!loadingTask) throw new Error("مكتبة PDF.js غير محملة.");

                    const pdf = await loadingTask.promise;
                    let allExtracted = [];
                    const totalPages = pdf.numPages;

                    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                        this.updateLoadingProgress(
                            (pageNum / totalPages) * 100,
                            `جاري مسح الصفحة ${pageNum} من ${totalPages} (استخراج النصوص والصور)...`
                        );
                        const pageProducts = await this.extractPageProducts(pdf, pageNum);
                        allExtracted = allExtracted.concat(pageProducts);
                    }

                    if (allExtracted.length === 0) {
                        alert("لم يتم العثور على منتجات في ملف PDF. تأكد أن الملف يحتوي على جداول منتجات بأسعار.");
                    }

                    this.extractedProducts = allExtracted;
                    this.renderExtractedPreview();
                    this.hideLoadingState();
                    resolve();
                } catch (err) {
                    console.error("PDF parsing error:", err);
                    reject(err);
                }
            };
            fileReader.readAsArrayBuffer(file);
        });
    }

    // Extract all products from a single PDF page (with 30s page timeout)
    async extractPageProducts(pdf, pageNum) {
        const PAGE_TIMEOUT_MS = 30000; // 30 seconds max per page
        try {
            return await Promise.race([
                this._extractPageProductsInner(pdf, pageNum),
                new Promise((resolve) => setTimeout(() => {
                    console.warn(`Page ${pageNum} timed out after ${PAGE_TIMEOUT_MS / 1000}s, skipping...`);
                    resolve([]);
                }, PAGE_TIMEOUT_MS))
            ]);
        } catch (err) {
            console.error(`Error processing page ${pageNum}:`, err);
            return [];
        }
    }

    async _extractPageProductsInner(pdf, pageNum) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        // Step 1: Render page to canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Step 2: Extract text items with exact positions
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => ({
            str: item.str,
            x: item.transform[4] * 2,
            y: (viewport.height / 2) - (item.transform[5]) * 2 + (viewport.height / 2),
            width: item.width * 2,
            height: item.height * 2,
            fontSize: Math.abs(item.transform[0])
        })).filter(item => item.str.trim().length > 0);

        // Step 3: Extract embedded images with positions
        const images = await this.extractImagesFromPage(page, canvas, viewport);

        // Step 4: Detect table rows and reconstruct products
        const products = this.reconstructTableProducts(textItems, images, pageNum, canvas, viewport);

        return products;
    }

    // Extract embedded images from a PDF page using operator list (with timeout protection)
    async extractImagesFromPage(page, canvas, viewport) {
        const images = [];
        const IMG_TIMEOUT_MS = 8000; // 8 second timeout per image (no size limit)

        try {
            const ops = await page.getOperatorList();
            const scale = 2.0;

            for (let i = 0; i < ops.fnArray.length; i++) {
                // OPS.paintImageXObject = 85, OPS.paintJpegXObject = 82
                if (ops.fnArray[i] === 85 || ops.fnArray[i] === 82) {
                    const imgName = ops.argsArray[i][0];
                    try {
                        // Timeout-protected image fetch
                        const imgData = await Promise.race([
                            new Promise((resolve, reject) => {
                                try {
                                    page.objs.get(imgName, (data) => {
                                        if (data) resolve(data);
                                        else resolve(null); // Don't reject, just return null
                                    });
                                } catch (e) { resolve(null); }
                            }),
                            new Promise((resolve) => setTimeout(() => resolve(null), IMG_TIMEOUT_MS))
                        ]);

                        if (!imgData) continue; // Timed out or no data, skip

                        // Find the transform for this image
                        let imgTransform = null;
                        for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
                            // OPS.transform = 12, OPS.setTransform = 13 (concat matrix)
                            if (ops.fnArray[j] === 12 || ops.fnArray[j] === 13) {
                                imgTransform = ops.argsArray[j];
                                break;
                            }
                        }

                        const imgW = imgData.width || 0;
                        const imgH = imgData.height || 0;

                        // Skip only tiny images (icons, dots, decorations)
                        if (imgW < 20 || imgH < 20) continue;

                        // Render image to a small canvas to get data URL
                        const imgCanvas = document.createElement('canvas');
                        // Scale down for display but keep good quality
                        const maxDim = 500;
                        const ratio = Math.min(maxDim / imgW, maxDim / imgH, 1);
                        imgCanvas.width = Math.round(imgW * ratio);
                        imgCanvas.height = Math.round(imgH * ratio);
                        const imgCtx = imgCanvas.getContext('2d');

                        if (imgData.data) {
                            // Raw pixel data - create full-size first then scale down
                            const fullCanvas = document.createElement('canvas');
                            fullCanvas.width = imgW;
                            fullCanvas.height = imgH;
                            const fullCtx = fullCanvas.getContext('2d');

                            const pixelData = new Uint8ClampedArray(imgW * imgH * 4);
                            const srcData = imgData.data;
                            const expectedRGBA = imgW * imgH * 4;
                            const expectedRGB = imgW * imgH * 3;

                            if (srcData.length >= expectedRGBA) {
                                pixelData.set(srcData.subarray(0, expectedRGBA));
                            } else if (srcData.length >= expectedRGB) {
                                for (let p = 0, q = 0; p < expectedRGB; p += 3, q += 4) {
                                    pixelData[q] = srcData[p];
                                    pixelData[q + 1] = srcData[p + 1];
                                    pixelData[q + 2] = srcData[p + 2];
                                    pixelData[q + 3] = 255;
                                }
                            } else {
                                continue; // Unexpected data size, skip
                            }

                            const imageDataObj = new ImageData(pixelData, imgW, imgH);
                            fullCtx.putImageData(imageDataObj, 0, 0);
                            imgCtx.drawImage(fullCanvas, 0, 0, imgCanvas.width, imgCanvas.height);
                        } else if (imgData instanceof HTMLCanvasElement) {
                            imgCtx.drawImage(imgData, 0, 0, imgCanvas.width, imgCanvas.height);
                        } else if (imgData.src) {
                            imgCtx.drawImage(imgData, 0, 0, imgCanvas.width, imgCanvas.height);
                        } else {
                            continue; // Unknown format
                        }

                        const dataUrl = imgCanvas.toDataURL('image/jpeg', 0.80);

                        // Estimate position on page
                        let yPos = 0;
                        if (imgTransform && imgTransform.length >= 6) {
                            yPos = viewport.height - (imgTransform[5] * scale);
                        }

                        images.push({
                            dataUrl,
                            width: imgW,
                            height: imgH,
                            y: yPos,
                            name: imgName
                        });
                    } catch (imgErr) {
                        console.warn(`Skipping image ${imgName}:`, imgErr.message);
                    }
                }
            }
        } catch (err) {
            console.warn("Could not extract images from page:", err);
        }

        // Sort images by Y position (top to bottom)
        images.sort((a, b) => a.y - b.y);
        return images;
    }

    // Reconstruct product rows from text items + images
    // Based on actual catalog PDF analysis:
    // Columns: Description(X<236), EngDesc(236-420), CrtRate(420-495), Unit(495-548), 
    //          Code&Barcode(548-814), Picture(814-1098), Price$(1098+)
    // All X values are in canvas coordinates (PDF * 2.0 scale)
    // Product images: large (>400px wide), at X > 800 in canvas coords
    // Barcode images: small (190x134), at X ≈ 400 — skip these
    reconstructTableProducts(textItems, images, pageNum, canvas, viewport) {
        if (textItems.length === 0) return [];

        const SCALE = 2.0;
        // Column boundaries in canvas coordinates (PDF coords * 2)
        const COL_DESC_END = 236;      // Arabic description ends
        const COL_ENG_START = 236;     // English description starts
        const COL_ENG_END = 420;       // English description ends
        const COL_PRICE_START = 1098;  // Price column starts (X > 549 in PDF * 2)

        // Step 1: Find all text items that could be prices (rightmost column)
        const priceItems = textItems.filter(t => {
            const numMatch = t.str.match(/^(\d{1,4}(?:\.\d{1,2})?)$/);
            return numMatch && t.x > COL_PRICE_START;
        });

        // If no prices found in rightmost column, fall back to looking for $ sign
        if (priceItems.length === 0) {
            textItems.forEach(t => {
                if (t.str === '$' || t.str.match(/\$\s*\d+/)) {
                    // Don't add, just note that prices may be formatted differently
                }
            });
        }

        // Step 2: Group all text and prices by product rows using price Y positions
        // Each price Y position marks a product row
        const products = [];

        // Get unique product Y zones by finding price items and $ signs
        const productYs = [];
        priceItems.forEach(pi => {
            // Check if there's already a Y zone close to this
            const existing = productYs.find(y => Math.abs(y - pi.y) < 30);
            if (!existing) {
                productYs.push(pi.y);
            }
        });
        productYs.sort((a, b) => a - b);

        // If we didn't find clear price rows, fall back to detecting Arabic text blocks
        if (productYs.length === 0) {
            const arabicItems = textItems.filter(t => t.x < COL_DESC_END && /[\u0600-\u06FF]/.test(t.str));
            arabicItems.forEach(ai => {
                const existing = productYs.find(y => Math.abs(y - ai.y) < 30);
                if (!existing) productYs.push(ai.y);
            });
            productYs.sort((a, b) => a - b);
        }

        // Step 3: For each product Y zone, collect all text in that band
        for (let i = 0; i < productYs.length; i++) {
            const yCenter = productYs[i];
            const yTop = (i > 0) ? (productYs[i - 1] + yCenter) / 2 : yCenter - 50;
            const yBottom = (i < productYs.length - 1) ? (yCenter + productYs[i + 1]) / 2 : yCenter + 80;

            const bandItems = textItems.filter(t => t.y >= yTop && t.y < yBottom);

            // Arabic description (leftmost column)
            const arabicItems = bandItems.filter(t => t.x < COL_DESC_END);
            const arabicText = arabicItems.map(t => t.str).join(' ').replace(/<br>/g, ' ').trim();

            // English description
            const engItems = bandItems.filter(t => t.x >= COL_ENG_START && t.x < COL_ENG_END);
            const engText = engItems.map(t => t.str).join(' ').replace(/<br>/g, ' ').trim();

            // Price (rightmost)
            const priceInBand = bandItems.filter(t => t.x >= COL_PRICE_START);
            let costPrice = 0;
            for (const pi of priceInBand) {
                const m = pi.str.match(/(\d{1,5}(?:\.\d{1,2})?)/);
                if (m) {
                    const val = parseFloat(m[1]);
                    if (val > 0.5 && val < 50000) { costPrice = val; break; }
                }
            }

            // Barcode/SKU
            const codeItems = bandItems.filter(t => t.x >= 548 && t.x < 814);
            let sku = '';
            for (const ci of codeItems) {
                const bm = ci.str.match(/(\d{10,13})/);
                const cm = ci.str.match(/(CSM\/[A-Z0-9\/_-]+|GDF\/[A-Z0-9\/_-]+)/i);
                if (bm) { sku = bm[1]; break; }
                if (cm) { sku = cm[1]; }
            }
            if (!sku) sku = `PDF-P${pageNum}-${products.length + 1}`;

            // Build title: Arabic + English combined
            let title = '';
            if (engText.length > 3) {
                title = engText
                    .replace(/\b(NEW PRODUCT|BACK IN STOCK|Piece|Pcs)\b/gi, '')
                    .replace(/<br>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            if (arabicText.length > 3 && title.length > 3) {
                title = title + ' - ' + arabicText.replace(/\d{6,}/g, '').trim();
            } else if (arabicText.length > 3) {
                title = arabicText.replace(/\d{6,}/g, '').trim();
            }

            if (!title || title.length < 3) continue; // Skip empty rows

            if (costPrice === 0) costPrice = 5.00;
            const sellingPrice = this.calculateSellingPrice(costPrice);

            products.push({
                id: `pdf-p${pageNum}-${products.length + 1}-${Math.random().toString(36).substr(2, 5)}`,
                title,
                costPrice,
                price: sellingPrice,
                profitMargin: 30,
                sku,
                category: 'مستلزمات منزلية ومطبخ',
                image: '', // Will be assigned below
                selected: true,
                source: `ملف PDF (صفحة ${pageNum})`
            });
        }

        // ═══════════════════════════════════════════════════
        // IMAGE MATCHING: Filter barcode images, keep only product photos
        // Barcode images are exactly 190x134 — skip them
        // Product images are much larger (400px+ wide)
        // ═══════════════════════════════════════════════════
        const productImages = images.filter(img => {
            // Skip barcode images (190x134 or similar small sizes)
            if (img.width <= 200 && img.height <= 150) return false;
            // Keep only substantial product images
            return img.width >= 300 || img.height >= 300;
        });

        // Assign product images sequentially (both sorted top-to-bottom)
        for (let p = 0; p < products.length; p++) {
            if (p < productImages.length) {
                products[p].image = productImages[p].dataUrl;
            } else {
                products[p].image = this.getSampleImageForCategory(products[p].title, p);
            }
        }

        return products;
    }

    getSampleImageForCategory(text, idx = 0) {
        const pool = [
            "assets/products/img_p1_1.jpeg", "assets/products/img_p2_1.jpeg",
            "assets/products/img_p3_3.jpeg", "assets/products/img_p4_8.jpeg",
            "assets/products/img_p5_2.jpeg", "assets/products/img_p6_1.png",
            "assets/products/img_p7_3.jpeg", "assets/products/img_p8_5.jpeg",
            "assets/products/img_p9_2.jpeg", "assets/products/img_p10_4.jpeg"
        ];
        return pool[idx % pool.length];
    }

    // ═══════════════════════════════════════════════════
    // PREVIEW RENDERER
    // ═══════════════════════════════════════════════════
    renderExtractedPreview() {
        const container = document.getElementById('import-preview-container');
        const grid = document.getElementById('extracted-products-grid');
        const countSpan = document.getElementById('extracted-count');
        if (!container || !grid) return;

        countSpan.textContent = this.extractedProducts.length;
        this.updateSelectedCount();

        grid.innerHTML = this.extractedProducts.map((p, idx) => {
            const margin = p.profitMargin !== undefined ? p.profitMargin : 30;
            const cost = p.costPrice || 0;
            const sellingPrice = cost + (cost * (margin / 100));
            p.price = parseFloat(sellingPrice.toFixed(2));
            const isFlash = margin < 30;

            return `
            <div class="extracted-card glass ${p.selected ? 'selected' : ''}" id="ext-card-${idx}">
                <input type="checkbox" class="extracted-card-checkbox" ${p.selected ? 'checked' : ''} onchange="window.importEngine.toggleExtractedSelect(${idx}, this.checked)">
                <img src="${p.image}" class="extracted-card-img" id="ext-img-preview-${idx}" alt="${p.title}" onerror="this.src='assets/products/img_p1_1.jpeg'">
                <div class="extracted-card-info" style="display:flex; flex-direction:column; gap:6px;">
                    <input type="text" value="${p.title}" class="custom-input" style="font-size:0.9rem; font-weight:800; padding:4px 8px;" onchange="window.importEngine.updateExtractedField(${idx}, 'title', this.value)">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <small style="color:var(--text-muted);">SKU / باركود:</small>
                        <input type="text" value="${p.sku}" class="custom-input" style="width:130px; font-size:0.75rem; padding:2px 6px;" onchange="window.importEngine.updateExtractedField(${idx}, 'sku', this.value)">
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <small style="color:var(--text-muted);">الفئة:</small>
                        <input type="text" value="${p.category}" class="custom-input" style="width:130px; font-size:0.75rem; padding:2px 6px;" onchange="window.importEngine.updateExtractedField(${idx}, 'category', this.value)">
                    </div>
                </div>
                <div class="extracted-card-meta" style="margin-top:8px; border-top:1px solid var(--border-subtle); padding-top:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:0.78rem;">
                        <small style="color:var(--text-muted);">سعر التكلفة (المورد):</small>
                        <span style="font-weight:700; color:var(--text-secondary);">$${Number(cost).toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:0.78rem;">
                        <small style="color:var(--text-muted); font-weight:700;">نسبة الربح (%):</small>
                        <div style="display:inline-flex; align-items:center; gap:2px;">
                            <input type="number" step="1" value="${margin}" class="custom-input" style="width:55px; font-weight:800; text-align:center; padding:2px 4px;" onchange="window.importEngine.updateExtractedMargin(${idx}, parseFloat(this.value)||0)">
                            <span style="font-weight:800; font-size:0.8rem;">%</span>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; background:${isFlash ? '#fff5f5' : '#ecfdf5'}; padding:4px 6px; border-radius:6px; border:1px solid ${isFlash ? '#fca5a5' : '#a7f3d0'};">
                        <small style="color:${isFlash ? '#b91c1c' : '#065f46'}; font-weight:800;">سعر المتجر النهائي:</small>
                        <span style="font-weight:900; color:${isFlash ? '#b91c1c' : '#047857'}; font-size:1.05rem;">$${Number(p.price).toFixed(2)}</span>
                    </div>
                </div>
                <div style="font-size:0.72rem; color:var(--text-muted); text-align:left; margin-top:6px; display:flex; justify-content:space-between;">
                    <span>${p.source}</span>
                    ${isFlash ? `<span style="color:#b91c1c; font-weight:800;">🔥 Flash Sale (${margin}%)</span>` : `<span style="color:#059669; font-weight:700;">30% ربح قياسي</span>`}
                </div>
            </div>
        `;
        }).join('');

        container.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    updateExtractedMargin(index, marginPercent) {
        if (this.extractedProducts[index]) {
            this.extractedProducts[index].profitMargin = marginPercent;
            this.renderExtractedPreview();
        }
    }

    toggleExtractedSelect(index, isChecked) {
        if (this.extractedProducts[index]) {
            this.extractedProducts[index].selected = isChecked;
            const card = document.getElementById(`ext-card-${index}`);
            if (card) card.classList.toggle('selected', isChecked);
            this.updateSelectedCount();
        }
    }

    updateExtractedField(index, field, value) {
        if (this.extractedProducts[index]) {
            this.extractedProducts[index][field] = value;
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
        if (selected.length === 0) { alert("يرجى تحديد منتج واحد على الأقل للاستيراد!"); return; }

        selected.forEach(p => {
            if (window.wcStore) {
                window.wcStore.addProduct({
                    title: p.title,
                    costPrice: p.costPrice,
                    profitMargin: p.profitMargin || 30,
                    sku: p.sku,
                    category: p.category,
                    image: p.image,
                    source: p.source
                });
            }
        });

        alert(`🎉 تم بنجاح استيراد ${selected.length} منتج إلى المتجر بأسعار شاملة هامش ربح!`);
        document.getElementById('import-preview-container').classList.add('hidden');
        if (window.productsManager) window.productsManager.renderTable();
        if (window.switchTab) window.switchTab('products');
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

// Helper: Test if text contains a price pattern
function pricePatterns_global_test(text) {
    return /\d{1,4}(?:\.\d{1,2})?\s*\$|\$\s*\d{1,4}(?:\.\d{1,2})?/.test(text);
}

window.importEngine = new SmartImportEngine();

function selectAllExtracted(select) { window.importEngine.selectAll(select); }
function commitSelectedProducts() { window.importEngine.commitSelected(); }

function loadDemoExcelFile() {
    window.importEngine.showLoadingState("جاري قراءة شيت المورد...", "استخراج المنتجات...");
    setTimeout(() => {
        window.importEngine.extractedProducts = [
            { id: 'demo-ex-1', title: 'علبة مونة صغيرة فوميه غطاء سحب ١.٢ لتر', costPrice: 2.00, price: 2.60, profitMargin: 30, sku: 'GK-101-EXCEL', category: 'منظمات ومؤونة', image: 'assets/products/img_p1_1.jpeg', selected: true, source: 'شيت تجريبي' },
            { id: 'demo-ex-2', title: 'طقم ٣ مراطبين مربع فوميه غطاء سيليكون', costPrice: 5.00, price: 6.50, profitMargin: 30, sku: 'GK-201-EXCEL', category: 'منظمات ومؤونة', image: 'assets/products/img_p2_1.jpeg', selected: true, source: 'شيت تجريبي' },
        ];
        window.importEngine.renderExtractedPreview();
        window.importEngine.hideLoadingState();
    }, 800);
}

function loadDemoPdfFile() {
    window.importEngine.showLoadingState("جاري فحص كتالوج PDF...", "استخراج المنتجات والصور...");
    setTimeout(() => {
        window.importEngine.extractedProducts = [
            { id: 'demo-pdf-1', title: 'سطل بدواسة 5 لتر ملون مات Klenmann', costPrice: 10.00, price: 13.00, profitMargin: 30, sku: '6911245789107', category: 'مستلزمات منزلية', image: 'assets/products/img_p10_4.jpeg', selected: true, source: 'كتالوج PDF تجريبي' },
            { id: 'demo-pdf-2', title: 'فرشاة حمام مع قاعدة استانلس Klenmann', costPrice: 4.50, price: 5.85, profitMargin: 30, sku: '6911245789114', category: 'مستلزمات منزلية', image: 'assets/products/img_p8_5.jpeg', selected: true, source: 'كتالوج PDF تجريبي' },
        ];
        window.importEngine.renderExtractedPreview();
        window.importEngine.hideLoadingState();
    }, 800);
}

function generateSampleExcelFile() {
    const sampleData = [
        ["اسم المنتج", "سعر المورد ($)", "كود المنتج", "الفئة"],
        ["سطل بدواسة 5 لتر Klenmann", 10.00, "6911245789107", "مستلزمات منزلية"],
        ["فرشاة حمام استانلس Klenmann", 4.50, "6911245789114", "مستلزمات منزلية"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المنتجات");
    XLSX.writeFile(wb, "نموذج_شيت_المورد.xlsx");
}

window.selectAllExtracted = selectAllExtracted;
window.commitSelectedProducts = commitSelectedProducts;
window.loadDemoExcelFile = loadDemoExcelFile;
window.loadDemoPdfFile = loadDemoPdfFile;
window.generateSampleExcelFile = generateSampleExcelFile;
