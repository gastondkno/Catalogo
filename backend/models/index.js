// backend/models/index.js
const sequelize = require('../config/database');
const User = require('./UserModel');
const Category = require('./CategoryModel');
const Product = require('./ProductModel');

// Definir asociaciones
// Un Producto pertenece a una Categoría
Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category' // Alias para cuando incluyas la categoría con el producto
});

// Una Categoría tiene muchos Productos
Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products' // Alias
});

// Sincronizar todos los modelos con la base de datos
// Esto es opcional aquí, puedes hacerlo en server.js
// sequelize.sync({ alter: true }).then(() => {
//   console.log('Modelos sincronizados con la base de datos (models/index.js)');
// }).catch(err => {
//   console.error('Error al sincronizar modelos:', err);
// });

module.exports = {
    sequelize,
    User,
    Category,
    Product
};