// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_FOLDER_PATH = path.join(__dirname, '../uploads/');

if (!fs.existsSync(UPLOADS_FOLDER_PATH)) {
    try {
        fs.mkdirSync(UPLOADS_FOLDER_PATH, { recursive: true });
        console.log(`[uploadMiddleware] Directorio de subida CREADO en: ${UPLOADS_FOLDER_PATH}`);
    } catch (err) {
        console.error(`[uploadMiddleware] ERROR FATAL al crear directorio de subida ${UPLOADS_FOLDER_PATH}:`, err);
    }
} else {
    console.log(`[uploadMiddleware] Directorio de subida ya existe: ${UPLOADS_FOLDER_PATH}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_FOLDER_PATH);
    },
    filename: function (req, file, cb) {
        const fieldName = file.fieldname || 'image';
        cb(null, `${fieldName}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) { return cb(null, true); }
    else {
        console.error(`[uploadMiddleware] Tipo de archivo NO permitido: ${file.originalname}, mimetype: ${file.mimetype}`);
        return cb(new Error('Error: ¡Solo se permiten imágenes (jpeg, jpg, png, gif, webp)!'), false);
    }
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) { checkFileType(file, cb); }
});

module.exports = upload;