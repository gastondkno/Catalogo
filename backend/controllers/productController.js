// backend/controllers/productController.js
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// --- FUNCIONES PÚBLICAS (para el catálogo) ---

exports.getPublicProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { is_active: true },
            include: [{ 
                model: Category, 
                as: 'category', // Este alias debe coincidir con el definido en ProductModel.js
                attributes: ['name'] 
            }],
            order: [['name', 'ASC']]
        });
        const productsToReturn = products.map(p => {
            const plainProduct = p.get({ plain: true });
            return {
                ...plainProduct,
                category_name: plainProduct.category ? plainProduct.category.name : null,
                tipo: plainProduct.category ? plainProduct.category.name : null
            };
        });
        res.json(productsToReturn);
    } catch (error) {
        console.error("Error obteniendo productos públicos:", error);
        res.status(500).json({ success: false, message: 'Error al obtener productos.' });
    }
};

exports.getPublicProductById = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { product_id: req.params.id, is_active: true },
            include: [{ model: Category, as: 'category', attributes: ['name'] }]
        });
        if (product) {
            const plainProduct = product.get({ plain: true });
            res.json({ // Devolver el objeto producto directamente
                ...plainProduct,
                category_name: plainProduct.category ? plainProduct.category.name : null,
                tipo: plainProduct.category ? plainProduct.category.name : null
            });
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado o no está activo.' });
        }
    } catch (error) {
        console.error(`Error obteniendo producto público ${req.params.id}:`, error);
        if (error.name === 'SequelizeDatabaseError' && error.original && error.original.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
            return res.status(404).json({ success: false, message: 'ID de producto inválido.' });
       }
        res.status(500).json({ success: false, message: 'Error al obtener el detalle del producto.' });
    }
};

// --- FUNCIONES DE ADMIN (ABM) ---

exports.getAllProductsForAdmin = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [{ 
                model: Category, 
                as: 'category', 
                attributes: ['category_id', 'name'] // Incluir ID de categoría para el admin
            }],
            order: [['updated_at', 'DESC']] // O el orden que prefieras
        });
        const productsToReturn = products.map(p => {
            const plainProduct = p.get({ plain: true });
            return {
                ...plainProduct,
                category_name: plainProduct.category ? plainProduct.category.name : null,
                tipo: plainProduct.category ? plainProduct.category.name : null,
                category_id_for_select: plainProduct.category ? plainProduct.category.category_id : null
            };
        });
        res.json(productsToReturn);
    } catch (error) {
        console.error("Error obteniendo todos los productos para admin:", error);
        res.status(500).json({ success: false, message: `Error del servidor al obtener productos para admin: ${error.message}` });
    }
};

