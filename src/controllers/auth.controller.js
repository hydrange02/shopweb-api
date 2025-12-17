const { User } = require("../models/user.model");
const { hashPassword, comparePassword, signToken } = require("../lib/auth");

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ ok: false, error: { code: "EMAIL_EXISTS", message: "Email already registered" } });
    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role: "user" });
    const token = signToken(user);
    return res.status(201).json({ ok: true, token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    const token = signToken(user);
    return res.json({ ok: true, token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  return res.json({ ok: true, user: req.user });
}

module.exports = { register, login, me };