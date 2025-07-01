// backend/controllers/productController.js
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const Busboy = require('busboy');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// --- FUNCIÓN AUXILIAR ---
// Para borrar un archivo de forma segura. filePath es la ruta web, ej: /uploads/imagen.jpg
const deleteFile = (filePath) => {
    if (!filePath) return;
    // __dirname está en backend/controllers. Necesitamos subir un nivel para la raíz del backend.
    const absolutePath = path.join(__dirname, '..', filePath);
    fs.unlink(absolutePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error(`Error al intentar borrar el archivo en ${absolutePath}:`, err);
        } else if (!err) {
            console.log(`Archivo borrado exitosamente: ${absolutePath}`);
        }
    });
};

// --- FUNCIÓN AUXILIAR PARA FORMATEAR LA RESPUESTA ---
const formatProductResponse = (product) => {
    if (!product) return null;
    const plainProduct = product.get ? product.get({ plain: true }) : product;
    return {
        ...plainProduct,
        category_name: plainProduct.category ? plainProduct.category.name : null,
        tipo: plainProduct.category ? plainProduct.category.name : null,
    };
};

// --- CONTROLADORES ---

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Público / Admin
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [{ 
                model: Category, 
                as: 'category',
                attributes: ['name'] 
            }],
            order: [['name', 'ASC']]
        });
        res.json(products.map(formatProductResponse));
    } catch (error) {
        console.error("Error en getAllProducts:", error);
        res.status(500).json({ success: false, message: 'Error al obtener productos.' });
    }
};

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Público / Admin
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category', attributes: ['name'] }]
        });
        if (product) {
            res.json(formatProductResponse(product));
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
    } catch (error) {
        console.error(`Error obteniendo producto ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Error al obtener el detalle del producto.' });
    }
};

// @desc    Crear un nuevo producto (usa busboy para manejar multipart/form-data)
// @route   POST /api/products
// @access  Privado/Admin
exports.createProduct = (req, res) => {
    const fields = {};
    let fileData;

    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 20 * 1024 * 1024 } });

    busboy.on('field', (fieldname, val) => fields[fieldname] = val);

    busboy.on('file', (fieldname, file, info) => {
        const newFilename = `${uuidv4()}${path.extname(info.filename)}`;
        const saveTo = path.join(__dirname, '..', 'uploads', newFilename);
        fileData = { path: saveTo, filename: newFilename };
        file.pipe(fs.createWriteStream(saveTo));
    });

    busboy.on('finish', async () => {
        console.log('[Busboy Create] Parseo finalizado. Campos:', fields);
        if (!fields.name || !fields.price || !fields.categoryName || !fields.stock) {
            if (fileData) fs.unlink(fileData.path, () => {});
            return res.status(400).json({ success: false, message: 'Nombre, precio, nombre de categoría y stock son requeridos.' });
        }
        if (!fileData) {
            return res.status(400).json({ success: false, message: 'La imagen del producto es requerida.' });
        }
        try {
            const category = await Category.findOne({ where: { name: fields.categoryName } });
            if (!category) {
                fs.unlink(fileData.path, () => {});
                return res.status(400).json({ success: false, message: `Categoría '${fields.categoryName}' no encontrada.` });
            }
            const newProduct = await Product.create({
                name: fields.name,
                description: fields.description || null,
                price: parseFloat(fields.price),
                image_url: `/uploads/${fileData.filename}`,
                category_id: category.category_id,
                stock: parseInt(fields.stock, 10),
                discount_percentage: parseFloat(fields.discount_percentage) || 0,
                is_active: fields.is_active === 'true'
            });
            const productToReturn = await Product.findByPk(newProduct.product_id, { include: [{ model: Category, as: 'category' }] });
            res.status(201).json(formatProductResponse(productToReturn));
        } catch (error) {
            console.error("[Busboy Create] Error de BD:", error);
            fs.unlink(fileData.path, () => {});
            res.status(500).json({ success: false, message: 'Error interno del servidor al crear el producto.' });
        }
    });

    req.pipe(busboy);
};

// @desc    Actualizar un producto (usa busboy para manejar multipart/form-data)
// @route   PUT /api/products/:id
// @access  Privado/Admin
exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const fields = {};
    let fileData;

    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 20 * 1024 * 1024 } });

    busboy.on('field', (fieldname, val) => fields[fieldname] = val);

    busboy.on('file', (fieldname, file, info) => {
        const newFilename = `${uuidv4()}${path.extname(info.filename)}`;
        const saveTo = path.join(__dirname, '..', 'uploads', newFilename);
        fileData = { path: saveTo, filename: newFilename };
        file.pipe(fs.createWriteStream(saveTo));
    });

    busboy.on('finish', async () => {
        console.log(`[Busboy Update ID: ${id}] Parseo finalizado. Campos:`, fields);
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                if (fileData) fs.unlink(fileData.path, () => {});
                return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
            }

            const oldImageUrl = product.image_url;
            const updateData = {};

            if (fields.name !== undefined) updateData.name = fields.name;
            if (fields.description !== undefined) updateData.description = fields.description;
            if (fields.price !== undefined) updateData.price = parseFloat(fields.price);
            if (fields.stock !== undefined) updateData.stock = parseInt(fields.stock, 10);
            if (fields.discount_percentage !== undefined) updateData.discount_percentage = parseFloat(fields.discount_percentage);
            if (fields.is_active !== undefined) updateData.is_active = (fields.is_active === 'true');
            if (fileData) updateData.image_url = `/uploads/${fileData.filename}`;

            if (fields.categoryName) {
                const category = await Category.findOne({ where: { name: fields.categoryName } });
                if (!category) {
                    if (fileData) fs.unlink(fileData.path, () => {});
                    return res.status(400).json({ success: false, message: `Categoría no encontrada.` });
                }
                updateData.category_id = category.category_id;
            }

            await product.update(updateData);

            if (fileData && oldImageUrl) {
                deleteFile(oldImageUrl);
            }
            
            const updatedProduct = await Product.findByPk(id, { include: [{ model: Category, as: 'category' }] });
            res.json(formatProductResponse(updatedProduct));

        } catch (error) {
            console.error(`[Busboy Update ID: ${id}] Error de BD:`, error);
            if (fileData) fs.unlink(fileData.path, () => {});
            res.status(500).json({ success: false, message: 'Error interno al actualizar el producto.' });
        }
    });

    req.pipe(busboy);
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Privado/Admin
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findByPk(id);
        if (product) {
            const imageUrlToDelete = product.image_url;
            await product.destroy();

            if (imageUrlToDelete) {
                deleteFile(imageUrlToDelete);
            }
            res.json({ success: true, message: 'Producto eliminado exitosamente.' });
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
    } catch (error) {
        console.error(`[DeleteProduct ID: ${id}] Error eliminando producto:`, error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar el producto.' });
    }
};