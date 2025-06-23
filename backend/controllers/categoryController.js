// backend/controllers/categoryController.js
const Category = require('../models/CategoryModel');

// GET todas las categorías (público)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['name', 'ASC']] });
        res.json(categories); // Devuelve el array directamente
    } catch (error) {
        console.error("Error obteniendo categorías:", error);
        res.status(500).json({ success: false, message: 'Error al obtener categorías.' });
    }
};

// GET una categoría por ID (público)
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (category) {
            res.json(category); // Devuelve el objeto categoría directamente
        } else {
            res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
        }
    } catch (error) {
        console.error(`Error obteniendo categoría ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Error al obtener la categoría.' });
    }
};

// POST crear categoría (admin)
exports.createCategory = async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'El nombre de la categoría es requerido.' });
    }
    try {
        const newCategory = await Category.create({ name, description });
        res.status(201).json({ success: true, message: 'Categoría creada exitosamente!', category: newCategory });
    } catch (error) {
        console.error("Error creando categoría:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'Ya existe una categoría con ese nombre.' });
        }
        res.status(500).json({ success: false, message: 'Error interno al crear la categoría.' });
    }
};

// PUT actualizar categoría (admin)
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
        }
        if (name !== undefined) category.name = name;
        if (description !== undefined) category.description = description;
        await category.save();
        res.json({ success: true, message: 'Categoría actualizada exitosamente!', category });
    } catch (error) {
        console.error(`Error actualizando categoría ${id}:`, error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'Ya existe otra categoría con ese nombre.' });
        }
        res.status(500).json({ success: false, message: 'Error interno al actualizar la categoría.' });
    }
};

// DELETE categoría (admin)
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
        }
        // Considera qué sucede con los productos si eliminas una categoría a la que están asociados.
        // Podrías querer poner su category_id a null o impedir la eliminación si hay productos.
        // Por ahora, solo eliminamos la categoría.
        await category.destroy();
        res.json({ success: true, message: 'Categoría eliminada exitosamente.' });
    } catch (error) {
        console.error(`Error eliminando categoría ${id}:`, error);
        // Si hay una restricción de clave foránea (productos usando esta categoría)
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ success: false, message: 'No se puede eliminar la categoría porque tiene productos asociados.' });
        }
        res.status(500).json({ success: false, message: 'Error interno al eliminar la categoría.' });
    }
};