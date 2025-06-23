// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController'); // Necesitas crear este controlador
const { protect } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', categoryController.getAllCategories);       // GET /api/categories
router.get('/:id', categoryController.getCategoryById);     // GET /api/categories/:id

// Rutas protegidas para Admin
router.post('/', protect, categoryController.createCategory);
router.put('/:id', protect, categoryController.updateCategory);
router.delete('/:id', protect, categoryController.deleteCategory);

module.exports = router;