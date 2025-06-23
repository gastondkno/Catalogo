// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', loginAdmin);

module.exports = router;