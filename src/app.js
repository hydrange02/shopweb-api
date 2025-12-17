const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
// ===== App =====
const app = express();

app.use(cors({ origin: ORIGIN, credentials: false }));

app.set("trust proxy", 1);


// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false, // tránh chặn ảnh/static khi cần
  })
);

// Body parser & logger
app.use(express.json({ limit: "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// CORS theo ENV
const allowOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: allowOrigin,
    credentials: true,
  })
);



const authRouter = require("./routes/auth.router");
app.use("/api/v1/auth", authRouter);

const productsRouter = require("./routes/products.router");//...
app.use("/api/v1/products", productsRouter);//...


const ordersRouter = require("./routes/orders.router");

app.use("/api/v1/products", productsRouter);
app.use("/api/v1/orders", ordersRouter);

// API prefix v1
const api = express.Router();

api.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "shoply-api",
    version: "v1",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/v1", api);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "shoply-api",
    tip: "API health at /api/v1/health",
    version: "v1",
  });
});

// Error Handler chuẩn JSON
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const code = err.code || (status === 500 ? "INTERNAL_ERROR" : "UNKNOWN_ERROR");
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production") {
    console.error("[ERROR]", status, code, message, err.stack);
  }
  res.status(status).json({ ok: false, error: { code, message } });
});

// 404 Not Found (sau cùng)
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: { code: "NOT_FOUND", message: "Route not found", path: req.originalUrl },
  });
});


module.exports = app;