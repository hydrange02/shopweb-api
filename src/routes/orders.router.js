const express = require("express");
const { createOrder, getOrderById, listOrders } = require("../controllers/orders.controller");
const { createOrderSchema } = require("../schemas/order.dto");
const { requireAuth, requireRole } = require("../middlewares/auth");

const router = express.Router();
const validate = (schema) => (req, _res, next) => { try { req.body = schema.parse(req.body); next(); } catch (e) { e.status = 400; next(e); } };

router.post("/", validate(createOrderSchema), (req, res, next) => Promise.resolve(createOrder(req, res, next)).catch(next));
router.get("/:id", (req, res, next) => Promise.resolve(getOrderById(req, res, next)).catch(next));
router.get("/", requireAuth, requireRole("admin"), (req, res, next) => Promise.resolve(listOrders(req, res, next)).catch(next));

module.exports = router;