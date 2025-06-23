// main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const API_BASE_URL = 'http://localhost:5001/api';
    const SERVER_BASE_URL = 'http://localhost:5001'; // Para construir URLs completas de imágenes

    // --- SELECTORES DOM ---
    const productGridEl = document.getElementById('productGrid');
    const productsAreaTitleEl = document.getElementById('productsAreaTitle');
    const productFiltersContainerEl = document.getElementById('productFiltersContainer');
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.main-nav .nav-link');

    // Selectores del Modal
    const productModalOverlayEl = document.getElementById('productModalOverlay');
    const productModalCloseBtnEl = document.getElementById('productModalCloseBtn');
    const productDetailContainerEl = document.getElementById('productDetailContainer');

    console.log("[Main.js Init] Verificando selectores del modal:", 
        {productModalOverlayEl, productModalCloseBtnEl, productDetailContainerEl}
    );
    if (!productModalOverlayEl || !productModalCloseBtnEl || !productDetailContainerEl) {
        console.error("[Main.js Init] ¡ERROR! Uno o más elementos del modal no se encontraron en el DOM. Verifica los IDs en index.html.");
    }

    // --- ESTADO DE LA APLICACIÓN ---
    let allProducts = [];
    let allCategories = [];

    // --- NAVEGACIÓN Y MENÚ MÓVIL ---
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            const isExpanded = mainNav.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isExpanded.toString());
            menuToggle.innerHTML = isExpanded ? '×' : '☰';
        });
    }
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.innerHTML = '☰';
            }
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // --- FUNCIÓN GENÉRICA PARA FETCH (SIN TOKEN) ---
    async function fetchDataNoToken(endpoint, options = {}) {
        const defaultHeaders = {'Content-Type': 'application/json'};
        options.headers = { ...defaultHeaders, ...options.headers };
        console.log(`[fetchDataNoToken] Solicitud a: ${API_BASE_URL}${endpoint}, Metodo: ${options.method || 'GET'}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const responseData = await response.json().catch(() => ({ _fetchError: true, status: response.status, statusText: response.statusText, ok: response.ok }));
        console.log(`[fetchDataNoToken] Respuesta de ${API_BASE_URL}${endpoint}:`, response.status, responseData);
        if (!response.ok) {
            throw new Error(responseData.message || `Error HTTP ${response.status}: ${responseData.statusText || 'Error desconocido'}`);
        }
        if (responseData.success === false && responseData.message) {
             throw new Error(responseData.message);
        }
        return responseData;
    }

    // --- CATEGORÍAS Y FILTROS ---
    async function fetchCategoriesForFilters() {
        if (!productFiltersContainerEl) { console.warn("[Main.js Filters] productFiltersContainerEl no encontrado."); return; }
        console.log("[Main.js Filters] Intentando cargar categorías para filtros...");
        try {
            allCategories = await fetchDataNoToken('/categories');
            console.log("[Main.js Filters] Categorías recibidas:", allCategories);
            populateProductFilterButtons();
        } catch (error) {
            console.error('[Main.js Filters] Error al cargar categorías para filtros:', error);
            if (productFiltersContainerEl) productFiltersContainerEl.innerHTML = '<p class="error-message" style="text-align:center; width:100%;">Error al cargar filtros.</p>';
        }
    }

    function populateProductFilterButtons() {
        if (!productFiltersContainerEl) return;
        const existingCategoryButtons = productFiltersContainerEl.querySelectorAll('.btn-filter:not([data-category-name="todos"])');
        existingCategoryButtons.forEach(btn => btn.remove());
        if (allCategories && allCategories.length > 0) {
            allCategories.forEach(category => {
                if (!category.name) return;
                const button = document.createElement('button');
                button.classList.add('btn', 'btn-filter');
                button.dataset.categoryName = category.name;
                button.textContent = category.name;
                button.addEventListener('click', () => {
                    filterProductsByCategory(category.name);
                    document.querySelectorAll('#productFiltersContainer .btn-filter').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                });
                productFiltersContainerEl.appendChild(button);
            });
        }
    }
    
    function filterProductsByCategory(categoryName) {
        if (productsAreaTitleEl) { productsAreaTitleEl.textContent = categoryName === 'todos' ? 'Nuestro Catálogo' : `Catálogo: ${categoryName}`; }
        let productsToDisplay = allProducts;
        if (categoryName !== 'todos') {
            productsToDisplay = allProducts.filter(product => product.tipo === categoryName);
        }
        displayProducts(productsToDisplay);
    }

    const allFilterButton = document.querySelector('#productFiltersContainer .btn-filter[data-category-name="todos"]');
    if (allFilterButton) {
        allFilterButton.addEventListener('click', () => {
            filterProductsByCategory('todos');
            document.querySelectorAll('#productFiltersContainer .btn-filter').forEach(btn => btn.classList.remove('active'));
            allFilterButton.classList.add('active');
        });
    }

    // --- PRODUCTOS (GRID PRINCIPAL) ---
    async function fetchAndRenderProducts() {
        if (!productGridEl) { console.error("[Main.js Products] productGridEl no encontrado."); return; }
        productGridEl.innerHTML = '<p class="loading-message">Cargando productos...</p>';
        try {
            allProducts = await fetchDataNoToken('/products');
            console.log("[Main.js Products] Todos los productos cargados:", allProducts);
            const activeFilterButton = document.querySelector('#productFiltersContainer .btn-filter.active');
            const currentCategoryFilter = activeFilterButton ? activeFilterButton.dataset.categoryName : 'todos';
            filterProductsByCategory(currentCategoryFilter);
        } catch (error) {
            console.error('[Main.js Products] Error en fetchAndRenderProducts:', error);
            if (productGridEl) productGridEl.innerHTML = `<p class="error-message">Error al cargar productos: ${error.message}.</p>`;
        }
    }

    function displayProducts(products) {
        if (!productGridEl) { console.error("[Main.js Display] productGridEl no encontrado."); return; }
        productGridEl.innerHTML = '';
        if (!products || products.length === 0) {
            productGridEl.innerHTML = '<p style="text-align:center; width:100%;">No hay productos para mostrar en esta categoría.</p>';
            return;
        }
        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            // DEBUGGING DE IMAGEN:
    const rawImageUrlFromDB = product.image_url;
    const finalImageUrlForImgTag = rawImageUrlFromDB ? `${SERVER_BASE_URL}${rawImageUrlFromDB}` : 'https://via.placeholder.com/300x250/cccccc/000000?text=No+Imagen';
    console.log(`Producto: ${product.name}, DB image_url: ${rawImageUrlFromDB}, Final src: ${finalImageUrlForImgTag}`);
        const imageUrl = product.image_url ? `${SERVER_BASE_URL}${product.image_url}` : 'https://via.placeholder.com/300x250/cccccc/000000?text=No+Imagen';            let priceDisplay = `$${parseFloat(product.price).toFixed(2)}`;
            if (product.discount_percentage && parseFloat(product.discount_percentage) > 0) {
                const discountedPrice = parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100);
                priceDisplay = `<span class="original-price">$${parseFloat(product.price).toFixed(2)}</span> <span class="discounted-price">$${discountedPrice.toFixed(2)}</span> <span class="discount-badge">${parseFloat(product.discount_percentage).toFixed(0)}% OFF</span>`;
            }
            card.innerHTML = `
                <div class="product-image-container"><img src="${imageUrl}" alt="${product.name || 'Anteojo'}"></div>
                <div class="product-info">
                    <h3>${product.name || 'Nombre no disponible'}</h3>
                    <p class="product-type">${product.tipo || 'Categoría no especificada'}</p>
                    <p class="product-price">${priceDisplay}</p>
                    ${product.stock === 0 ? '<p class="product-stock-status out-of-stock">Agotado</p>' : (product.stock !== null && product.stock < 10) ? `<p class="product-stock-status low-stock">¡Últimas ${product.stock} unidades!</p>` : ''}
                    <button class="btn btn-secondary btn-sm view-details-btn" data-product-id="${product.product_id || product._id}">Ver Detalles</button>
                </div>`;
            productGridEl.appendChild(card);
            card.style.opacity = '0';
            card.style.animation = `slideInUp 0.5s ease-out ${index * 0.05 + 0.1}s forwards`;
        });
    }

    // --- MODAL DE DETALLE DE PRODUCTO ---
    function openProductModal() {
        if (productModalOverlayEl) {
            console.log("[Main.js Modal] Abriendo modal...");
            productModalOverlayEl.style.display = 'flex';
            setTimeout(() => { productModalOverlayEl.classList.add('active'); }, 10);
            document.body.classList.add('modal-active');
        } else { console.error("[Main.js Modal] ERROR: productModalOverlayEl no encontrado."); }
    }

    function closeProductModal() {
        if (productModalOverlayEl) {
            console.log("[Main.js Modal] Cerrando modal...");
            productModalOverlayEl.classList.remove('active');
            setTimeout(() => {
                if (!productModalOverlayEl.classList.contains('active')) {
                    productModalOverlayEl.style.display = 'none';
                }
            }, 300); // Coincide con la duración de la transición de opacidad CSS
            document.body.classList.remove('modal-active');
            if(productDetailContainerEl) productDetailContainerEl.innerHTML = '<p class="loading-message">Cargando detalles...</p>';
        } else { console.error("[Main.js Modal] ERROR: productModalOverlayEl no encontrado."); }
    }

    async function fetchAndDisplayProductDetails(productId) {
        if (!productDetailContainerEl) { console.error("[Main.js Modal] productDetailContainerEl no encontrado."); return; }
        
        productDetailContainerEl.innerHTML = '<p class="loading-message">Cargando detalles del producto...</p>';
        openProductModal();

        try {
            console.log(`[Main.js Modal] Solicitando detalles para producto ID: ${productId}`);
            const product = await fetchDataNoToken(`/products/${productId}`);
            console.log("[Main.js Modal] Detalles del producto recibidos:", product);

            if (product && product.success !== false ) { // product.success puede no venir si todo está OK
                const imageUrl = product.image_url ? `${SERVER_BASE_URL}${product.image_url}` : 'https://via.placeholder.com/400x300/cccccc/000000?text=No+Imagen';
                
                let priceDisplayHtml = ''; // Para construir el HTML del precio
                let finalPriceToShow = parseFloat(product.price);

                if (product.discount_percentage && parseFloat(product.discount_percentage) > 0) {
                    const discount = parseFloat(product.discount_percentage) / 100;
                    finalPriceToShow = parseFloat(product.price) * (1 - discount);
                    
                    priceDisplayHtml = `
                        <span class="original-price" style="font-size: 1.1rem; text-decoration: line-through; color: var(--text-muted-color); margin-right: 8px;">
                            $${parseFloat(product.price).toFixed(2)}
                        </span>
                        <span class="discounted-price" style="font-size: 1.8rem; font-weight: 700; color: var(--primary-color);">
                            $${finalPriceToShow.toFixed(2)}
                        </span>
                        <span class="discount-badge" style="margin-left: 8px; background-color: var(--error-color); color: white; font-size: 0.8em; padding: 0.2em 0.6em; border-radius: 4px; font-weight: bold; vertical-align: middle; display: inline-block;">
                            ${parseFloat(product.discount_percentage).toFixed(0)}% OFF
                        </span>
                    `;
                } else {
                    // Si no hay descuento, solo mostramos el precio normal, pero con el mismo estilo principal
                    priceDisplayHtml = `<span style="font-size: 1.8rem; font-weight: 700; color: var(--primary-color);">$${finalPriceToShow.toFixed(2)}</span>`;
                }

                let stockInfo = '';
                if (product.stock === 0) { stockInfo = '<p class="product-detail-stock out-of-stock">Agotado</p>'; }
                else if (product.stock !== null && product.stock < 10) { stockInfo = `<p class="product-detail-stock low-stock">¡Últimas ${product.stock} unidades!</p>`; }
                else if (product.stock !== null) { stockInfo = `<p class="product-detail-stock">Stock disponible: ${product.stock}</p>`; }

                productDetailContainerEl.innerHTML = `
                    <div class="product-detail-image-container">
                        <img src="${imageUrl}" alt="${product.name || 'Anteojo'}" class="product-detail-image">
                    </div>
                    <div class="product-detail-info">
                        <h2 class="product-detail-name">${product.name || 'Nombre no disponible'}</h2>
                        <p class="product-detail-category">Categoría: ${product.tipo || 'N/A'}</p>
                        <p class="product-detail-price">${priceDisplayHtml}</p>
                        <p class="product-detail-description">${product.description || 'Descripción no disponible.'}</p>
                        ${stockInfo}
                    </div>`;
            } else {
                productDetailContainerEl.innerHTML = `<p class="error-message">No se pudieron cargar los detalles: ${product.message || 'Datos del producto no encontrados o error.'}</p>`;
            }
        } catch (error) {
            console.error('[Main.js Modal] Error al cargar detalles del producto:', error);
            if (productDetailContainerEl) productDetailContainerEl.innerHTML = `<p class="error-message">Error al cargar detalles: ${error.message}</p>`;
        }
    }
    
    // Event listeners para el modal
    if (productModalCloseBtnEl) {
        productModalCloseBtnEl.addEventListener('click', closeProductModal);
    } else { console.warn("[Main.js Modal] El botón para cerrar el modal (productModalCloseBtnEl) no fue encontrado."); }

    if (productModalOverlayEl) {
        productModalOverlayEl.addEventListener('click', (e) => {
            if (e.target === productModalOverlayEl) { closeProductModal(); }
        });
    } else { console.warn("[Main.js Modal] El overlay del modal (productModalOverlayEl) no fue encontrado."); }

    // Event listener para los botones "Ver Detalles"
    if (productGridEl) {
        productGridEl.addEventListener('click', (e) => {
            const button = e.target.closest('.view-details-btn');
            if (button) {
                e.preventDefault();
                const productId = button.dataset.productId;
                console.log(`[Main.js Grid Click] Botón 'Ver Detalles' presionado para ID: ${productId}`);
                if (productId) {
                    fetchAndDisplayProductDetails(productId);
                } else { console.error("[Main.js Grid Click] No se encontró productId en el botón.", button); }
            }
        });
    } else { console.warn("[Main.js] productGridEl no encontrado para el listener de 'Ver Detalles'."); }

    // --- INICIALIZACIÓN ---
    async function init() {
        console.log("[Main.js Init] Iniciando carga de la página...");
        await fetchCategoriesForFilters();
        await fetchAndRenderProducts(); // Esto ya se encarga de llamar a filter y display
        console.log("[Main.js Init] Carga inicial de la página completada.");
    }

    init();
});