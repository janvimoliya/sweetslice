import nodemailer from "nodemailer";
import process from "node:process";
import dns from "node:dns";


dns.setDefaultResultOrder("ipv4first");


const requiredEnvKeys = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
];


const validateMailerEnv = () => {
  const missingKeys = requiredEnvKeys.filter((key) => !process.env[key]);


  if (missingKeys.length > 0) {
    throw new Error(
      `Missing mail configuration: ${missingKeys.join(", ")}. Please set these in backend .env`,
    );
  }
};


const getTransporter = () => {
  validateMailerEnv();

  const smtpUser = String(process.env.SMTP_USER || "").trim();
  const smtpPass = String(process.env.SMTP_PASS || "").replace(/\s+/g, "").trim();


  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};


export const sendVerificationEmail = async ({
  toEmail,
  subject,
  html,
}) => {
  const transporter = getTransporter();
  const senderAddress =
    process.env.MAIL_FROM || process.env.MAIL_FORM || process.env.SMTP_USER;


  console.log("📧 Sending email to:", toEmail);
  console.log("📧 Subject:", subject);


  try {
    const info = await transporter.sendMail({
      from: senderAddress,
      to: toEmail,
      subject,
      html,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];

    // Treat rejected recipients as a send failure so API responses stay truthful.
    if (rejected.length > 0) {
      throw new Error(
        `SMTP rejected recipient(s): ${rejected.join(", ")}. Accepted: ${accepted.join(", ") || "none"}`,
      );
    }

    console.log("✅ Email queued:", {
      messageId: info.messageId,
      accepted,
      rejected,
      response: info.response,
    });

    return info;
  } catch (err) {
    console.error("❌ Mail send error:", err.message);
    console.error("❌ Full error:", err);
    throw err;
  }
};
