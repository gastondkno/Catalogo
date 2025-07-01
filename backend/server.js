// backend/server.js

// --- Importaciones de Módulos ---
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const sequelize = require('./config/database');

dotenv.config();

// --- Importación de Modelos Sequelize ---
const User = require('./models/UserModel');
const Category = require('./models/CategoryModel');
const Product = require('./models/ProductModel');

// --- Definición de Asociaciones (Asegúrate de que existan en tus modelos) ---
// Ejemplo:
// Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
// Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });


const app = express();

// --- Middlewares Esenciales ---

// 1. Configuración de CORS (SIMPLIFICADA)
// Ahora que Nginx maneja las cabeceras CORS de forma estricta,
// solo necesitamos habilitar el paquete 'cors' en su modo más simple en Node.js.
// Esto asegura que las peticiones OPTIONS (preflight) sean manejadas correctamente
// por la librería antes de que Nginx aplique las cabeceras finales.
app.use(cors());

// 2. Middlewares para Parsear el Cuerpo de la Petición
// Estos son necesarios para que las rutas que reciben JSON (como login o crear categoría)
// puedan leer el req.body. NO interfieren con busboy si se aplican globalmente
// ANTES de las rutas.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Servir Archivos Estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Lógica para Crear Usuario Administrador al Inicio ---
const createAdminUser = async () => {
    if (!User) {
        console.warn("UserModel no está cargado. Omitiendo creación de admin.");
        return;
    }
    try {
        const adminUsername = process.env.ADMIN_USERNAME || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "joaco2025";
        const adminName = process.env.ADMIN_NAME || 'Admin Principal';

        const adminExists = await User.findOne({ where: { email: adminUsername } });

        if (!adminExists) {
            await User.create({
                name: adminName,
                email: adminUsername, // Se guarda 'username' en el campo 'email' de la DB
                password_hash: adminPassword, // El hook en el modelo lo hashea
                role: 'admin',
            });
            console.log(`[AdminInit] ¡Usuario administrador '${adminUsername}' CREADO EXITOSAMENTE!`);
        } else {
            console.log(`[AdminInit] El usuario administrador '${adminUsername}' ya existe.`);
        }
    } catch (error) {
        console.error('[AdminInit] ERROR al verificar/crear admin:', error.message);
    }
};

// --- Función Principal para Inicializar la BD y Arrancar el Servidor ---
async function initializeDatabaseAndStartServer() {
    let serverInstance = null;
    try {
        await sequelize.authenticate();
        console.log('CONEXIÓN A MySQL: ¡Exitosa!');

         await sequelize.sync({ alter: true });
        console.log("Sincronización de modelos con la base de datos completada.");

        await createAdminUser(); // Comenta esta línea si tu admin ya está creado y no quieres que se verifique cada vez.

        // Importar y Usar Rutas de la API
        const authRoutes = require('./routes/authRoutes');
        const productRoutes = require('./routes/productRoutes');
        const categoryRoutes = require('./routes/categoryRoutes');

        // Montaje de Rutas
        app.use('/api/auth', authRoutes);
        app.use('/api/products', productRoutes);
        app.use('/api/categories', categoryRoutes);

        app.get('/', (req, res) => {
            res.send('Bienvenido a la API del Catálogo de Anteojos.');
        });

        // Iniciar el Servidor
        const PORT = process.env.PORT || 5001;
        serverInstance = app.listen(PORT, () => {
            console.log(
                `Servidor backend corriendo en modo ${process.env.NODE_ENV || 'development'} en http://localhost:${PORT}`
            );
        });

        // Manejo de Errores Globales del Proceso
        process.on('unhandledRejection', (err, promise) => {
            console.error('UNHANDLED REJECTION! 💥 Cerrando servidor...', { error: err.name, message: err.message });
            if (serverInstance) serverInstance.close(() => process.exit(1)); else process.exit(1);
        });
        process.on('uncaughtException', (err) => {
            console.error('UNCAUGHT EXCEPTION! 💥 Cerrando servidor...', err);
            if (serverInstance) serverInstance.close(() => process.exit(1)); else process.exit(1);
        });

    } catch (error) {
        console.error('FALLO CRÍTICO AL INICIAR LA APLICACIÓN:', error.name, error.message);
        if (error.original) {
            console.error('Error Original (DB):', error.original.message, '(Code:', error.original.code, ')');
        }
        console.error(error.stack);
        process.exit(1);
    }
}

// Llamar a la función principal para iniciar todo el proceso
initializeDatabaseAndStartServer();