// backend/models/ProductModel.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./CategoryModel'); // Importar Category para la asociación

class Product extends Model {}

Product.init({
    product_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    category_id: { // Clave foránea
        type: DataTypes.INTEGER,
        allowNull: true, // O false si es obligatorio
        references: {
            model: 'categories', // Nombre de la tabla de categorías
            key: 'category_id',
        }
    },
    discount_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    underscored: true,
});

// Definir la asociación: Un Producto pertenece a una Categoría
Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category' // Este alias se usará en los 'include' de las consultas
});

// Opcional: Definir la asociación inversa en CategoryModel si la necesitas
// Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

module.exports = Product;