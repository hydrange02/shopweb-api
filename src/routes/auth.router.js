const express = require("express");
const { 
  register, 
  confirmRegister, 
  login, 
  me, 
  forgotPassword, 
  resetPassword 
} = require("../controllers/auth.controller");
const { registerSchema, loginSchema } = require("../schemas/auth.dto");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

// Middleware validate dữ liệu
const validate = (schema) => (req, _res, next) => {
  try { 
    req.body = schema.parse(req.body); 
    next(); 
  } catch (e) { 
    e.status = 400; 
    next(e); 
  }
};

// --- ROUTES ĐĂNG KÝ (2 BƯỚC) ---
// Bước 1: Gửi mã OTP về email (Sử dụng hàm register cũ đã đổi tên logic bên controller)
router.post("/register", (req, res, next) => 
  Promise.resolve(register(req, res, next)).catch(next)
);

// Bước 2: Xác nhận OTP và tạo User thật
router.post("/register-confirm", (req, res, next) => 
  Promise.resolve(confirmRegister(req, res, next)).catch(next)
);

// --- ROUTES QUÊN MẬT KHẨU ---
router.post("/forgot-password", (req, res, next) => 
  Promise.resolve(forgotPassword(req, res, next)).catch(next)
);

router.post("/reset-password", (req, res, next) => 
  Promise.resolve(resetPassword(req, res, next)).catch(next)
);

// --- ROUTES CƠ BẢN ---
router.post("/login", validate(loginSchema), (req, res, next) => 
  Promise.resolve(login(req, res, next)).catch(next)
);

router.get("/me", requireAuth, me);

module.exports = router;