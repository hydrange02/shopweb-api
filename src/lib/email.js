const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Sử dụng SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Cho phép kết nối ngay cả khi chứng chỉ không khớp
  },
  connectionTimeout: 10000, // Tăng thời gian chờ kết nối lên 10 giây
  greetingTimeout: 10000,
});

async function sendOTPEmail(email, otp, subject) {
  const mailOptions = {
    from: `"Hydrange Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h3 style="color: #333;">Xác nhận danh tính của bạn</h3>
        <p>Mã xác nhận đăng ký của bạn là:</p>
        <div style="background: #f4f4f4; padding: 10px; text-align: center; border-radius: 5px;">
          <b style="color: blue; font-size: 28px; letter-spacing: 5px;">${otp}</b>
        </div>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail };