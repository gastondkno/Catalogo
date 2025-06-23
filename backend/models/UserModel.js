// backend/models/UserModel.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
    async validPassword(password) {
        return await bcrypt.compare(password, this.password_hash);
    }
}

User.init({
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    email: { // Usaremos este campo para almacenar el 'username'
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            // Puedes quitar isEmail si no quieres esa validación para el username
            // isEmail: true, 
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING(50),
        defaultValue: 'user', // 'admin' o 'user'
    },
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password_hash) {
                const salt = await bcrypt.genSalt(10);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password_hash') && user.password_hash) {
                // Solo hashear si el valor que llega no parece ya un hash de bcrypt
                if (!user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password_hash = await bcrypt.hash(user.password_hash, salt);
                }
            }
        }
    }
});

module.exports = User;