// Si necesitas una función para obtener un producto por ID para el admin (incluyendo inactivos)
exports.getAdminProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, { // findByPk busca por clave primaria
            include: [{ 
                model: Category, 
                as: 'category', 
                attributes: ['name', 'category_id'] // Devolver ID de categoría también es útil para el select
            }]
        });
        if (product) {
            const plainProduct = product.get({ plain: true });
            res.json({ // Devolver el objeto producto directamente o como prefieras
                ...plainProduct,
                category_name: plainProduct.category ? plainProduct.category.name : null,
                tipo: plainProduct.category ? plainProduct.category.name : null, // Para consistencia
                category_id_for_select: plainProduct.category ? plainProduct.category.category_id : null
            });
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado para administración.' });
        }
    } catch (error) {
        console.error(`Error obteniendo producto para admin ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Error al obtener el producto para admin.' });
    }
};



exports.createProduct = async (req, res) => {
    const { name, description, price, categoryName, stock, discount_percentage, is_active } = req.body;
    
    console.log("[Admin CreateProduct] Body:", req.body);
    console.log("[Admin CreateProduct] File (req.file):", req.file);

    if (!name || !price || !categoryName || stock == null) {
        if (req.file && req.file.path) {
            console.warn("[Admin CreateProduct] Validación fallida, eliminando imagen subida:", req.file.path);
            fs.unlink(req.file.path, errUnlink => { 
                if (errUnlink) console.error("Error eliminando imagen (validación fallida):", errUnlink.message, "Path:", req.file.path);
                else console.log("Imagen eliminada (validación fallida):", req.file.path);
            });
        }
        return res.status(400).json({ success: false, message: 'Nombre, precio, nombre de categoría y stock son requeridos.' });
    }

    let image_url_for_db = null;
    if (req.file) {
        // La imagen se guarda en backend/uploads/ por Multer.
        // El servidor sirve /uploads desde backend/uploads/.
        // La URL para la BD es /uploads/nombre_del_archivo.jpg
        image_url_for_db = `/uploads/${req.file.filename}`;
        console.log(`[Admin CreateProduct] URL de imagen para BD: ${image_url_for_db}`);
    } else {
        console.warn("[Admin CreateProduct] No se proporcionó imagen para el nuevo producto.");
        // Considera si una imagen es obligatoria. Si lo es:
        // return res.status(400).json({ success: false, message: 'La imagen del producto es requerida.' });
    }

    try {
        const category = await Category.findOne({ where: { name: categoryName } });
        if (!category) {
            if (req.file && req.file.path) {
                console.warn("[Admin CreateProduct] Categoría no encontrada, eliminando imagen subida:", req.file.path);
                fs.unlink(req.file.path, errUnlink => { 
                    if (errUnlink) console.error("Error eliminando imagen (categoría no encontrada):", errUnlink.message, "Path:", req.file.path);
                    else console.log("Imagen eliminada (categoría no encontrada):", req.file.path);
                });
            }
            return res.status(400).json({ success: false, message: `Categoría '${categoryName}' no encontrada.` });
        }

        const productData = {
            name,
            description: description || null,
            price: parseFloat(price),
            category_id: category.category_id,
            stock: parseInt(stock, 10),
            discount_percentage: discount_percentage ? parseFloat(discount_percentage) : 0,
            is_active: (is_active === 'true' || is_active === true), // Manejar string 'true' y booleano true
            image_url: image_url_for_db
        };
        console.log("[Admin CreateProduct] Datos para crear producto en BD:", productData);

        const newProduct = await Product.create(productData);
        
        console.log("[Admin CreateProduct] Producto creado exitosamente en BD:", newProduct.toJSON());
        
        // Devolver el producto creado con el nombre de la categoría para la respuesta
        const productToReturnWithCategory = await Product.findByPk(newProduct.product_id, {
            include: [{ model: Category, as: 'category', attributes: ['name', 'category_id'] }]
        });
        const plainProduct = productToReturnWithCategory.get({ plain: true });

        res.status(201).json({ 
            success: true, 
            message: 'Producto creado exitosamente!', 
            product: { // Asegurarse de que la respuesta sea consistente
                ...plainProduct,
                category_name: plainProduct.category ? plainProduct.category.name : null,
                tipo: plainProduct.category ? plainProduct.category.name : null,
                category_id_for_select: plainProduct.category ? plainProduct.category.category_id : null
            }
        });

    } catch (error) {
        console.error("[Admin CreateProduct] Error durante creación en BD o después:", error);
        if (req.file && req.file.path) { 
            console.warn("[Admin CreateProduct] Error en DB/post-procesamiento, intentando eliminar imagen subida:", req.file.path);
            fs.unlink(req.file.path, errUnlink => { 
                if (errUnlink) console.error("Error eliminando imagen (fallo DB/post-procesamiento):", errUnlink.message, "Path:", req.file.path);
                else console.log("Imagen eliminada (fallo DB/post-procesamiento):", req.file.path);
            });
        }
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ success: false, message: `Error interno al crear el producto: ${error.message}` });
    }
};

exports.updateProduct = async (req, res) => {
    const { name, description, price, categoryName, stock, discount_percentage, is_active } = req.body;
    const { id } = req.params; // Este es product_id

    console.log(`[Admin UpdateProduct ID: ${id}] Body recibido:`, req.body);
    console.log(`[Admin UpdateProduct ID: ${id}] Archivo (req.file):`, req.file);

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            if (req.file && req.file.path) fs.unlink(req.file.path, err => { if (err) console.error("Error eliminando imagen nueva, producto no encontrado para actualizar:", err.message);});
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }

        const oldImageWebPath = product.image_url; // ej: /uploads/filename.jpg

        // Actualizar campos solo si se proporcionan en el body
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = parseFloat(price);
        if (stock !== undefined) product.stock = parseInt(stock, 10);
        if (discount_percentage !== undefined) product.discount_percentage = parseFloat(discount_percentage);
        if (is_active !== undefined) product.is_active = (is_active === 'true' || is_active === true);

        if (categoryName) {
            const category = await Category.findOne({ where: { name: categoryName } });
            if (!category) {
                if (req.file && req.file.path) fs.unlink(req.file.path, err => { if (err) console.error("Error eliminando imagen nueva, categoría no encontrada al actualizar:", err.message);});
                return res.status(400).json({ success: false, message: `Categoría '${categoryName}' no encontrada.` });
            }
            product.category_id = category.category_id;
        }
        
        if (req.file) {
            // Nueva imagen se guarda en backend/uploads/ por Multer
            // La URL para la BD es /uploads/nombre_del_archivo.jpg
            product.image_url = `/uploads/${req.file.filename}`;
            console.log(`[Admin UpdateProduct ID: ${id}] Nueva URL de imagen para BD: ${product.image_url}`);
        }

        await product.save(); // Guardar los cambios en el producto

        // Si se subió una nueva imagen Y había una antigua Y son diferentes, eliminar la antigua del sistema de archivos
        if (req.file && oldImageWebPath && oldImageWebPath !== product.image_url) {
            // __dirname es backend/controllers/
            // oldImageWebPath es /uploads/nombre_antiguo.jpg
            // La carpeta 'uploads' está en la raíz del backend (un nivel arriba de 'controllers')
            const physicalOldImagePath = path.join(__dirname, '..', oldImageWebPath); // Construye backend/uploads/nombre_antiguo.jpg
            fs.access(physicalOldImagePath, fs.constants.F_OK, (errAccess) => {
                if (!errAccess) {
                    fs.unlink(physicalOldImagePath, errUnlink => {
                        if (errUnlink) console.error("Error eliminando imagen antigua del sistema de archivos:", errUnlink.message, "Path:", physicalOldImagePath);
                        else console.log("Imagen antigua eliminada del sistema de archivos:", physicalOldImagePath);
                    });
                } else {
                    console.warn("Imagen antigua no encontrada en el sistema de archivos para eliminar:", physicalOldImagePath);
                }
            });
        }
        
        // Volver a buscar para obtener datos con categoría actualizada para la respuesta
        const updatedProductWithCategory = await Product.findByPk(id, {
             include: [{ model: Category, as: 'category', attributes: ['name', 'category_id'] }]
        });
        const plainProduct = updatedProductWithCategory.get({plain: true});

        res.json({ 
            success: true, 
            message: 'Producto actualizado exitosamente!', 
            product: { // Asegurar consistencia en la respuesta
                 ...plainProduct,
                 category_name: plainProduct.category ? plainProduct.category.name : null,
                 tipo: plainProduct.category ? plainProduct.category.name : null,
                 category_id_for_select: plainProduct.category ? plainProduct.category.category_id : null
            }
        });

    } catch (error) {
        console.error(`[Admin UpdateProduct ID: ${id}] Error actualizando producto:`, error);
        if (req.file && req.file.path) {
             fs.unlink(req.file.path, err => { if (err) console.error("Error eliminando imagen nueva subida tras fallo de actualización:", err.message);});
        }
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ success: false, message: `Error interno al actualizar el producto: ${error.message}` });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params; // Este es product_id
    try {
        const product = await Product.findByPk(id);
        if (product) {
            const imageWebPath = product.image_url; // ej: /uploads/filename.jpg
            await product.destroy(); // Elimina el producto de la BD

            if (imageWebPath) {
                // Construir la ruta física al archivo de imagen
                // __dirname está en backend/controllers/
                // imageWebPath es /uploads/nombre_imagen.jpg
                // La carpeta 'uploads' está en la raíz del backend (un nivel arriba)
                const physicalImagePath = path.join(__dirname, '..', imageWebPath); // Construye backend/uploads/nombre_imagen.jpg
                 fs.access(physicalImagePath, fs.constants.F_OK, (errAccess) => {
                    if (!errAccess) { // Si el archivo existe
                        fs.unlink(physicalImagePath, errUnlink => {
                            if (errUnlink) console.error("Error eliminando imagen del producto del sistema de archivos:", errUnlink.message, "Path:", physicalImagePath);
                            else console.log("Imagen del producto eliminada del sistema de archivos:", physicalImagePath);
                        });
                    } else {
                        console.warn("Imagen no encontrada en el sistema de archivos para eliminar al borrar producto:", physicalImagePath);
                    }
                });
            }
            res.json({ success: true, message: 'Producto eliminado exitosamente.' });
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
    } catch (error) {
        console.error(`[Admin DeleteProduct ID: ${id}] Error eliminando producto:`, error);
        res.status(500).json({ success: false, message: `Error interno al eliminar el producto: ${error.message}` });
    }
};