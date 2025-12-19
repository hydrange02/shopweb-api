const { Schema, model } = require("mongoose");

const OTPSchema = new Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ["register", "forgot_password"], required: true },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 300 // Mã tự động xóa khỏi DB sau 5 phút (300 giây)
  }
});

const OTP = model("OTP", OTPSchema);
module.exports = { OTP };