// src/lib/email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false 
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

async function sendOTPEmail(email, otp, subject) {
  const brandColor = "#000000"; // Màu chủ đạo (Đen sang trọng)
  const logoText = "hydrange";   // Tên thương hiệu

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 0;">
        <tr>
          <td align="center">
            
            <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <tr>
                <td align="center" style="background-color: ${brandColor}; padding: 30px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 4px; text-transform: uppercase; font-weight: 700;">${logoText}</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="color: #111827; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 600;">Xác thực tài khoản của bạn</h2>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                    Xin chào,<br>
                    Cảm ơn bạn đã lựa chọn <strong>${logoText}</strong>. Vui lòng sử dụng mã xác nhận bên dưới để hoàn tất yêu cầu của bạn.
                  </p>

                  <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 700; color: ${brandColor}; letter-spacing: 8px; display: block;">${otp}</span>
                  </div>

                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                    Mã này sẽ hết hạn sau <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} ${logoText}. All rights reserved.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                    Đây là email tự động, vui lòng không trả lời email này.
                  </p>
                </td>
              </tr>

            </table>
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
              Sent with ❤️ from hydrange Team
            </p>

          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"hydrange Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlTemplate,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail };