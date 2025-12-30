const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middlewares/auth");

// SỬA TẠI ĐÂY: Đổi 'getProducts' thành 'getAllProducts' để khớp với controller
const { 
  getAllProducts, 
  getProductBySlug, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require("../controllers/products.controller");

// Public
// SỬA TẠI ĐÂY: Gọi 'getAllProducts'
router.get("/", getAllProducts);
router.get("/slug/:slug", getProductBySlug); // Frontend gọi cái này

// Admin Only
router.post("/", requireAuth, requireRole("admin"), createProduct);
router.put("/:id", requireAuth, requireRole("admin"), updateProduct);
router.delete("/:id", requireAuth, requireRole("admin"), deleteProduct);

module.exports = router;