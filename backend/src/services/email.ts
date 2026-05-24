import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  // secure: true for port 465, false for port 587
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER, // Your SMTP username
    pass: process.env.EMAIL_PASS, // Your SMTP password
  },
});

export async function sendVerificationEmail(toEmail: string, token: string) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verificationLink = `${baseUrl}/verify?token=${token}`;

  const mailOptions = {
    from: '"Schedge Support" <noreply@schedge.com>',
    to: toEmail,
    subject: "Verify your Schedge account",
    html: `
      <h1>Welcome to Schedge!</h1>
      <p>Please click the link below to verify your email address and activate your account:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background-color: #82181a; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Account
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">This link will expire in 24 hours.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}


export async function sendEmail(toEmail: string, subject: string, body: string) {

  const mailOptions = {
    from: '"Schedge Support" <noreply@schedge.com>',
    to: toEmail,
    subject,
    html: body,
  };
  await transporter.sendMail(mailOptions);
}
