// ============================================================
// utils/emailService.js
// Sends OTP emails using Nodemailer + Gmail
// ============================================================

const nodemailer = require("nodemailer");

/**
 * Creates a Nodemailer transporter using Gmail App Password.
 * Make sure EMAIL_USER and EMAIL_PASS are set in your .env file.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password, NOT your real password
  },
});

/**
 * Sends a password reset OTP email to the user.
 * @param {string} toEmail  - Recipient email address
 * @param {string} otp      - The 6-digit OTP code
 * @param {string} userName - User's display name (for personalization)
 */
const sendOTPEmail = async (toEmail, otp, userName = "there") => {
  const expiresInMinutes = process.env.OTP_EXPIRES_MINUTES || 10;

  const mailOptions = {
    from: `"StudyMate AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 Your StudyMate AI Password Reset OTP",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2ff; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(79,70,229,0.15); }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .header p { color: rgba(255,255,255,0.85); margin: 5px 0 0; font-size: 13px; }
          .body { padding: 35px 30px; }
          .body p { color: #374151; font-size: 15px; line-height: 1.7; }
          .otp-box { background: #f0f2ff; border: 2px dashed #4f46e5; border-radius: 12px; text-align: center; padding: 20px; margin: 25px 0; }
          .otp-code { font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #4f46e5; }
          .expires { color: #6b7280; font-size: 13px; margin-top: 8px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 12px 16px; color: #92400e; font-size: 13px; margin-top: 20px; }
          .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #9ca3af; font-size: 12px; }
          .footer a { color: #4f46e5; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧠 StudyMate AI</h1>
            <p>EDUCATIONAL PARTNER</p>
          </div>
          <div class="body">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expires">⏱ Expires in ${expiresInMinutes} minutes</div>
            </div>
            <p>Enter this code on the StudyMate AI verification page to reset your password.</p>
            <div class="warning">
              ⚠️ If you did NOT request this, please ignore this email. Your account remains secure.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} StudyMate AI · All rights reserved</p>
            <p>This is an automated email — please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 OTP email sent to ${toEmail}`);
};

module.exports = { sendOTPEmail };
