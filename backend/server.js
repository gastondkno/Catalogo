// backend/server.js

// --- Importaciones de Módulos ---
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const sequelize = require('./config/database'); // Tu instancia configurada de Sequelize

// --- Carga de Variables de Entorno ---
dotenv.config(); // Asume que .env está en la raíz de backend/

// --- Importación de Modelos Sequelize ---
// Asegúrate de que estos modelos existan y estén correctamente definidos para Sequelize
const User = require('./models/UserModel'); 
const Category = require('./models/CategoryModel');
const Product = require('./models/ProductModel');

// Definir asociaciones (si no están ya en tus archivos de modelo o un archivo de index.js en models)
// Ejemplo:
// Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
// Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
// Es CRUCIAL que las asociaciones estén definidas ANTES de intentar sincronizar o hacer includes.

// --- Crear Instancia de la Aplicación Express ---
const app = express();

// --- Middlewares Esenciales de Express ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Servir Archivos Estáticos (para imágenes) ---
// Las imágenes se servirán desde la URL /uploads y se buscarán en la carpeta backend/uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Lógica para Crear Usuario Administrador al Inicio (Opcional) ---
const createAdminUser = async () => {
    if (!User) {
        console.warn("[AdminInit] UserModel no está cargado. Omitiendo creación de admin.");
        return;
    }
    try {
        const adminUsername = process.env.ADMIN_USERNAME || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "123"; // Esta contraseña será hasheada por el hook
        const adminName = process.env.ADMIN_NAME || 'Admin Principal Joaco';

        // Buscamos por el campo 'email' donde guardaremos el username
        const adminExists = await User.findOne({ where: { email: adminUsername } });

        if (!adminExists) {
            const newUser = await User.create({
                name: adminName,
                email: adminUsername, // Guardamos el 'username' en el campo 'email' de la BD
                password_hash: adminPassword, // El hook 'beforeCreate' en UserModel se encarga del hasheo
                role: 'admin',
            });
            console.log(`[AdminInit] Usuario administrador con username '${adminUsername}' CREADO con ID: ${newUser.user_id}`);
        } else {
            console.log(`[AdminInit] El usuario administrador con username '${adminUsername}' YA EXISTE con ID: ${adminExists.user_id}`);
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
        console.log(`CONEXIÓN A ${process.env.DB_DIALECT || 'MySQL'}: ¡Exitosa! DB: ${process.env.DB_NAME}`);

        // Sincronización de modelos: ¡USA CON PRECAUCIÓN!
        // { force: true } BORRA y recrea tablas. PELIGROSO.
        // { alter: true } Intenta modificar tablas para que coincidan. Puede ser útil en desarrollo.
        // En producción, se suelen usar migraciones.
        // await sequelize.sync({ alter: true }); // Descomenta solo si necesitas que Sequelize ajuste tus tablas
        // console.log("Sincronización de modelos con la base de datos completada (si se ejecutó).");

        await createAdminUser(); // Crear/verificar el usuario admin

        // --- Importar y Usar Rutas de la API ---
        const authRoutes = require('./routes/authRoutes'); // Para login
        const productRoutes = require('./routes/productRoutes');
        const categoryRoutes = require('./routes/categoryRoutes');

        app.use('/api/auth', authRoutes);
        app.use('/api/products', productRoutes);
        app.use('/api/categories', categoryRoutes);

        app.get('/', (req, res) => {
            res.send('API del Catálogo Joaco Norelli. Endpoints en /api/auth, /api/products, /api/categories.');
        });

        const PORT = process.env.PORT || 5001;
        serverInstance = app.listen(PORT, () => {
            console.log(
                `Servidor backend corriendo en modo ${process.env.NODE_ENV || 'development'} en http://localhost:${PORT}`
            );
        });

        process.on('unhandledRejection', (err, promise) => {
            console.error('UNHANDLED REJECTION! 💥 Cerrando servidor...', { name: err.name, message: err.message, promise });
            if (serverInstance) serverInstance.close(() => process.exit(1)); else process.exit(1);
        });
        process.on('uncaughtException', (err) => {
            console.error('UNCAUGHT EXCEPTION! 💥 Cerrando servidor...', { name: err.name, message: err.message });
            console.error(err.stack);
            if (serverInstance) serverInstance.close(() => process.exit(1)); else process.exit(1);
        });

    } catch (error) {
        console.error('FALLO CRÍTICO AL INICIAR LA APLICACIÓN:', error.name, error.message);
        if (error.original) {
            console.error('Error Original (DB):', error.original.message, error.original);
        }
        console.error(error.stack);
        process.exit(1);
    }
}

initializeDatabaseAndStartServer();