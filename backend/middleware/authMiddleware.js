// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
// No necesitamos el UserModel aquí si el payload del token es simple (ej. solo username y role)

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Adjuntamos la información decodificada del usuario (o al menos el rol) a req
            // Para un admin hardcodeado, esto podría ser simplemente req.user = decoded;
            // Si el token solo tiene { username, role }, entonces req.user será eso.
            req.user = decoded; // { username: 'admin', role: 'admin', iat: ..., exp: ... }

            if (req.user && req.user.role === 'admin') {
                next();
            } else {
                res.status(403).json({ success: false, message: 'No autorizado (rol no es admin).' });
            }
        } catch (error) {
            console.error('Error de autenticación de token:', error.message);
            res.status(401).json({ success: false, message: 'No autorizado, token falló o inválido.' });
        }
    }
    if (!token) {
        res.status(401).json({ success: false, message: 'No autorizado, no hay token.' });
    }
};

module.exports = { protect };