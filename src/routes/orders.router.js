// src/routes/orders.router.js
const express = require("express");
const { 
  createOrder, 
  getOrderById, 
  listOrders, 
  updateOrderStatus,
  listMyOrders,
  deleteOrder,
  cancelOrder,
} = require("../controllers/orders.controller");
const { createOrderSchema } = require("../schemas/order.dto");
const { requireAuth, requireRole, identifyUser } = require("../middlewares/auth");

const router = express.Router();

// Middleware validate
const validate = (schema) => (req, _res, next) => { 
  try { 
    req.body = schema.parse(req.body); 
    next(); 
  } catch (e) { 
    e.status = 400; 
    next(e); 
  } 
};

// --- ROUTES ---

// 1. Tạo đơn hàng (Dùng identifyUser để nhận diện khách/user)
router.post(
  "/", 
  identifyUser, 
  validate(createOrderSchema), 
  (req, res, next) => Promise.resolve(createOrder(req, res, next)).catch(next)
);

// 2. Lấy đơn hàng của tôi (User đăng nhập)
router.get("/me", requireAuth, (req, res, next) => Promise.resolve(listMyOrders(req, res, next)).catch(next));

// 3. Lấy chi tiết đơn hàng (Public hoặc bảo vệ tùy logic, ở đây để public cho tiện tra cứu)
router.get("/:id", (req, res, next) => Promise.resolve(getOrderById(req, res, next)).catch(next));

// --- ADMIN ROUTES ---

// 4. Lấy danh sách tất cả đơn hàng
router.get("/", requireAuth, requireRole("admin"), (req, res, next) => Promise.resolve(listOrders(req, res, next)).catch(next));

// 5. Cập nhật trạng thái đơn hàng
router.put("/:id/status", requireAuth, requireRole("admin"), (req, res, next) => Promise.resolve(updateOrderStatus(req, res, next)).catch(next));

// 6. Xóa đơn hàng (Admin Only)
router.delete("/:id", requireAuth, requireRole("admin"), (req, res, next) => Promise.resolve(deleteOrder(req, res, next)).catch(next));

router.put("/:id/cancel", requireAuth, (req, res, next) => 
  Promise.resolve(cancelOrder(req, res, next)).catch(next)
)

module.exports = router;