// backend/controllers/userController.js
const User = require('../models/UserModel');
const generateToken = require('../utils/generateToken'); // Asegúrate que este archivo exista y exporte la función

// LOGIN USER
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Por favor, ingrese email y contraseña.' });
    }
    try {
        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (user && (await user.matchPassword(password))) {
            res.json({
                success: true,
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.user_id),
            });
        } else {
            res.status(401).json({ success: false, message: 'Email o contraseña inválidos.' });
        }
    } catch (error) {
        console.error("Error en loginUser:", error);
        res.status(500).json({ success: false, message: 'Error del servidor durante el inicio de sesión.' });
    }
};

// REGISTER USER
exports.registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos.' });
    }
    try {
        const emailLowerCase = email.toLowerCase();
        const userExists = await User.findOne({ where: { email: emailLowerCase } });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'El usuario ya existe con ese email.' });
        }
        const user = await User.create({
            name,
            email: emailLowerCase,
            password_hash: password,
            role: role || 'user',
        });
        if (user && user.user_id) {
            res.status(201).json({
                success: true,
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.user_id),
            });
        } else {
            res.status(400).json({ success: false, message: 'Datos de usuario inválidos, no se pudo crear.' });
        }
    } catch (error) {
        console.error("Error en registerUser:", error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Error del servidor durante el registro.' });
    }
};

// GET USER PROFILE
exports.getUserProfile = async (req, res) => {
    // req.user es establecido por el middleware 'protect'
    if (!req.user || !req.user.user_id) {
         return res.status(401).json({ success: false, message: 'No autorizado, usuario no encontrado en la solicitud.' });
    }
    try {
        const user = req.user; // Asumiendo que protect adjunta el objeto usuario
        res.json({
            success: true,
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error("Error en getUserProfile:", error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener el perfil.' });
    }
};