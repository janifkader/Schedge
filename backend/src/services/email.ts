import { Resend } from "resend";

const resend = new Resend(process.env.EMAIL_PASS);

export async function sendVerificationEmail(toEmail: string, token: string) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verificationLink = `${baseUrl}/verify?token=${token}`;

  await resend.emails.send({
    from: '"Schedge Support" <noreply@schedge.dev>',
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
  });
}


export async function sendEmail(toEmail: string, subject: string, body: string) {

  await resend.emails.send({
    from: '"Schedge Support" <noreply@schedge.com>',
    to: toEmail,
    subject,
    html: body,
  });
}
