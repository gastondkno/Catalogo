// backend/controllers/authController.js
const jwt = require('jsonwebtoken');

const ADMIN_USERNAME = process.env.HARDCODED_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.HARDCODED_ADMIN_PASSWORD || '123'; // Contraseña en texto plano

const generateToken = (username) => {
    return jwt.sign({ username: username, role: 'admin' }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

const loginAdmin = async (req, res) => {
    console.log("--- [AUTH CONTROLLER] Petición de login recibida ---");
    console.log("Body recibido por el backend:", req.body); 

    const { username, password } = req.body; 

    if (!username || !password) {
        console.log("--- [AUTH CONTROLLER] Validación fallida: username o password faltantes ---");
        return res.status(400).json({ success: false, message: 'Por favor, ingrese NOMBRE DE USUARIO y contraseña.' });
    }

    try {
        const isUsernameMatch = (username === ADMIN_USERNAME);
        const isPasswordMatch = (password === ADMIN_PASSWORD);

        if (isUsernameMatch && isPasswordMatch) {
            console.log("--- [AUTH CONTROLLER] Credenciales CORRECTAS ---");
            res.json({
                success: true,
                message: 'Login exitoso.',
                token: generateToken(ADMIN_USERNAME),
                user: { // Devolvemos un objeto user simulado
                    username: ADMIN_USERNAME,
                    role: 'admin'
                }
            });
        } else {
            console.log("--- [AUTH CONTROLLER] Credenciales INCORRECTAS ---");
            res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }
    } catch (error) {
        console.error('[AuthController Login] Error interno:', error);
        res.status(500).json({ success: false, message: `Error del servidor: ${error.message}` });
    }
};

module.exports = {
    loginAdmin,
};