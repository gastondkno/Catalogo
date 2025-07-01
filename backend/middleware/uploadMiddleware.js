// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // La carpeta 'uploads' debe estar en la raíz de 'backend/'
        // path.join con __dirname asegura que la ruta sea correcta sin importar desde donde se ejecute el script.
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        // Crear un nombre de archivo único para evitar colisiones: producto-timestamp.extension
        cb(null, `producto-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Función para verificar que el archivo subido sea una imagen
function checkFileType(file, cb) {
    // Tipos de archivo permitidos (expresión regular)
    const filetypes = /jpeg|jpg|png|gif|webp/;
    // Comprobar la extensión del archivo
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Comprobar el tipo MIME del archivo
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        // Si es una imagen válida, continuar
        return cb(null, true);
    } else {
        // Si no, rechazar el archivo con un mensaje de error
        cb(new Error('Error: ¡Solo se permiten archivos de imagen!'), false);
    }
}

// Inicializar y configurar Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Límite de 20MB (para coincidir con nginx.conf)
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Exportar la instancia de Multer configurada
module.exports = upload;