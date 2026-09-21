import nodemailer from "nodemailer";

const emailHost = process.env.EMAIL_HOST;
const emailPort = Number(process.env.EMAIL_PORT ?? 587);
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

if (!emailHost || !emailUser || !emailPassword) {
  throw new Error("Email configuration is not properly configured");
}

export const emailTransporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});