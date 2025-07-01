// main.js (Versión final simplificada, sin subdominio)
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    // API_BASE_URL ahora es una ruta relativa a la carpeta 'api'.
    // El navegador automáticamente usará el dominio actual (https://joaconorelli.store).
    const API_BASE_URL = 'api'; 

    // --- SELECTORES DOM ---
    const productGridEl = document.getElementById('productGrid');
    const productsAreaTitleEl = document.getElementById('productsAreaTitle');
    const productFiltersContainerEl = document.getElementById('productFiltersContainer');
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    const productModalOverlayEl = document.getElementById('productModalOverlay');
    const productModalCloseBtnEl = document.getElementById('productModalCloseBtn');
    const productDetailContainerEl = document.getElementById('productDetailContainer');

    console.log("[Main.js Init] Verificando selectores del modal:", 
        {productModalOverlayEl, productModalCloseBtnEl, productDetailContainerEl}
    );
    if (!productModalOverlayEl || !productModalCloseBtnEl || !productDetailContainerEl) {
        console.error("[Main.js Init] ¡ERROR! Uno o más elementos del modal no se encontraron en el DOM.");
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
        
        // La URL se construye correctamente, ej: 'api/categories_get.php'
        const requestUrl = `${API_BASE_URL}/${endpoint}`;
        
        console.log(`[fetchDataNoToken] Solicitud a: ${requestUrl}, Metodo: ${options.method || 'GET'}`);
        
        try {
            const response = await fetch(requestUrl, options);
            const responseData = await response.json().catch(() => ({ 
                _fetchError: true, 
                status: response.status, 
                statusText: response.statusText, 
                ok: response.ok,
                message: `Respuesta del servidor no es JSON válido (Status: ${response.status})`
            }));
            
            console.log(`[fetchDataNoToken] Respuesta de ${requestUrl}:`, response.status, responseData);

            if (!response.ok) {
                throw new Error(responseData.message || `Error HTTP ${response.status}: ${responseData.statusText || 'Error desconocido'}`);
            }
            return responseData;
        } catch(error) {
            console.error(`[fetchDataNoToken] Error en fetch:`, error);
            throw error;
        }
    }

    // --- CATEGORÍAS Y FILTROS ---
    async function fetchCategoriesForFilters() {
        if (!productFiltersContainerEl) return;
        console.log("[Main.js Filters] Intentando cargar categorías para filtros...");
        try {
            allCategories = await fetchDataNoToken('categories_get.php');
            console.log("[Main.js Filters] Categorías recibidas:", allCategories);
            populateProductFilterButtons();
        } catch (error) {
            console.error('[Main.js Filters] Error al cargar categorías para filtros:', error);
            if (productFiltersContainerEl) productFiltersContainerEl.innerHTML = '<p class="error-message">Error al cargar filtros.</p>';
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
            productsToDisplay = allProducts.filter(product => product.category_name === categoryName);
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
        if (!productGridEl) return;
        productGridEl.innerHTML = '<p class="loading-message">Cargando productos...</p>';
        try {
            allProducts = await fetchDataNoToken('products_get.php');
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
        if (!productGridEl) return;
        productGridEl.innerHTML = '';
        if (!products || products.length === 0) {
            productGridEl.innerHTML = '<p style="text-align:center; width:100%;">No hay productos para mostrar.</p>';
            return;
        }
        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            const imageUrl = product.image_url ? product.image_url : 'https://via.placeholder.com/300x250?text=No+Imagen';
            
            let priceDisplay = `$${parseFloat(product.price).toFixed(2)}`;
            if (product.discount_percentage && parseFloat(product.discount_percentage) > 0) {
                const discountedPrice = parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100);
                priceDisplay = `<span class="original-price">$${parseFloat(product.price).toFixed(2)}</span> <span class="discounted-price">$${discountedPrice.toFixed(2)}</span> <span class="discount-badge">${parseFloat(product.discount_percentage).toFixed(0)}% OFF</span>`;
            }

            card.innerHTML = `
                <div class="product-image-container"><img src="${imageUrl}" alt="${product.name || 'Anteojo'}"></div>
                <div class="product-info">
                    <h3>${product.name || 'Nombre no disponible'}</h3>
                    <p class="product-type">${product.category_name || 'Categoría no especificada'}</p>
                    <p class="product-price">${priceDisplay}</p>
                    ${product.stock == 0 ? '<p class="product-stock-status out-of-stock">Agotado</p>' : (product.stock != null && product.stock < 10) ? `<p class="product-stock-status low-stock">¡Últimas ${product.stock} unidades!</p>` : ''}
                    <button class="btn btn-secondary btn-sm view-details-btn" data-product-id="${product.product_id}">Ver Detalles</button>
                </div>`;
            productGridEl.appendChild(card);
            card.style.opacity = '0';
            card.style.animation = `slideInUp 0.5s ease-out ${index * 0.05 + 0.1}s forwards`;
        });
    }

    // --- MODAL DE DETALLE DE PRODUCTO ---
    function openProductModal() { /* ... (sin cambios) ... */ }
    function closeProductModal() { /* ... (sin cambios) ... */ }
    async function fetchAndDisplayProductDetails(productId) {
        if (!productDetailContainerEl) return;
        productDetailContainerEl.innerHTML = '<p class="loading-message">Cargando detalles...</p>';
        openProductModal();

        try {
            const product = allProducts.find(p => p.product_id == productId);
            if (product) {
                const imageUrl = product.image_url ? product.image_url : 'https://via.placeholder.com/400x300?text=No+Imagen';
                let priceDisplayHtml = `$${parseFloat(product.price).toFixed(2)}`;
                if (product.discount_percentage && parseFloat(product.discount_percentage) > 0) { /* ... (código de descuento sin cambios) ... */ }
                let stockInfo = '';
                if (product.stock == 0) { stockInfo = '<p class="product-detail-stock out-of-stock">Agotado</p>'; }
                else if (product.stock != null && product.stock < 10) { stockInfo = `<p class="product-detail-stock low-stock">¡Últimas ${product.stock} unidades!</p>`; }
                else if (product.stock != null) { stockInfo = `<p class="product-detail-stock">Stock disponible: ${product.stock}</p>`; }

                productDetailContainerEl.innerHTML = `
                    <div class="product-detail-image-container"><img src="${imageUrl}" alt="${product.name}"></div>
                    <div class="product-detail-info">
                        <h2 class="product-detail-name">${product.name}</h2>
                        <p class="product-detail-category">Categoría: ${product.category_name || 'N/A'}</p>
                        <div class="product-detail-price">${priceDisplayHtml}</div>
                        <p class="product-detail-description">${product.description || ''}</p>
                        ${stockInfo}
                    </div>`;
            } else {
                throw new Error('Producto no encontrado.');
            }
        } catch (error) {
            console.error('[Main.js Modal] Error al cargar detalles del producto:', error);
            if (productDetailContainerEl) productDetailContainerEl.innerHTML = `<p class="error-message">Error al cargar detalles: ${error.message}</p>`;
        }
    }
    
    // --- EVENT LISTENERS ---
    if (productModalCloseBtnEl) productModalCloseBtnEl.addEventListener('click', closeProductModal);
    if (productModalOverlayEl) productModalOverlayEl.addEventListener('click', (e) => { if (e.target === productModalOverlayEl) { closeProductModal(); } });
    if (productGridEl) {
        productGridEl.addEventListener('click', (e) => {
            const button = e.target.closest('.view-details-btn');
            if (button) {
                e.preventDefault();
                const productId = button.dataset.productId;
                if (productId) { fetchAndDisplayProductDetails(productId); }
            }
        });
    }

    // --- INICIALIZACIÓN ---
    async function init() {
        console.log("[Main.js Init] Iniciando carga de la página...");
        await fetchCategoriesForFilters();
        await fetchAndRenderProducts();
        console.log("[Main.js Init] Carga inicial de la página completada.");
    }

    init();
});