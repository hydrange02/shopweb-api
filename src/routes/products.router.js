const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middlewares/auth");
const { 
  getProducts, 
  getProductBySlug, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require("../controllers/products.controller");

// Public
router.get("/", getProducts);
router.get("/slug/:slug", getProductBySlug); // Frontend gọi cái này

// Admin Only
router.post("/", requireAuth, requireRole("admin"), createProduct);
router.put("/:id", requireAuth, requireRole("admin"), updateProduct);
router.delete("/:id", requireAuth, requireRole("admin"), deleteProduct);

module.exports = router;