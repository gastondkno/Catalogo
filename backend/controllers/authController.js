// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Importamos bcryptjs porque lo vamos a usar para comparar
const User = require('../models/UserModel'); // Importamos el modelo de usuario de Sequelize

// La función generateToken ahora recibirá el ID del usuario para mayor seguridad
const generateToken = (userId) => {
    // Es mejor práctica poner el ID del usuario en el token, no el nombre de usuario
    return jwt.sign({ id: userId, role: 'admin' }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expira en 1 día
    });
};

const loginAdmin = async (req, res) => {
    console.log("--- [AUTH CONTROLLER - DB Version] Petición de login recibida ---");
    console.log("Body recibido:", req.body); 

    const { username, password } = req.body;

    if (!username || !password) {
        console.log("--- [AUTH CONTROLLER - DB Version] Validación fallida: username o password faltantes ---");
        return res.status(400).json({ success: false, message: 'Por favor, ingrese nombre de usuario y contraseña.' });
    }

    try {
        // 1. Buscar al usuario en la base de datos por su 'username' (que está en el campo 'email')
        const user = await User.findOne({ where: { email: username } });

        // 2. Si no se encuentra el usuario, las credenciales son inválidas.
        if (!user) {
            console.log("--- [AUTH CONTROLLER - DB Version] Usuario no encontrado en la base de datos ---");
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // 3. Si se encuentra el usuario, comparar la contraseña enviada con la hasheada en la BD
        //    Usamos el método validPassword que definimos en el modelo, o bcrypt.compare directamente.
        //    const isMatch = await user.validPassword(password); // Usando el método del modelo
        //    O directamente:
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
            // Si las contraseñas coinciden, el login es exitoso
            console.log("--- [AUTH CONTROLLER - DB Version] Credenciales CORRECTAS ---");
            res.json({
                success: true,
                message: 'Login exitoso.',
                token: generateToken(user.user_id), // Generamos el token con el ID del usuario
                user: {
                    user_id: user.user_id,
                    username: user.email, // Devolvemos el username
                    name: user.name,
                    role: user.role
                }
            });
        } else {
            // Si las contraseñas NO coinciden
            console.log("--- [AUTH CONTROLLER - DB Version] Contraseña INCORRECTA ---");
            res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }
    } catch (error) {
        console.error('[AuthController Login - DB Version] Error interno:', error);
        res.status(500).json({ success: false, message: `Error del servidor: ${error.message}` });
    }
};

module.exports = {
    loginAdmin,
    // Si tienes una función de registro en otro lado, también exportala aquí
};