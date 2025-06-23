// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- Rutas Públicas ---
router.get('/', productController.getPublicProducts);
router.get('/:id', productController.getPublicProductById); // Esta es para el detalle público

// --- Rutas Protegidas para el Administrador ---
router.get('/admin/all', protect, productController.getAllProductsForAdmin); // Lista todos para admin
router.get('/admin/:id', protect, productController.getAdminProductById); // <--- NUEVA RUTA PARA EDITAR

router.post('/', protect, upload.single('image'), productController.createProduct);
router.put('/:id', protect, upload.single('image'), productController.updateProduct); // Esta ruta se usa para actualizar, el ID es el del producto
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;