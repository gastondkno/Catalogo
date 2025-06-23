// backend/config/database.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '../.env') }); // Asegura que .env se lea desde la raíz del backend

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: (msg) => console.log(`[Sequelize] ${msg}`), // Log de SQL más informativo
        // logging: false, // Para producción
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            underscored: true, // Para que los nombres de columnas generados sean snake_case (ej. created_at)
            timestamps: true   // Habilita createdAt y updatedAt por defecto
        }
    }
);

module.exports = sequelize;