const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Khai báo Router
const authRouter = require("./routes/auth.router");
const productsRouter = require("./routes/products.router");
const ordersRouter = require("./routes/orders.router");
const cartRouter = require("./routes/cart.router");

// 🔥 FIX: Import trực tiếp (không dùng { }) vì bên kia export thẳng router
const reviewRouter = require("./routes/review.router");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || "http://localhost:3000", 
  credentials: true 
}));
app.use(express.json({ limit: "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/cart", cartRouter);

// 🔥 Route review gắn vào /api/v1 (các path con đã định nghĩa bên trong router)
app.use("/api/v1", reviewRouter);

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ ok: true, service: "hydrange-api" });
});

app.get("/", (req, res) => {
  res.json({ ok: true, service: "hydrange-api", version: "v1" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// Error Handler
app.use((err, req, res, next) => {
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