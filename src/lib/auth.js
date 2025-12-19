// File: src/lib/auth.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

async function hashPassword(plain) {
    // Sử dụng saltRounds = 10 là mức tiêu chuẩn
    return await bcrypt.hash(plain, 10);
}

async function comparePassword(plain, hash) {
    return await bcrypt.compare(plain, hash);
}

function signToken(user) {
    const payload = { 
        sub: String(user._id || user.id), 
        role: user.role, 
        name: user.name, 
        email: user.email 
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken };