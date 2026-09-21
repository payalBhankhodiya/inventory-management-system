import { emailTransporter } from "../config/email.js";

const emailUser = process.env.EMAIL_USER;

if (!emailUser) {
  throw new Error("EMAIL_USER is not configured");
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
) {
  await emailTransporter.sendMail({
    from: `"Inventory Management System" <${emailUser}>`,
    to,
    subject,
    html,
  });
}