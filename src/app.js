const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Khai báo Router
const authRouter = require("./routes/auth.router");
const productsRouter = require("./routes/products.router");
const ordersRouter = require("./routes/orders.router");
const cartRouter = require("./routes/cart.router");
const { reviewRouter } = require("./routes/review.router");
const app = express();

// 1. Cấu hình bảo mật và Middleware cơ bản
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || "http://localhost:3000", 
  credentials: true 
}));
app.use(express.json({ limit: "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 2. Đăng ký các API Routes chính thức
// Gắn tiền tố /api/v1 để khớp với Frontend
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1", reviewRouter);

// 3. Các route tiện ích khác (Health check)
const utilityRouter = express.Router();
utilityRouter.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "hydrange-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
app.use("/api/v1", utilityRouter);

// Trang chủ API
app.get("/", (req, res) => {
  res.json({ ok: true, service: "hydrange-api", version: "v1" });
});

// 4. Xử lý lỗi 404 (Khi không khớp bất kỳ route nào bên trên)
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: { 
      code: "NOT_FOUND", 
      message: "Route not found", 
      path: req.originalUrl 
    },
  });
});

// 5. Xử lý lỗi tập trung (Error Handler)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({ 
    ok: false, 
    error: { 
      code: err.code || "INTERNAL_ERROR", 
      message: err.message || "Internal Server Error" 
    } 
  });
});

module.exports = app;