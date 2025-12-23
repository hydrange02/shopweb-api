const { verifyToken } = require("../lib/auth");

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const [, token] = h.split(" ");
  if (!token) return res.status(401).json({ ok: false, error: { code: "UNAUTHORIZED", message: "Missing token" } });
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "Insufficient role" } });
    }
    next();
  };
}

function identifyUser(req, res, next) {
  const h = req.headers.authorization || "";
  const [, token] = h.split(" ");
  
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = payload; // Gắn thông tin user vào request
    } catch (e) {
      // Token lỗi hoặc hết hạn thì bỏ qua, coi như khách vãng lai
      console.warn("Invalid token in optional auth, treating as guest");
    }
  }
  next();
}

module.exports = { requireAuth, requireRole, identifyUser };