// admin.js (VERSIÓN COMPLETA RESTAURADA Y CORREGIDA)
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Admin.js - Full] DOMContentLoaded disparado.");

    // --- CONFIGURACIÓN ---
    const API_BASE_URL = 'http://localhost:5001/api';
    const SERVER_BASE_URL = 'http://localhost:5001'; // Para construir URLs completas de imágenes
    const AUTH_TOKEN_KEY = 'artisanOpticsAdminToken_vFinal'; // Key consistente
    const LOGIN_PAGE_URL = 'login.html';
    const ADMIN_PAGE_URL = 'admin.html';

    // --- FUNCIONES DE AUTENTICACIÓN ---
    function getAuthToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
    function setAuthToken(token) { localStorage.setItem(AUTH_TOKEN_KEY, token); }
    function removeAuthToken() { localStorage.removeItem(AUTH_TOKEN_KEY); }
    function isLoggedIn() {
        const token = !!getAuthToken();
        console.log("[Admin.js - Full] isLoggedIn check. Token exists:", token);
        return token;
    }
    function redirectToLogin() {
        console.log("[Admin.js - Full] Not logged in or wrong page, redirecting to login.");
        if (!window.location.pathname.endsWith(`/${LOGIN_PAGE_URL}`)) { window.location.href = LOGIN_PAGE_URL; }
    }
    function redirectToAdminPanel() {
        console.log("[Admin.js - Full] Redirecting to admin panel.");
        if (!window.location.pathname.endsWith(`/${ADMIN_PAGE_URL}`)) { window.location.href = ADMIN_PAGE_URL; }
    }

    // --- FUNCIÓN GENÉRICA PARA FETCH --- (Robusta)
    async function fetchData(endpoint, options = {}) {
        const token = getAuthToken();
        const defaultHeaders = {};
        if (token) { defaultHeaders['Authorization'] = `Bearer ${token}`; }
        if (!(options.body instanceof FormData)) { defaultHeaders['Content-Type'] = 'application/json'; }
        options.headers = { ...defaultHeaders, ...options.headers };

        console.log(`[Admin.js - Full fetchData] Request to: ${API_BASE_URL}${endpoint}, Method: ${options.method || 'GET'}`);
        if (options.body && !(options.body instanceof FormData)) console.log('[Admin.js - Full fetchData] JSON Payload:', options.body);
        else if (options.body instanceof FormData) console.log('[Admin.js - Full fetchData] Sending FormData.');

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        let responseData;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await response.json();
        } else {
            const textResponse = await response.text();
            console.warn(`[Admin.js - Full fetchData] Non-JSON response from ${endpoint}: Status ${response.status}, Body: ${textResponse.substring(0, 200)}...`);
            if (!response.ok) {
                throw new Error(textResponse || `Error HTTP ${response.status}: ${response.statusText}`);
            }
            return { _rawText: textResponse, success: response.ok };
        }

        console.log(`[Admin.js - Full fetchData] Response from ${API_BASE_URL}${endpoint}: Status ${response.status}`, responseData);

        if (!response.ok) {
            throw new Error(responseData.message || `Error HTTP ${response.status}: ${response.statusText || 'Server error'}`);
        }
        if (responseData.success === false && responseData.message) {
            throw new Error(responseData.message);
        }
        return responseData;
    }

    // --- LÓGICA PARA login.html ---
    const loginFormEl = document.getElementById('loginForm');
    if (loginFormEl) {
        console.log("[Admin.js - Full] Login page detected. Setting up form.");
        const loginMessageEl = document.getElementById('loginMessage');
        if (isLoggedIn()) { redirectToAdminPanel(); return; }

        loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("[Admin.js - Full] Login form submitted.");
            const username = loginFormEl.elements.username.value; // Usar .elements
            const password = loginFormEl.elements.password.value; // Usar .elements
            const submitButton = loginFormEl.querySelector('button[type="submit"]');

            if (loginMessageEl) { loginMessageEl.textContent = ''; loginMessageEl.className = 'login-message'; }
            if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Verificando...'; }

            try {
                const data = await fetchData('/auth/login', { // fetchData ya incluye API_BASE_URL
                    method: 'POST',
                    body: JSON.stringify({ username, password }), // Enviar 'username'
                });
                if (data.token) {
                    setAuthToken(data.token);
                    if (loginMessageEl) { loginMessageEl.textContent = 'Login exitoso. Redirigiendo...'; loginMessageEl.className = 'login-message success'; }
                    setTimeout(redirectToAdminPanel, 700);
                } else {
                     throw new Error(data.message || "Respuesta de login inválida (no hay token).");
                }
            } catch (error) {
                console.error("[Admin.js - Full Login] Error:", error);
                if (loginMessageEl) { loginMessageEl.textContent = error.message || 'Error en credenciales o servidor.'; loginMessageEl.className = 'login-message error'; }
            } finally {
                if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Ingresar'; }
            }
        });
    }
    // --- LÓGICA PARA admin.html ---
    // Verifica por un elemento que solo exista en admin.html para ejecutar esta lógica
    else if (document.getElementById('productForm') && document.getElementById('categoryForm')) {
        console.log("[Admin.js - Full] Admin page detected. Verifying login status.");
        if (!isLoggedIn()) { redirectToLogin(); return; }

        console.log("[Admin.js - Full] User is logged in. Initializing admin panel.");

        const logoutButtonEl = document.getElementById('logoutButton');
        if (logoutButtonEl) logoutButtonEl.addEventListener('click', () => { removeAuthToken(); redirectToLogin(); });

        // Selectores comunes de mensajes
        const productFormMessageEl = document.getElementById('productFormMessage');
        const categoryFormMessageEl = document.getElementById('categoryFormMessage');

        // === LÓGICA PARA CATEGORÍAS ===
        const categoryFormEl = document.getElementById('categoryForm');
        const categoriesTableBodyEl = document.getElementById('categoriesTableBody');
        const clearCategoryFormButtonEl = document.getElementById('clearCategoryFormButton');
        const productCategorySelectEl = document.getElementById('productCategorySelect');

        async function fetchAndRenderAdminCategories() {
            if (!categoriesTableBodyEl) { console.warn("categoriesTableBodyEl no encontrado"); return; }
            categoriesTableBodyEl.innerHTML = `<tr><td colspan="4" style="text-align:center;">Cargando categorías...</td></tr>`;
            try {
                const categories = await fetchData('/categories');
                categoriesTableBodyEl.innerHTML = '';
                if (!categories || categories.length === 0) {
                    categoriesTableBodyEl.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay categorías creadas.</td></tr>`;
                    return;
                }
                categories.forEach(cat => {
                    const row = categoriesTableBodyEl.insertRow();
                    row.innerHTML = `
                        <td>${cat.category_id || cat.id || 'N/A'}</td>
                        <td>${cat.name || 'N/A'}</td>
                        <td>${cat.description || ''}</td>
                        <td>
                            <button class="btn-edit btn-edit-category" data-id="${cat.category_id || cat.id}">Editar</button>
                            <button class="btn-delete btn-delete-category" data-id="${cat.category_id || cat.id}">Eliminar</button>
                        </td>`;
                });
            } catch (error) {
                console.error("[Admin] Error cargando categorías:", error);
                if (categoriesTableBodyEl) categoriesTableBodyEl.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error al cargar categorías: ${error.message}</td></tr>`;
            }
        }

        function clearCategoryForm() {
            if (categoryFormEl) {
                categoryFormEl.reset();
                if(categoryFormEl.elements.categoryId) categoryFormEl.elements.categoryId.value = '';
                const submitBtn = categoryFormEl.querySelector('button[type="submit"]');
                if(submitBtn) submitBtn.textContent = 'Guardar Categoría';
            }
            if (categoryFormMessageEl) { categoryFormMessageEl.textContent = ''; categoryFormMessageEl.className = 'form-message'; }
        }
        
        async function populateProductCategoryDropdown() {
            if (!productCategorySelectEl) { console.warn("productCategorySelectEl no encontrado"); return; }
            try {
                const categories = await fetchData('/categories');
                productCategorySelectEl.innerHTML = '<option value="">Seleccione una categoría...</option>';
                if (categories && categories.length > 0) {
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.name; // El backend de producto espera categoryName
                        option.textContent = category.name;
                        productCategorySelectEl.appendChild(option);
                    });
                } else {
                    productCategorySelectEl.innerHTML = '<option value="">No hay categorías disponibles</option>';
                }
            } catch (error) {
                console.error("Error poblando dropdown de categorías:", error);
                if (productCategorySelectEl) productCategorySelectEl.innerHTML = '<option value="">Error al cargar</option>';
            }
        }

        if (categoryFormEl) {
            categoryFormEl.addEventListener('submit', async function(e) {
                e.preventDefault();
                const categoryId = this.elements.categoryId.value;
                const name = this.elements.categoryNameInput.value;
                const description = this.elements.categoryDescriptionInput.value;
                const submitButton = this.querySelector('button[type="submit"]');

                if (submitButton) submitButton.disabled = true;
                if (categoryFormMessageEl) { categoryFormMessageEl.textContent = categoryId ? 'Actualizando categoría...' : 'Creando categoría...'; categoryFormMessageEl.className = 'form-message'; }

                const payload = { name, description };
                const method = categoryId ? 'PUT' : 'POST';
                const endpoint = categoryId ? `/categories/${categoryId}` : '/categories';

                try {
                    const data = await fetchData(endpoint, { method, body: JSON.stringify(payload) });
                    if (categoryFormMessageEl) { categoryFormMessageEl.textContent = data.message || (categoryId ? '¡Categoría actualizada!' : '¡Categoría creada!'); categoryFormMessageEl.className = 'form-message success';}
                    clearCategoryForm();
                    await fetchAndRenderAdminCategories();
                    await populateProductCategoryDropdown();
                } catch (error) {
                    console.error("[Admin] Error guardando categoría:", error);
                    if (categoryFormMessageEl) { categoryFormMessageEl.textContent = error.message; categoryFormMessageEl.className = 'form-message error';}
                } finally {
                    if (submitButton) submitButton.disabled = false;
                    setTimeout(() => { if(categoryFormMessageEl && categoryFormMessageEl.classList.contains('success')) { clearCategoryForm();} else if (categoryFormMessageEl) {categoryFormMessageEl.textContent = ''; categoryFormMessageEl.className = 'form-message';} }, 3000);
                }
            });
        }
        if (clearCategoryFormButtonEl) clearCategoryFormButtonEl.addEventListener('click', clearCategoryForm);

        if (categoriesTableBodyEl) {
            categoriesTableBodyEl.addEventListener('click', async (e) => {
                const target = e.target;
                const categoryId = target.dataset.id;

                if (target.classList.contains('btn-edit-category') && categoryId) {
                    if (categoryFormMessageEl) categoryFormMessageEl.textContent = `Cargando categoría ID: ${categoryId}...`;
                    try {
                        const categoryToEdit = await fetchData(`/categories/${categoryId}`);
                        if (categoryToEdit && categoryFormEl) {
                            categoryFormEl.elements.categoryId.value = categoryToEdit.category_id || categoryToEdit.id;
                            categoryFormEl.elements.categoryNameInput.value = categoryToEdit.name;
                            categoryFormEl.elements.categoryDescriptionInput.value = categoryToEdit.description || '';
                            categoryFormEl.querySelector('button[type="submit"]').textContent = 'Actualizar Categoría';
                            if (categoryFormMessageEl) {categoryFormMessageEl.textContent = `Editando: ${categoryToEdit.name}`; categoryFormMessageEl.className = 'form-message';}
                             window.scrollTo({ top: categoryFormEl.offsetTop - 20, behavior: 'smooth' });
                        } else { throw new Error("Datos de la categoría no encontrados."); }
                    } catch (error) {
                        console.error("[Admin] Error cargando categoría para editar:", error);
                        if (categoryFormMessageEl) { categoryFormMessageEl.textContent = error.message; categoryFormMessageEl.className = 'form-message error';}
                         setTimeout(() => { if (categoryFormMessageEl) {categoryFormMessageEl.textContent = ''; categoryFormMessageEl.className = 'form-message';} }, 4000);
                    }
                }
                if (target.classList.contains('btn-delete-category') && categoryId) {
                    if (confirm('¿Seguro que quieres eliminar esta categoría? Los productos asociados podrían quedar sin categoría.')) {
                        if (categoryFormMessageEl) categoryFormMessageEl.textContent = `Eliminando categoría ID: ${categoryId}...`;
                        try {
                            const data = await fetchData(`/categories/${categoryId}`, { method: 'DELETE' });
                            if(categoryFormMessageEl) { categoryFormMessageEl.textContent = data.message || 'Categoría eliminada.'; categoryFormMessageEl.className = 'form-message success';}
                            await fetchAndRenderAdminCategories();
                            await populateProductCategoryDropdown();
                        } catch (error) {
                            console.error("[Admin] Error al eliminar categoría:", error);
                            if(categoryFormMessageEl) { categoryFormMessageEl.textContent = error.message; categoryFormMessageEl.className = 'form-message error';}
                        } finally {
                             setTimeout(() => { if(categoryFormMessageEl) {categoryFormMessageEl.textContent = ''; categoryFormMessageEl.className = 'form-message';} }, 3000);
                        }
                    }
                }
            });
        }

        // === LÓGICA PARA PRODUCTOS ===
        const productFormEl = document.getElementById('productForm');
        const productsTableBodyEl = document.getElementById('productsTableBody');
        const productImagePreviewEl = document.getElementById('imagePreview');
        const productImageInputEl = document.getElementById('productImage');
        const clearProductFormButtonEl = document.getElementById('clearProductFormButton');

        async function fetchAndRenderAdminProducts() {
            if (!productsTableBodyEl) { console.warn("productsTableBodyEl no encontrado"); return; }
            productsTableBodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;">Cargando productos...</td></tr>`;
            try {
                const products = await fetchData('/products/admin/all');
                productsTableBodyEl.innerHTML = '';
                if(!products || products.length === 0) { productsTableBodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay productos creados.</td></tr>`; return; }
                products.forEach(p => {
                    const imageUrl = p.image_url ? `${SERVER_BASE_URL}${p.image_url}` : 'https://via.placeholder.com/60x40?text=No+Img';
                    const row = productsTableBodyEl.insertRow();
                    row.innerHTML = `
                        <td><img src="${imageUrl}" alt="${p.name || ''}" style="width:60px; height:auto; border-radius:4px; object-fit:cover;"></td>
                        <td>${p.name || 'N/A'}</td>
                        <td>${p.category_name || p.tipo || 'N/A'}</td>
                        <td>$${p.price != null ? parseFloat(p.price).toFixed(2) : 'N/A'}</td>
                        <td>${p.stock != null ? p.stock : 'N/A'}</td>
                        <td>${p.is_active ? 'Sí' : 'No'}</td>
                        <td>
                            <button class="btn-edit btn-edit-product" data-id="${p.product_id || p.id || p._id}">Editar</button>
                            <button class="btn-delete btn-delete-product" data-id="${p.product_id || p.id || p._id}">Eliminar</button>
                        </td>`;
                });
            } catch (error) {
                 console.error("[Admin] Error cargando productos:", error);
                if (productsTableBodyEl) productsTableBodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;">Error al cargar productos: ${error.message}</td></tr>`;
            }
        }

        function clearProductForm() {
            if (productFormEl) productFormEl.reset();
            if (document.getElementById('productId')) document.getElementById('productId').value = '';
            if (productImagePreviewEl) { productImagePreviewEl.style.display = 'none'; productImagePreviewEl.src = '#'; }
            const submitBtn = productFormEl.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Guardar Producto';
            if (productFormMessageEl) { productFormMessageEl.textContent = ''; productFormMessageEl.className = 'form-message'; }
        }

        if (productImageInputEl && productImagePreviewEl) {
             productImageInputEl.addEventListener('change', function() {
                const file = this.files[0];
                if (file) { 
                    const reader = new FileReader(); 
                    reader.onload = (e) => { productImagePreviewEl.src = e.target.result; productImagePreviewEl.style.display = 'block'; }; 
                    reader.readAsDataURL(file);
                } else { 
                    // No limpiar preview si se está editando y no se selecciona nuevo archivo
                    if (!productFormEl.elements.productId.value) { 
                        productImagePreviewEl.style.display = 'none'; 
                        productImagePreviewEl.src = '#'; 
                    }
                }
            });
        }
        if (clearProductFormButtonEl) clearProductFormButtonEl.addEventListener('click', clearProductForm);

        if (productFormEl) {
            productFormEl.addEventListener('submit', async function(e) {
                e.preventDefault();
                const productId = this.elements.productId.value;
                const submitButton = this.querySelector('button[type="submit"]');
                const formData = new FormData();

                formData.append('name', this.elements.productName.value);
                formData.append('description', this.elements.productDescription.value);
                formData.append('price', this.elements.productPrice.value);
                formData.append('categoryName', this.elements.productCategorySelect.value);
                formData.append('stock', this.elements.productStock.value);
                formData.append('discount_percentage', this.elements.productDiscount.value);
                formData.append('is_active', this.elements.productIsActive.checked);
                
                if (this.elements.productImage.files[0]) {
                    formData.append('image', this.elements.productImage.files[0]);
                }
                
                const method = productId ? 'PUT' : 'POST';
                const endpoint = productId ? `/products/${productId}` : '/products';

                if (submitButton) submitButton.disabled = true;
                if (productFormMessageEl) { productFormMessageEl.textContent = productId ? 'Actualizando producto...' : 'Creando producto...'; productFormMessageEl.className = 'form-message';}

                try {
                    const data = await fetchData(endpoint, { method, body: formData });
                    if (productFormMessageEl) { productFormMessageEl.textContent = data.message || (productId ? '¡Producto actualizado!' : '¡Producto creado!'); productFormMessageEl.className = 'form-message success';}
                    clearProductForm();
                    await fetchAndRenderAdminProducts();
                } catch (error) {
                    console.error("[Admin] Error guardando producto:", error);
                    if (productFormMessageEl) { productFormMessageEl.textContent = error.message || 'Error al guardar producto.'; productFormMessageEl.className = 'form-message error'; }
                } finally {
                    if (submitButton) submitButton.disabled = false;
                     setTimeout(() => { if(productFormMessageEl && productFormMessageEl.classList.contains('success')) {clearProductForm();} else if(productFormMessageEl) {productFormMessageEl.textContent = ''; productFormMessageEl.className = 'form-message';} }, 3000);
                }
            });
        }

        if (productsTableBodyEl) {
            productsTableBodyEl.addEventListener('click', async (e) => {
                const target = e.target;
                const productId = target.dataset.id;

                if (target.classList.contains('btn-edit-product') && productId) {
                    if (productFormMessageEl) productFormMessageEl.textContent = `Cargando producto ID: ${productId}...`;
                    try {
                        // --- CAMBIO IMPORTANTE AQUÍ ---
                        const productToEdit = await fetchData(`/products/admin/${productId}`); // Usar la nueva ruta de admin
                        // --- FIN DEL CAMBIO ---
                        
                        if (productToEdit && productFormEl) {
                            // ... (resto de tu lógica para rellenar el formulario) ...
                            productFormEl.elements.productId.value = productToEdit.product_id || productToEdit.id || productToEdit._id;
                            productFormEl.elements.productName.value = productToEdit.name || '';
                            productFormEl.elements.productDescription.value = productToEdit.description || '';
                            productFormEl.elements.productPrice.value = productToEdit.price || '';
                            // Para el select, usa category_name si tu productController.getAdminProductById lo devuelve
                            productFormEl.elements.productCategorySelect.value = productToEdit.category_name || productToEdit.tipo || '';
                            // O si getAdminProductById devuelve category_id_for_select y el <option value> es el ID:
                            // productFormEl.elements.productCategorySelect.value = productToEdit.category_id_for_select || '';
                            productFormEl.elements.productStock.value = productToEdit.stock != null ? productToEdit.stock : '';
                            productFormEl.elements.productDiscount.value = productToEdit.discount_percentage != null ? productToEdit.discount_percentage : '0';
                            productFormEl.elements.productIsActive.checked = productToEdit.is_active === true;

                            // ... (lógica de imagePreview) ...
                            if (productImagePreviewEl) {
                                if (productToEdit.image_url) {
                                    productImagePreviewEl.src = `${SERVER_BASE_URL}${productToEdit.image_url}`;
                                    productImagePreviewEl.style.display = 'block';
                                } else { 
                                    productImagePreviewEl.style.display = 'none'; 
                                    productImagePreviewEl.src = '#'; 
                                }
                            }
                            productFormEl.querySelector('button[type="submit"]').textContent = 'Actualizar Producto';
                            if (productFormMessageEl) { productFormMessageEl.textContent = `Editando: ${productToEdit.name}`; productFormMessageEl.className = 'form-message'; }
                            window.scrollTo({ top: productFormEl.offsetTop - 20, behavior: 'smooth' });
                        } else { 
                            throw new Error("No se pudo cargar el producto para editar (datos no recibidos o formato incorrecto)."); 
                        }
                    } catch (error) {
                        console.error("[Admin] Error cargando producto para editar:", error);
                        if (productFormMessageEl) { productFormMessageEl.textContent = error.message; productFormMessageEl.className = 'form-message error';}
                        setTimeout(() => { if (productFormMessageEl) {productFormMessageEl.textContent = ''; productFormMessageEl.className = 'form-message';} }, 4000);
                    }
                }
                if (target.classList.contains('btn-delete-product') && productId) {
                     if (confirm('¿Está seguro de que quiere eliminar este producto?')) {
                        if (productFormMessageEl) productFormMessageEl.textContent = `Eliminando producto ID: ${productId}...`;
                        try {
                            const data = await fetchData(`/products/${productId}`, { method: 'DELETE' });
                            if(productFormMessageEl) { productFormMessageEl.textContent = data.message || 'Producto eliminado.'; productFormMessageEl.className = 'form-message success';}
                            await fetchAndRenderAdminProducts();
                        } catch (error) {
                            console.error("[Admin] Error al eliminar producto:", error);
                            if(productFormMessageEl) { productFormMessageEl.textContent = error.message; productFormMessageEl.className = 'form-message error';}
                        } finally {
                            setTimeout(() => { if(productFormMessageEl) {productFormMessageEl.textContent = ''; productFormMessageEl.className = 'form-message';} }, 3000);
                        }
                    }
                }
            });
        }
        
        async function initAdminPanel() {
            console.log("[Admin.js - Full] Iniciando carga de datos del panel de admin...");
            await populateProductCategoryDropdown();
            await fetchAndRenderAdminCategories();
            await fetchAndRenderAdminProducts();
            console.log("[Admin.js - Full] Carga inicial de datos del panel completada.");
        }
        initAdminPanel();
    } else {
        console.warn("[Admin.js - Full] No se detectó página de login ni panel de admin esperado (faltan IDs de formularios).");
    }
});