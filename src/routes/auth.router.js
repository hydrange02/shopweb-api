const express = require("express");
const { register, login, me } = require("../controllers/auth.controller");
const { registerSchema, loginSchema } = require("../schemas/auth.dto");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

const validate = (schema) => (req, _res, next) => {
  try { req.body = schema.parse(req.body); next(); } catch (e) { e.status = 400; next(e); }
};

router.post("/register", validate(registerSchema), (req, res, next) => Promise.resolve(register(req, res, next)).catch(next));
router.post("/login", validate(loginSchema), (req, res, next) => Promise.resolve(login(req, res, next)).catch(next));
router.get("/me", requireAuth, me);

module.exports = router;