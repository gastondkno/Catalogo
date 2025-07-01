// admin.js (Versión completa y final para PHP/MySQL con ABM y pestañas)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const API_BASE_URL = 'api'; 
    const AUTH_TOKEN_KEY = 'joacoNorelliAdminToken_PHP';
    const LOGIN_PAGE_URL = 'login.html';
    const ADMIN_PAGE_URL = 'admin.html';

    // --- FUNCIONES DE AUTENTICACIÓN ---
    function getAuthToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
    function setAuthToken(token) { localStorage.setItem(AUTH_TOKEN_KEY, token); }
    function removeAuthToken() { localStorage.removeItem(AUTH_TOKEN_KEY); }
    function isLoggedIn() { return !!getAuthToken(); }
    function redirectToLogin() { if (!window.location.pathname.endsWith(`/${LOGIN_PAGE_URL}`)) { window.location.href = LOGIN_PAGE_URL; } }
    function redirectToAdminPanel() { if (!window.location.pathname.endsWith(`/${ADMIN_PAGE_URL}`)) { window.location.href = ADMIN_PAGE_URL; } }

    // --- FUNCIÓN GENÉRICA PARA FETCH ---
    async function fetchData(endpoint, options = {}) {
        const token = getAuthToken();
        const defaultHeaders = {};
        if (token) { defaultHeaders['Authorization'] = `Bearer ${token}`; }
        if (!(options.body instanceof FormData)) { defaultHeaders['Content-Type'] = 'application/json'; }
        options.headers = { ...defaultHeaders, ...options.headers };

        const requestUrl = `${API_BASE_URL}/${endpoint}`;
        
        try {
            const response = await fetch(requestUrl, options);
            const responseData = await response.json().catch(() => {
                return { 
                    success: false, 
                    message: `Respuesta del servidor no es JSON válido (Status: ${response.status} ${response.statusText})`
                };
            });

            if (!response.ok) { throw new Error(responseData.message || `Error del servidor: ${response.status}`); }
            if (responseData.success === false) { throw new Error(responseData.message); }
            return responseData;
        } catch (error) {
            console.error(`Error en la petición fetch a ${requestUrl}:`, error);
            throw error;
        }
    }

    // --- LÓGICA DE LA PÁGINA ---
    const loginFormEl = document.getElementById('loginForm');
    const adminPanelContainer = document.querySelector('.admin-main');

    // --- SI ESTAMOS EN LA PÁGINA DE LOGIN ---
    if (loginFormEl) {
        if (isLoggedIn()) { redirectToAdminPanel(); return; }

        loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginFormEl.username.value;
            const password = loginFormEl.password.value;
            const submitButton = loginFormEl.querySelector('button[type="submit"]');
            const loginMessageEl = document.getElementById('loginMessage');

            if (loginMessageEl) { loginMessageEl.textContent = ''; loginMessageEl.className = 'login-message'; }
            if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Verificando...'; }

            try {
                const data = await fetchData('login.php', {
                    method: 'POST',
                    body: JSON.stringify({ username, password }),
                });
                if (data.success && data.token) {
                    setAuthToken(data.token);
                    if (loginMessageEl) { loginMessageEl.textContent = 'Login exitoso. Redirigiendo...'; loginMessageEl.className = 'login-message success'; }
                    setTimeout(redirectToAdminPanel, 700);
                } else {
                    throw new Error(data.message || "Respuesta de login inválida.");
                }
            } catch (error) {
                console.error("[Admin.js] Error en el proceso de login:", error);
                if (loginMessageEl) { loginMessageEl.textContent = error.message; loginMessageEl.className = 'login-message error'; }
                if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Ingresar'; }
            }
        });
    }
    // --- SI ESTAMOS EN LA PÁGINA DE ADMIN ---
    else if (adminPanelContainer) {
        if (!isLoggedIn()) { redirectToLogin(); return; }
        
        const logoutButtonEl = document.getElementById('logoutButton');
        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');
        const productFormEl = document.getElementById('productForm');
        const productsTableBodyEl = document.getElementById('productsTableBody');
        const productCategorySelectEl = document.getElementById('productCategorySelect');
        const productImagePreviewEl = document.getElementById('imagePreview');
        const clearProductFormButtonEl = document.getElementById('clearProductFormButton');
        const productFormMessageEl = document.getElementById('productFormMessage');
        const categoryFormEl = document.getElementById('categoryForm');
        const categoriesTableBodyEl = document.getElementById('categoriesTableBody');
        const clearCategoryFormButtonEl = document.getElementById('clearCategoryFormButton');
        const categoryFormMessageEl = document.getElementById('categoryFormMessage');

        tabLinks.forEach(tab => {
            tab.addEventListener('click', () => {
                tabLinks.forEach(link => link.classList.remove('active'));
                tab.classList.add('active');
                
                const activeTabId = tab.dataset.tab;
                tabContents.forEach(content => {
                    content.style.display = content.id === activeTabId ? 'block' : 'none';
                    if(content.id === activeTabId) content.classList.add('active'); else content.classList.remove('active');
                });
            });
        });

        if (logoutButtonEl) { logoutButtonEl.addEventListener('click', () => { removeAuthToken(); redirectToLogin(); }); }

        async function fetchAndRenderAdminCategories() {
            try {
                const categories = await fetchData('categories_get.php');
                categoriesTableBodyEl.innerHTML = '';
                if (!categories || categories.length === 0) {
                    categoriesTableBodyEl.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay categorías creadas.</td></tr>`;
                    return;
                }
                categories.forEach(cat => {
                    const row = categoriesTableBodyEl.insertRow();
                    row.innerHTML = `<td>${cat.category_id}</td><td>${cat.name}</td><td>${cat.description || ''}</td><td><button class="btn-edit btn-edit-category" data-id="${cat.category_id}">Editar</button><button class="btn-delete btn-delete-category" data-id="${cat.category_id}">Eliminar</button></td>`;
                });
            } catch (error) {
                categoriesTableBodyEl.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error al cargar categorías: ${error.message}</td></tr>`;
            }
        }
        
        async function populateProductCategoryDropdown() {
            try {
                const categories = await fetchData('categories_get.php');
                productCategorySelectEl.innerHTML = '<option value="">Seleccione una categoría...</option>';
                if (categories && categories.length > 0) {
                    categories.forEach(cat => {
                        productCategorySelectEl.innerHTML += `<option value="${cat.category_id}">${cat.name}</option>`;
                    });
                }
            } catch (error) {
                productCategorySelectEl.innerHTML = `<option value="">Error al cargar</option>`;
            }
        }

        function clearCategoryForm() {
            categoryFormEl.reset();
            categoryFormEl.elements.categoryId.value = '';
            categoryFormEl.querySelector('button[type="submit"]').textContent = 'Guardar Categoría';
            if (categoryFormMessageEl) { categoryFormMessageEl.textContent = ''; categoryFormMessageEl.className = 'form-message'; }
        }

        categoryFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            const categoryId = this.elements.categoryId.value;
            const payload = {
                name: this.elements.name.value,
                description: this.elements.description.value
            };
            const endpoint = categoryId ? `category_update.php?id=${categoryId}` : 'category_create.php';
            
            categoryFormMessageEl.textContent = 'Guardando...';
            categoryFormMessageEl.className = 'form-message';
            try {
                const data = await fetchData(endpoint, { method: 'POST', body: JSON.stringify(payload) });
                categoryFormMessageEl.textContent = data.message;
                categoryFormMessageEl.className = 'form-message success';
                clearCategoryForm();
                await fetchAndRenderAdminCategories();
                await populateProductCategoryDropdown();
            } catch (error) {
                categoryFormMessageEl.textContent = error.message;
                categoryFormMessageEl.className = 'form-message error';
            }
            setTimeout(() => { if(categoryFormMessageEl) clearCategoryForm(); }, 2000);
        });

        clearCategoryFormButtonEl.addEventListener('click', clearCategoryForm);

        categoriesTableBodyEl.addEventListener('click', async (e) => {
            const target = e.target;
            const categoryId = target.dataset.id;
            
            if (target.classList.contains('btn-edit-category')) {
                const categoryRow = Array.from(categoriesTableBodyEl.rows).find(r => r.querySelector('.btn-edit-category')?.dataset.id === categoryId);
                if (categoryRow) {
                    categoryFormEl.categoryId.value = categoryId;
                    categoryFormEl.name.value = categoryRow.cells[1].textContent;
                    categoryFormEl.description.value = categoryRow.cells[2].textContent;
                    categoryFormEl.querySelector('button[type="submit"]').textContent = 'Actualizar Categoría';
                    window.scrollTo({ top: categoryFormEl.offsetTop - 20, behavior: 'smooth' });
                }
            } else if (target.classList.contains('btn-delete-category')) {
                if (confirm('¿Seguro que quieres eliminar esta categoría?')) {
                    try {
                        const data = await fetchData(`category_delete.php?id=${categoryId}`, { method: 'GET' });
                        alert(data.message);
                        fetchAndRenderAdminCategories();
                        populateProductCategoryDropdown();
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                    }
                }
            }
        });

        async function fetchAndRenderProducts() {
            try {
                const products = await fetchData('products_get.php');
                productsTableBodyEl.innerHTML = '';
                if (!products || products.length === 0) {
                    productsTableBodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay productos creados.</td></tr>`;
                    return;
                }
                products.forEach(p => {
                    const imageUrl = p.image_url ? p.image_url : 'https://via.placeholder.com/60x40?text=No+Img';
                    const row = productsTableBodyEl.insertRow();
                    row.innerHTML = `
                        <td><img src="${imageUrl}" alt="${p.name}"></td>
                        <td>${p.name}</td>
                        <td>${p.category_name || 'N/A'}</td>
                        <td>$${parseFloat(p.price).toFixed(2)}</td>
                        <td>${p.stock}</td>
                        <td>${p.is_active == 1 ? 'Sí' : 'No'}</td>
                        <td>
                            <button class="btn-edit btn-edit-product" data-product='${JSON.stringify(p)}'>Editar</button>
                            <button class="btn-delete btn-delete-product" data-id="${p.product_id}">Eliminar</button>
                        </td>`;
                });
            } catch (error) {
                productsTableBodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;">Error al cargar productos: ${error.message}</td></tr>`;
            }
        }
        
        function clearProductForm() {
            productFormEl.reset();
            productFormEl.elements.productId.value = '';
            productImagePreviewEl.style.display = 'none';
            productImagePreviewEl.src = '#';
            productFormEl.querySelector('button[type="submit"]').textContent = 'Guardar Producto';
            if (productFormMessageEl) { productFormMessageEl.textContent = ''; productFormMessageEl.className = 'form-message'; }
        }

        document.getElementById('productImage').addEventListener('change', function(){
            if(this.files[0]){
                const reader = new FileReader();
                reader.onload = e => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
        clearProductFormButtonEl.addEventListener('click', clearProductForm);

        productFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productId = this.elements.productId.value;
            const formData = new FormData(this);
            if (!this.elements.is_active.checked) {
                formData.set('is_active', '0');
            } else {
                 formData.set('is_active', '1');
            }
            
            const endpoint = productId ? `product_update.php?id=${productId}` : 'product_create.php';
            productFormMessageEl.textContent = 'Guardando...';
            productFormMessageEl.className = 'form-message';
            try {
                const data = await fetchData(endpoint, { method: 'POST', body: formData });
                productFormMessageEl.textContent = data.message;
                productFormMessageEl.className = 'form-message success';
                clearProductForm();
                await fetchAndRenderProducts();
            } catch (error) {
                productFormMessageEl.textContent = error.message;
                productFormMessageEl.className = 'form-message error';
            }
             setTimeout(() => { if(productFormMessageEl) clearProductForm(); }, 2000);
        });

        productsTableBodyEl.addEventListener('click', async (e) => {
             const target = e.target;
             const productId = target.dataset.id;
             if (target.classList.contains('btn-edit-product')) {
                const productDataString = target.dataset.product;
                if(productDataString) {
                    const p = JSON.parse(productDataString);
                    productFormEl.productId.value = p.product_id;
                    productFormEl.name.value = p.name;
                    productFormEl.description.value = p.description || '';
                    productFormEl.price.value = p.price;
                    productFormEl.category_id.value = p.category_id;
                    productFormEl.stock.value = p.stock;
                    productFormEl.discount_percentage.value = p.discount_percentage || 0;
                    productFormEl.is_active.checked = (p.is_active == 1);
                    
                    if (p.image_url) {
                        imagePreview.src = p.image_url;
                        imagePreview.style.display = 'block';
                    } else {
                        imagePreview.style.display = 'none';
                    }
                    productFormEl.querySelector('button[type="submit"]').textContent = 'Actualizar Producto';
                    window.scrollTo({ top: productFormEl.offsetTop - 20, behavior: 'smooth' });
                }
             } else if (target.classList.contains('btn-delete-product')) {
                if (confirm('¿Seguro que quieres eliminar este producto?')) {
                    try {
                        const data = await fetchData(`product_delete.php?id=${productId}`, { method: 'GET' });
                        alert(data.message);
                        fetchAndRenderProducts();
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                    }
                }
             }
        });
        
        async function initAdminPanel() {
            await populateProductCategoryDropdown();
            await fetchAndRenderAdminCategories();
            await fetchAndRenderProducts();
        }
        initAdminPanel();
    }
});