import nodemailer from "nodemailer";
import { Resend } from "resend";

export type EmailCodeType = "verification" | "reset";

function fromAddress() {
  return process.env.EMAIL_FROM || "watchamoo <onboarding@resend.dev>";
}

function buildHtml(type: EmailCodeType, code: string) {
  const title =
    type === "verification" ? "Verify your watchamoo account" : "Reset your watchamoo password";
  const lead =
    type === "verification"
      ? "Use this code to verify your email and finish signing up."
      : "Use this code to reset your password. It expires in 15 minutes.";

  return `
    <div style="font-family: Nunito, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2b1a12;">
      <p style="font-size: 28px; font-weight: 800; font-style: italic; color: #9a4a1c; margin: 0 0 16px;">watchamoo</p>
      <h1 style="font-size: 22px; margin: 0 0 8px;">${title}</h1>
      <p style="color: #6b5346; line-height: 1.5;">${lead}</p>
      <p style="font-size: 36px; letter-spacing: 0.35em; font-weight: 800; margin: 24px 0; color: #6b3410;">${code}</p>
      <p style="color: #6b5346; font-size: 14px;">If you didn’t request this, you can ignore this email.</p>
    </div>
  `;
}

async function sendWithResend(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
  });
  if (result.error) {
    throw new Error(result.error.message || "Failed to send email via Resend.");
  }
  return result;
}

async function sendWithSmtp(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject,
    html,
  });
  return true;
}

export async function sendAuthCodeEmail(input: {
  to: string;
  code: string;
  type: EmailCodeType;
}) {
  const subject =
    input.type === "verification"
      ? "Your watchamoo verification code"
      : "Your watchamoo password reset code";
  const html = buildHtml(input.type, input.code);

  const viaResend = await sendWithResend(input.to, subject, html);
  if (viaResend) return { provider: "resend" as const };

  const viaSmtp = await sendWithSmtp(input.to, subject, html);
  if (viaSmtp) return { provider: "smtp" as const };

  throw new Error(
    "Email is not configured. Add RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS in backend/.env"
  );
}
