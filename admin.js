// admin.js (Versión completa, depurada y final con estructura defensiva)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const API_BASE_URL = 'api'; 
    const UPLOADS_URL = 'uploads';
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
            if (response.status === 401) {
                removeAuthToken();
                redirectToLogin();
                throw new Error("Sesión expirada. Por favor, inicie sesión de nuevo.");
            }
            const responseData = await response.json().catch(() => ({ 
                success: false, 
                message: `Respuesta del servidor no es JSON válido (Status: ${response.status} ${response.statusText})`
            }));
            if (!response.ok) { throw new Error(responseData.message || `Error del servidor: ${response.status}`); }
            if (responseData.success === false) { throw new Error(responseData.message); }
            return responseData;
        } catch (error) {
            console.error(`Error en fetch a ${requestUrl}:`, error);
            throw error;
        }
    }

    // --- LÓGICA DE LA PÁGINA ---
    const loginFormEl = document.getElementById('loginForm');
    const adminPanelContainer = document.querySelector('.admin-main');

    // --- PÁGINA DE LOGIN ---
    if (loginFormEl) {
        if (isLoggedIn()) { redirectToAdminPanel(); return; }

        loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginFormEl.username.value;
            const password = loginFormEl.password.value;
            const submitButton = loginFormEl.querySelector('button[type="submit"]');
            const loginMessageEl = document.getElementById('loginMessage');

            if (loginMessageEl) { loginMessageEl.textContent = ''; loginMessageEl.className = 'form-message'; }
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
                }
            } catch (error) {
                if (loginMessageEl) { loginMessageEl.textContent = error.message || "Error desconocido en el login."; loginMessageEl.className = 'login-message error'; }
                if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Ingresar'; }
            }
        });
    }
    // --- PÁGINA DEL PANEL DE ADMINISTRACIÓN ---
    else if (adminPanelContainer) {
        if (!isLoggedIn()) { redirectToLogin(); return; }
        
        // --- INICIO: CÓDIGO SOLO PARA EL PANEL DE ADMIN ---
        const logoutButtonEl = document.getElementById('logoutButton');
        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');
        const productFormEl = document.getElementById('productForm');
        const productsTableBodyEl = document.getElementById('productsTableBody');
        const productCategorySelectEl = document.getElementById('productCategorySelect');
        const clearProductFormButtonEl = document.getElementById('clearProductFormButton');
        const productFormMessageEl = document.getElementById('productFormMessage');
        const productImagesInputEl = document.getElementById('productImages');
        const existingImagesPreviewEl = document.getElementById('existingImagesPreview');
        const newImagesPreviewEl = document.getElementById('newImagesPreview');
        const categoryFormEl = document.getElementById('categoryForm');
        const categoriesTableBodyEl = document.getElementById('categoriesTableBody');
        const clearCategoryFormButtonEl = document.getElementById('clearCategoryFormButton');
        const categoryFormMessageEl = document.getElementById('categoryFormMessage');

        // Lógica de Pestañas
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

        // --- LÓGICA DE CATEGORÍAS ---
        async function fetchAndRenderAdminCategories() {
            try {
                const categories = await fetchData('categories_get.php');
                categoriesTableBodyEl.innerHTML = '';
                if (!categories || categories.length === 0) {
                    categoriesTableBodyEl.innerHTML = `<tr><td colspan="4" class="text-center">No hay categorías creadas.</td></tr>`;
                    return;
                }
                categories.forEach(cat => {
                    const row = categoriesTableBodyEl.insertRow();
                    row.innerHTML = `<td>${cat.category_id}</td><td>${cat.name}</td><td>${cat.description || ''}</td><td><button class="btn btn-edit" data-id="${cat.category_id}">Editar</button><button class="btn btn-delete" data-id="${cat.category_id}">Eliminar</button></td>`;
                });
            } catch (error) {
                categoriesTableBodyEl.innerHTML = `<tr><td colspan="4" class="text-center list-message error">Error al cargar categorías: ${error.message}</td></tr>`;
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
            } catch (error) { productCategorySelectEl.innerHTML = `<option value="">Error al cargar</option>`; }
        }

        function clearCategoryForm() {
            if(categoryFormEl) {
                categoryFormEl.reset();
                categoryFormEl.elements.categoryId.value = '';
                categoryFormEl.querySelector('button[type="submit"]').textContent = 'Guardar Categoría';
                if (categoryFormMessageEl) { categoryFormMessageEl.textContent = ''; categoryFormMessageEl.className = 'form-message'; }
            }
        }

        if(categoryFormEl) {
            categoryFormEl.addEventListener('submit', async function(e) {
                e.preventDefault();
                const categoryId = this.elements.categoryId.value;
                const payload = { name: this.elements.name.value, description: this.elements.description.value };
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
                setTimeout(() => { if(categoryFormMessageEl) clearCategoryForm(); }, 3000);
            });
        }
        
        if(clearCategoryFormButtonEl) clearCategoryFormButtonEl.addEventListener('click', clearCategoryForm);
        
        if(categoriesTableBodyEl) {
            categoriesTableBodyEl.addEventListener('click', async (e) => {
                const target = e.target.closest('.btn-edit, .btn-delete');
                if (!target) return;
                const categoryId = target.dataset.id;
                
                if (target.classList.contains('btn-edit')) {
                    const categoryRow = target.closest('tr');
                    if (categoryRow) {
                        categoryFormEl.categoryId.value = categoryId;
                        categoryFormEl.name.value = categoryRow.cells[1].textContent;
                        categoryFormEl.description.value = categoryRow.cells[2].textContent;
                        categoryFormEl.querySelector('button[type="submit"]').textContent = 'Actualizar Categoría';
                        window.scrollTo({ top: categoryFormEl.offsetTop - 20, behavior: 'smooth' });
                    }
                } else if (target.classList.contains('btn-delete')) {
                    if (confirm('¿Seguro que quieres eliminar esta categoría?')) {
                        try {
                            const data = await fetchData(`category_delete.php?id=${categoryId}`, { method: 'GET' });
                            alert(data.message);
                            fetchAndRenderAdminCategories();
                            populateProductCategoryDropdown();
                        } catch (error) { alert(`Error: ${error.message}`); }
                    }
                }
            });
        }

        // --- LÓGICA DE PRODUCTOS ---
        async function fetchAndRenderProducts() {
            try {
                const products = await fetchData('products_get.php');
                productsTableBodyEl.innerHTML = '';
                if (!products || products.length === 0) {
                    productsTableBodyEl.innerHTML = `<tr><td colspan="7" class="text-center">No hay productos creados.</td></tr>`;
                    return;
                }
                products.forEach(p => {
                    const imageUrl = p.images && p.images.length > 0 ? `${UPLOADS_URL}/${p.images[0].nombre_archivo}` : 'https://via.placeholder.com/60x40?text=No+Img';
                    const row = productsTableBodyEl.insertRow();
                    row.innerHTML = `
                        <td><img src="${imageUrl}" alt="${p.name}" style="width: 60px; height: 40px; object-fit: cover;"></td>
                        <td>${p.name}</td>
                        <td>${p.category_name || 'N/A'}</td>
                        <td>$${parseFloat(p.price).toFixed(2)}</td>
                        <td>${p.stock}</td>
                        <td>${p.is_active == 1 ? 'Sí' : 'No'}</td>
                        <td>
                            <button class="btn btn-edit btn-edit-product" data-product='${JSON.stringify(p)}'>Editar</button>
                            <button class="btn btn-delete btn-delete-product" data-id="${p.product_id}">Eliminar</button>
                        </td>`;
                });
            } catch (error) {
                productsTableBodyEl.innerHTML = `<tr><td colspan="7" class="text-center list-message error">Error al cargar productos: ${error.message}</td></tr>`;
            }
        }
        
        function clearProductForm() {
            if(productFormEl) {
                productFormEl.reset();
                productFormEl.elements.productId.value = '';
                if(existingImagesPreviewEl) existingImagesPreviewEl.innerHTML = '';
                if(newImagesPreviewEl) newImagesPreviewEl.innerHTML = '';
                productFormEl.querySelectorAll('input[name="images_to_delete[]"]').forEach(input => input.remove());
                productFormEl.querySelector('button[type="submit"]').textContent = 'Guardar Producto';
                if (productFormMessageEl) { productFormMessageEl.textContent = ''; productFormMessageEl.className = 'form-message'; }
            }
        }

        if(productImagesInputEl) {
            productImagesInputEl.addEventListener('change', function(){
                newImagesPreviewEl.innerHTML = '';
                if (this.files.length > 0) {
                    Array.from(this.files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = e => {
                            const imgContainer = document.createElement('div');
                            imgContainer.className = 'image-preview-item';
                            imgContainer.innerHTML = `<img src="${e.target.result}" alt="Nueva imagen">`;
                            newImagesPreviewEl.appendChild(imgContainer);
                        }
                        reader.readAsDataURL(file);
                    });
                }
            });
        }
        
        if(clearProductFormButtonEl) clearProductFormButtonEl.addEventListener('click', clearProductForm);

        if(productFormEl) {
            productFormEl.addEventListener('submit', async function(e) {
                e.preventDefault();
                const productId = this.elements.productId.value;
                const formData = new FormData(this);
                if (!this.elements.is_active.checked) formData.set('is_active', '0');
                else formData.set('is_active', '1');
                
                const endpoint = productId ? `product_update.php` : 'product_create.php';
                if(productId) formData.append('id', productId); 
                
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
                 setTimeout(() => { if(productFormMessageEl) clearProductForm(); }, 3000);
            });
        }

        if(productsTableBodyEl) {
            productsTableBodyEl.addEventListener('click', async (e) => {
                 const target = e.target.closest('.btn-edit-product, .btn-delete-product');
                 if(!target) return;
                 
                 if (target.classList.contains('btn-edit-product')) {
                    clearProductForm();
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
                        
                        if (p.images && p.images.length > 0) {
                            p.images.forEach(img => {
                                const imgContainer = document.createElement('div');
                                imgContainer.className = 'image-preview-item existing';
                                imgContainer.innerHTML = `<img src="${UPLOADS_URL}/${img.nombre_archivo}" alt="Imagen existente"><button type="button" class="btn-delete-image" data-image-id="${img.id_imagen}">×</button>`;
                                existingImagesPreviewEl.appendChild(imgContainer);
                            });
                        }
                        productFormEl.querySelector('button[type="submit"]').textContent = 'Actualizar Producto';
                        window.scrollTo({ top: productFormEl.offsetTop - 20, behavior: 'smooth' });
                    }
                 } else if (target.classList.contains('btn-delete-product')) {
                    const productId = target.dataset.id;
                    if (confirm('¿Seguro que quieres eliminar este producto? Esto borrará todas sus imágenes asociadas.')) {
                        try {
                            const data = await fetchData(`product_delete.php?id=${productId}`, { method: 'GET' });
                            alert(data.message);
                            fetchAndRenderProducts();
                        } catch (error) { alert(`Error: ${error.message}`); }
                    }
                 }
            });
        }

        if(existingImagesPreviewEl) {
            existingImagesPreviewEl.addEventListener('click', function(e) {
                if (e.target.classList.contains('btn-delete-image')) {
                    const imageId = e.target.dataset.imageId;
                    const imageContainer = e.target.parentElement;
                    if (confirm('¿Seguro que quieres eliminar esta imagen? El cambio será permanente al guardar el producto.')) {
                        const hiddenInput = document.createElement('input');
                        hiddenInput.type = 'hidden';
                        hiddenInput.name = 'images_to_delete[]';
                        hiddenInput.value = imageId;
                        productFormEl.appendChild(hiddenInput);
                        imageContainer.style.display = 'none';
                    }
                }
            });
        }
        
        async function initAdminPanel() {
            await populateProductCategoryDropdown();
            await fetchAndRenderAdminCategories();
            await fetchAndRenderProducts();
            const firstTab = document.querySelector('.tab-link');
            if(firstTab) firstTab.click();
        }

        initAdminPanel();
        // --- FIN: CÓDIGO SOLO PARA EL PANEL DE ADMIN ---
    }
});