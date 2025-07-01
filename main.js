// main.js (Versión completa y corregida)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const API_BASE_URL = 'api'; 

    // --- SELECTORES DOM ---
    const productGridEl = document.getElementById('productGrid');
    const productFiltersContainerEl = document.getElementById('productFiltersContainer');
    const productsAreaTitleEl = document.getElementById('productsAreaTitle');
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.main-nav .nav-link'); // <-- LA LÍNEA QUE FALTABA
    const productModalOverlayEl = document.getElementById('productModalOverlay');
    const productModalCloseBtnEl = document.getElementById('productModalCloseBtn');
    const productDetailContainerEl = document.getElementById('productDetailContainer');

    // --- ESTADO ---
    let allProducts = [];
    let allCategories = [];

    // --- VERIFICACIÓN INICIAL ---
    if (!productModalOverlayEl || !productModalCloseBtnEl || !productDetailContainerEl) {
        console.error("¡ERROR CRÍTICO! Uno o más elementos del modal no se encontraron en el DOM.");
    }

    // --- LÓGICA DE NAVEGACIÓN Y MENÚ MÓVIL ---
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            const isExpanded = mainNav.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isExpanded.toString());
            menuToggle.innerHTML = isExpanded ? '×' : '☰';
        });
    }

    if (navLinks) { // Verificamos que navLinks exista antes de usarlo
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    menuToggle.innerHTML = '☰';
                }
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    e.preventDefault();
                    navLinks.forEach(nav => nav.classList.remove('active'));
                    link.classList.add('active');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    // --- FUNCIÓN FETCH ---
    async function fetchDataNoToken(endpoint, options = {}) {
        const requestUrl = `${API_BASE_URL}/${endpoint}`;
        try {
            const response = await fetch(requestUrl, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Error HTTP ${response.status}` }));
                throw new Error(errorData.message);
            }
            return await response.json();
        } catch(error) {
            console.error(`Error en fetch a ${requestUrl}:`, error);
            throw error;
        }
    }

    // --- LÓGICA DE CATEGORÍAS Y FILTROS ---
    async function fetchCategoriesForFilters() {
        if (!productFiltersContainerEl) return;
        try {
            allCategories = await fetchDataNoToken('categories_get.php');
            populateProductFilterButtons();
        } catch (error) {
            console.error('Error al cargar categorías para filtros:', error);
            if (productFiltersContainerEl) productFiltersContainerEl.innerHTML = '<p class="error-message">Error al cargar filtros.</p>';
        }
    }

    function populateProductFilterButtons() {
        if (!productFiltersContainerEl) return;
        // Limpiamos solo los botones de categoría, no el de "Todos"
        productFiltersContainerEl.querySelectorAll('.btn-filter:not([data-category-name="todos"])').forEach(btn => btn.remove());
        
        if (allCategories && allCategories.length > 0) {
            allCategories.forEach(category => {
                if (category.name) {
                    const button = document.createElement('button');
                    button.className = 'btn btn-filter';
                    button.dataset.categoryName = category.name;
                    button.textContent = category.name;
                    productFiltersContainerEl.appendChild(button);
                }
            });
        }
        // Asignar listeners a todos los botones de filtro después de crearlos
        productFiltersContainerEl.querySelectorAll('.btn-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                filterProductsByCategory(e.currentTarget.dataset.categoryName);
                document.querySelectorAll('#productFiltersContainer .btn-filter').forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }
    
    function filterProductsByCategory(categoryName) {
        if (productsAreaTitleEl) { productsAreaTitleEl.textContent = categoryName === 'todos' ? 'Nuestro Catálogo' : `Catálogo: ${categoryName}`; }
        const activeProducts = allProducts.filter(p => p.is_active == 1);
        let productsToDisplay = activeProducts;
        if (categoryName !== 'todos') {
            productsToDisplay = activeProducts.filter(product => product.category_name === categoryName);
        }
        displayProducts(productsToDisplay);
    }
    
    // --- LÓGICA DE PRODUCTOS (GRID) ---
    async function fetchAndRenderProducts() {
        if (!productGridEl) return;
        productGridEl.innerHTML = '<p class="loading-message">Cargando productos...</p>';
        try {
            allProducts = await fetchDataNoToken('products_get.php');
            console.log("Productos recibidos del backend:", allProducts);
            filterProductsByCategory('todos');
        } catch (error) {
            console.error('Error en fetchAndRenderProducts:', error);
            if (productGridEl) productGridEl.innerHTML = `<p class="error-message">Error al cargar productos.</p>`;
        }
    }

    function displayProducts(products) {
        if (!productGridEl) return;
        productGridEl.innerHTML = '';
        if (!products || products.length === 0) {
            productGridEl.innerHTML = '<p style="text-align:center; width:100%;">No hay productos para mostrar en esta categoría.</p>';
            return;
        }
        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            const imageUrl = product.image_url ? product.image_url : 'https://via.placeholder.com/300x250?text=No+Imagen';
            
            let priceDisplay = `<p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>`;
            let discountBadge = '';
            if (product.discount_percentage && parseFloat(product.discount_percentage) > 0) {
                const discountedPrice = parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100);
                priceDisplay = `<div class="product-price"><span class="original-price">$${parseFloat(product.price).toFixed(2)}</span><span class="discounted-price">$${discountedPrice.toFixed(2)}</span></div>`;
                discountBadge = `<div class="discount-badge-card">${parseFloat(product.discount_percentage).toFixed(0)}% OFF</div>`;
            }

            let stockInfo = '';
            if (product.stock == 0) {
                stockInfo = '<p class="product-stock-status out-of-stock">Agotado</p>';
            } else if (product.stock != null && product.stock < 10) {
                stockInfo = `<p class="product-stock-status low-stock">¡Últimas unidades!</p>`;
            }

            card.innerHTML = `
                <div class="product-image-container">
                    ${discountBadge}
                    <img src="${imageUrl}" alt="${product.name || ''}">
                </div>
                <div class="product-info">
                    <p class="product-type">${product.category_name || 'Sin Categoría'}</p>
                    <h3>${product.name || 'Nombre no disponible'}</h3>
                    ${priceDisplay}
                    ${stockInfo}
                    <button class="btn view-details-btn" data-product-id="${product.product_id}">Ver Detalles</button>
                </div>`;
            productGridEl.appendChild(card);
            card.style.opacity = '0';
            card.style.animation = `slideInUp 0.5s ease-out ${index * 0.05 + 0.1}s forwards`;
        });
    }

    // --- LÓGICA DEL MODAL DE DETALLE ---
    function openProductModal() {
        if (!productModalOverlayEl) return;
        productModalOverlayEl.style.visibility = 'visible';
        productModalOverlayEl.classList.add('active');
        document.body.classList.add('modal-active');
    }

    function closeProductModal() {
        if (!productModalOverlayEl) return;
        productModalOverlayEl.classList.remove('active');
        setTimeout(() => {
            productModalOverlayEl.style.visibility = 'hidden';
            if(productDetailContainerEl) productDetailContainerEl.innerHTML = '';
        }, 300);
        document.body.classList.remove('modal-active');
    }

    function displayProductDetails(productId) {
        if (!productDetailContainerEl) return;
        productDetailContainerEl.innerHTML = '<p class="loading-message">Cargando...</p>';
        openProductModal();

        const product = allProducts.find(p => p.product_id == productId);

        if (!product) {
            productDetailContainerEl.innerHTML = `<p class="error-message">Error: Producto no encontrado.</p>`;
            return;
        }

        const imageUrl = product.image_url ? product.image_url : 'https://via.placeholder.com/400x300?text=No+Imagen';
        
        let priceDisplayHtml = `<div class="product-detail-price"><span class="discounted-price">$${parseFloat(product.price).toFixed(2)}</span></div>`;
        if (product.discount_percentage && parseFloat(product.discount_percentage) > 0) {
            const discountedPrice = parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100);
            priceDisplayHtml = `
                <div class="product-detail-price">
                    <span class="original-price">$${parseFloat(product.price).toFixed(2)}</span>
                    <span class="discounted-price">$${discountedPrice.toFixed(2)}</span>
                    <span class="discount-badge">${parseFloat(product.discount_percentage).toFixed(0)}% OFF</span>
                </div>`;
        }

        let stockInfo = '';
        if (product.stock == 0) stockInfo = '<p class="product-detail-stock out-of-stock">Agotado</p>';
        else if (product.stock != null && product.stock < 10) stockInfo = `<p class="product-detail-stock low-stock">¡Últimas ${product.stock} unidades!</p>`;
        
        const descriptionText = product.description || 'Descripción no disponible.';

        productDetailContainerEl.innerHTML = `
            <div class="product-detail-image-container">
                <img src="${imageUrl}" alt="${product.name}">
            </div>
            <div class="product-detail-info">
                <p class="product-detail-category">${product.category_name || 'Sin Categoría'}</p>
                <h2 class="product-detail-name">${product.name}</h2>
                ${priceDisplayHtml}
                <p class="product-detail-description">${descriptionText}</p>
                ${stockInfo}
            </div>`;
    }
    
    // --- EVENT LISTENERS ---
    if (productModalCloseBtnEl) productModalCloseBtnEl.addEventListener('click', closeProductModal);
    if (productModalOverlayEl) {
        productModalOverlayEl.addEventListener('click', (e) => {
            if (e.target === productModalOverlayEl) { closeProductModal(); }
        });
    }
    if (productGridEl) {
        productGridEl.addEventListener('click', (e) => {
            const button = e.target.closest('.view-details-btn');
            if (button) {
                e.preventDefault();
                const productId = button.dataset.productId;
                if (productId) {
                    displayProductDetails(productId);
                }
            }
        });
    }

    // --- INICIALIZACIÓN ---
    async function init() {
        console.log("[Main.js] Iniciando carga de la página...");
        await fetchCategoriesForFilters();
        await fetchAndRenderProducts();
        console.log("[Main.js] Carga inicial de la página completada.");
    }
    
    init();
});