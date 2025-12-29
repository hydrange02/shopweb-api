const { User } = require("../models/user.model");
const { OTP } = require("../models/otp.model");
const { sendOTPEmail } = require("../lib/email");
const { hashPassword, comparePassword, signToken } = require("../lib/auth");

/** 1. Gửi mã OTP khi đăng ký */
async function sendRegisterOTP(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: "Vui lòng cung cấp email" });
    
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ ok: false, error: { message: "Email đã được sử dụng" } });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.findOneAndUpdate({ email, type: "register" }, { otp }, { upsert: true });

    await sendOTPEmail(email, otp, "Xác nhận đăng ký - hydrange");
    return res.json({ ok: true, message: "Mã xác nhận đã được gửi đến email của bạn" });
  } catch (err) {
    next(err);
  }
}
// XOÁ BỎ ĐOẠN KHAI BÁO LỒNG NHAU THỪA PHÍA DƯỚI

/** 2. Xác thực OTP và tạo tài khoản chính thức */
async function confirmRegister(req, res, next) {
  try {
    const { name, email, password, otp } = req.body;
    const validOTP = await OTP.findOne({ email, otp, type: "register" });

    if (!validOTP)
      return res
        .status(400)
        .json({
          ok: false,
          error: { message: "Mã xác nhận không đúng hoặc đã hết hạn" },
        });

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role: "user" });

    await OTP.deleteOne({ _id: validOTP._id });

    const token = signToken(user);
    return res.status(201).json({ ok: true, token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/** 3. Đăng nhập (Hàm đã bị thiếu) */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({
          ok: false,
          error: { message: "Email hoặc mật khẩu không chính xác" },
        });

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch)
      return res
        .status(401)
        .json({
          ok: false,
          error: { message: "Email hoặc mật khẩu không chính xác" },
        });

    const token = signToken(user);
    return res.json({ ok: true, token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/** 4. Quên mật khẩu - Gửi mã xác nhận */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({
          ok: false,
          error: { message: "Email không tồn tại trên hệ thống" },
        });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.findOneAndUpdate(
      { email, type: "forgot_password" },
      { otp },
      { upsert: true }
    );

    await sendOTPEmail(email, otp, "Khôi phục mật khẩu - hydrange");
    return res.json({ ok: true, message: "Mã khôi phục đã được gửi" });
  } catch (err) {
    next(err);
  }
}

/** 5. Đặt lại mật khẩu mới */
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    const validOTP = await OTP.findOne({ email, otp, type: "forgot_password" });

    if (!validOTP)
      return res
        .status(400)
        .json({ ok: false, error: { message: "Mã xác nhận không hợp lệ" } });

    const passwordHash = await hashPassword(newPassword);
    await User.findOneAndUpdate({ email }, { passwordHash });
    await OTP.deleteOne({ _id: validOTP._id });

    return res.json({
      ok: true,
      message: "Mật khẩu đã được cập nhật thành công",
    });
  } catch (err) {
    next(err);
  }
}

/** 6. Lấy thông tin cá nhân */
async function me(req, res) {
  // req.user lấy từ middleware requireAuth
  const user = await User.findById(req.user.sub).select("-password").lean();
  if (!user) return res.status(404).json({ ok: false, message: "User không tồn tại" });
  
  return res.json({ 
    ok: true, 
    user: {
      name: user.name,
      email: user.email,
      role: user.role
    } 
  });
}

async function getMe(req, res, next) {
  try {
    // req.user.sub lấy từ middleware requireAuth
    const user = await User.findById(req.user.sub).select("-password"); // Không trả về password
    if (!user) {
        return res.status(404).json({ ok: false, error: "User not found" });
    }
    return res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.sub; // Lấy từ token

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ ok: false, message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, message: "User không tồn tại" });

    // Kiểm tra mật khẩu cũ
    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ ok: false, message: "Mật khẩu hiện tại không chính xác" });
    }

    // Mã hóa và lưu mật khẩu mới
    const newPasswordHash = await hashPassword(newPassword);
    user.passwordHash = newPasswordHash;
    await user.save();

    return res.json({ ok: true, message: "Đổi mật khẩu thành công" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register: sendRegisterOTP,
  confirmRegister,
  forgotPassword,
  resetPassword,
  login,
  me,
  changePassword,
};
