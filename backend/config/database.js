// backend/config/database.js
const { Sequelize } = require('sequelize');
// const dotenv = require('dotenv'); // No lo necesitamos para esta prueba
// dotenv.config();

console.log("--- [DB_CONFIG] Cargando configuración de base de datos... ---");

const sequelize = new Sequelize(
    'anteojoscatalogodb_mysql', // DB Name
    'root',                     // DB User
    'tu_password_de_root_aqui', // <-- ¡PON AQUÍ TU CONTRASEÑA DE ROOT DE MYSQL!
    {
        host: 'localhost',      // DB Host
        dialect: 'mysql',
        logging: console.log
    }
);

console.log("--- [DB_CONFIG] Instancia de Sequelize creada para DB: anteojoscatalogodb_mysql, Usuario: root ---");

module.exports = sequelize;