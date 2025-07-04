// main.js (Versión Definitiva, Verificada y Funcional)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const API_BASE_URL = 'api';
    const UPLOADS_URL = 'uploads';

    // --- SELECTORES DOM ---
    const productGridEl = document.getElementById('productGrid');
    const productFiltersContainerEl = document.getElementById('productFiltersContainer');
    const productsAreaTitleEl = document.getElementById('productsAreaTitle');
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.main-nav .nav-link, .hero-section .btn-hero');
    const productModalOverlayEl = document.getElementById('productModalOverlay');
    const productModalCloseBtnEl = document.getElementById('productModalCloseBtn');
    const productDetailContainerEl = document.getElementById('productDetailContainer');

    // --- ESTADO ---
    let allProducts = [];
    let allCategories = [];

    // --- FUNCIONES ---

    async function fetchDataNoToken(endpoint) {
        const requestUrl = `${API_BASE_URL}/${endpoint}`;
        try {
            const response = await fetch(requestUrl);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error HTTP ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error en fetch a ${requestUrl}:`, error);
            throw error;
        }
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const imageUrl = product.images && product.images.length > 0 
            ? `${UPLOADS_URL}/${product.images[0].nombre_archivo}` 
            : `https://via.placeholder.com/400?text=No+Imagen`;

        const price = parseFloat(product.price);
        const discount = parseFloat(product.discount_percentage);
        let priceHtml = `<p class="product-price">$${price.toFixed(2)}</p>`;
        let discountBadgeHtml = '';

        if (discount > 0) {
            const discountedPrice = price * (1 - discount / 100);
            priceHtml = `<div class="product-price has-discount"><span class="original-price">$${price.toFixed(2)}</span><span class="discounted-price">$${discountedPrice.toFixed(2)}</span></div>`;
            discountBadgeHtml = `<div class="discount-badge-card">${discount.toFixed(0)}% OFF</div>`;
        }
        
        card.innerHTML = `
            <div class="product-image-container">
                ${discountBadgeHtml}
                <img src="${imageUrl}" alt="${product.name || 'Producto'}" loading="lazy">
            </div>
            <div class="product-info">
                <p class="product-type">${product.category_name || 'Sin Categoría'}</p>
                <h3>${product.name || 'Nombre no disponible'}</h3>
                ${priceHtml}
                <button class="btn btn-outline view-details-btn" data-product-id="${product.product_id}">Ver Detalles</button>
            </div>`;
        return card;
    }

    function displayProducts(products) {
        if (!productGridEl) return;
        productGridEl.innerHTML = '';

        if (!products || products.length === 0) {
            productGridEl.innerHTML = '<p class="list-message" style="grid-column: 1 / -1;">No hay productos para mostrar.</p>';
            return;
        }
        products.forEach(product => {
            const card = createProductCard(product);
            productGridEl.appendChild(card);
        });
    }
    
    function openProductModal() {
        if (productModalOverlayEl) productModalOverlayEl.classList.add('active');
        document.body.classList.add('modal-active');
    }

    function closeProductModal() {
        if (productModalOverlayEl) productModalOverlayEl.classList.remove('active');
        document.body.classList.remove('modal-active');
    }

    function displayProductDetails(productId) {
        openProductModal();
        if (!productDetailContainerEl) return;
        productDetailContainerEl.innerHTML = '<div class="loading-spinner"></div>';
        
        const product = allProducts.find(p => p.product_id == productId);

        if (!product) {
            productDetailContainerEl.innerHTML = `<p class="list-message error">Error: Producto no encontrado.</p>`;
            return;
        }

        let imageGalleryHtml = `<div class="product-detail-no-image"><i class="fas fa-image"></i><p>No hay imágenes</p></div>`;
        if (product.images && product.images.length > 0) {
            const mainImageSrc = `${UPLOADS_URL}/${product.images[0].nombre_archivo}`;
            const thumbnailsHtml = product.images.map((img, index) => 
                `<div class="thumbnail-item ${index === 0 ? 'active' : ''}" data-image-src="${UPLOADS_URL}/${img.nombre_archivo}">
                    <img src="${UPLOADS_URL}/${img.nombre_archivo}" alt="Miniatura">
                 </div>`
            ).join('');
            imageGalleryHtml = `
                <div class="main-image-wrapper"><img id="mainProductImage" src="${mainImageSrc}" alt="${product.name}"></div>
                ${product.images.length > 1 ? `<div class="thumbnail-track">${thumbnailsHtml}</div>` : ''}`;
        }
        
        const price = parseFloat(product.price);
        const discount = parseFloat(product.discount_percentage);
        let priceDisplayHtml = `<div class="product-detail-price-wrapper"><div class="product-detail-price">$${price.toFixed(2)}</div></div>`;
        if (discount > 0) {
            const discountedPrice = price * (1 - discount / 100);
            priceDisplayHtml = `<div class="product-detail-price-wrapper has-discount"><span class="original-price">$${price.toFixed(2)}</span><span class="discounted-price">$${discountedPrice.toFixed(2)}</span><span class="discount-badge">${discount.toFixed(0)}% OFF</span></div>`;
        }
        
        productDetailContainerEl.innerHTML = `
            <div class="product-detail-images">${imageGalleryHtml}</div>
            <div class="product-detail-info">
                <p class="product-detail-category">${product.category_name || 'Sin Categoría'}</p>
                <h2 class="product-detail-name">${product.name}</h2>
                ${priceDisplayHtml}
                <p class="product-detail-description">${product.description ? product.description.replace(/\n/g, '<br>') : 'Descripción no disponible.'}</p>
            </div>`;
        
        const thumbnails = productDetailContainerEl.querySelectorAll('.thumbnail-item');
        const mainImage = document.getElementById('mainProductImage');
        if (thumbnails.length > 0 && mainImage) {
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    const newImageSrc = this.dataset.imageSrc;
                    mainImage.style.opacity = '0';
                    setTimeout(() => { mainImage.src = newImageSrc; mainImage.style.opacity = '1'; }, 200);
                    thumbnails.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        }
    }

    function filterProductsByCategory(categoryName) {
        if (productsAreaTitleEl) productsAreaTitleEl.textContent = categoryName === 'todos' ? 'Nuestro Catálogo' : `Catálogo: ${categoryName}`;
        const activeProducts = allProducts.filter(p => p.is_active == 1);
        const productsToDisplay = categoryName === 'todos' ? activeProducts : activeProducts.filter(p => p.category_name === categoryName);
        displayProducts(productsToDisplay);
    }
    
    function populateProductFilterButtons() {
        if (!productFiltersContainerEl) return;
        const todosButton = productFiltersContainerEl.querySelector('.btn-filter[data-category-name="todos"]');
        
        productFiltersContainerEl.innerHTML = ''; // Limpiamos todo
        productFiltersContainerEl.appendChild(todosButton); // Volvemos a añadir el botón "Todos"

        if (allCategories && allCategories.length > 0) {
            allCategories.forEach(category => {
                const button = document.createElement('button');
                button.className = 'btn btn-filter';
                button.dataset.categoryName = category.name;
                button.textContent = category.name;
                productFiltersContainerEl.appendChild(button);
            });
        }

        // Re-asignamos los eventos a todos los botones de filtro
        productFiltersContainerEl.querySelectorAll('.btn-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                filterProductsByCategory(e.currentTarget.dataset.categoryName);
                document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    async function initializeApp() {
        // Asignar eventos a elementos estáticos que siempre existen
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                menuToggle.innerHTML = mainNav.classList.contains('active') ? '×' : '☰';
            });
        }
        if (productModalCloseBtnEl) {
            productModalCloseBtnEl.addEventListener('click', closeProductModal);
        }
        if (productModalOverlayEl) {
            productModalOverlayEl.addEventListener('click', (e) => {
                if (e.target === productModalOverlayEl) closeProductModal();
            });
        }
        
        // Asignar evento al contenedor del grid (Delegación de Eventos)
        if (productGridEl) {
            productGridEl.addEventListener('click', (e) => {
                const button = e.target.closest('.view-details-btn');
                if (button && button.dataset.productId) {
                    e.preventDefault();
                    displayProductDetails(button.dataset.productId);
                }
            });
        }

        // Cargar datos de la API
        if (productGridEl) {
            productGridEl.innerHTML = '<div class="loading-spinner"></div>';
            try {
                [allCategories, allProducts] = await Promise.all([
                    fetchDataNoToken('categories_get.php'),
                    fetchDataNoToken('products_get.php')
                ]);
                populateProductFilterButtons();
                filterProductsByCategory('todos');
            } catch (error) {
                productGridEl.innerHTML = `<p class="list-message error">Error al cargar el catálogo.</p>`;
            }
        }
    }

    // --- INICIALIZACIÓN ---
    initializeApp();
});