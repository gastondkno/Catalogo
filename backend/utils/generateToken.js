// backend/utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    // El payload del token usualmente contiene el ID del usuario.
    // Puedes añadir más información si es necesario, pero mantenlo simple.
    const payload = {
        id: userId,
        // podrías añadir user.role si quieres que el token tenga esa info,
        // pero generalmente se vuelve a buscar el usuario al proteger rutas.
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d', // Usa el del .env o 30 días por defecto
    });
};

module.exports = generateToken;