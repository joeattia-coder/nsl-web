import "server-only";

import nodemailer from "nodemailer";

type PasswordResetEmailInput = {
  to: string;
  resetLink: string;
  expiresAt: Date;
};

type AccountInvitationEmailInput = {
  to: string;
  inviteLink: string;
  expiresAt: Date;
  playerName?: string | null;
};

type MailTransportConfig = {
  host: string;
  port: number;
  secure: boolean;
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
  user: string | null;
  password: string | null;
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function getMailTransportConfig(): MailTransportConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();

  if (!host || !fromEmail) {
    return null;
  }

  const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "587", 10);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a valid positive integer.");
  }

  return {
    host,
    port,
    secure: parseBoolean(process.env.SMTP_SECURE, port === 465),
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME?.trim() || "National Snooker League",
    replyTo: process.env.SMTP_REPLY_TO?.trim() || null,
    user: process.env.SMTP_USER?.trim() || null,
    password: process.env.SMTP_PASSWORD?.trim() || null,
  };
}

function createTransport(config: MailTransportConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.password
        ? {
            user: config.user,
            pass: config.password,
          }
        : undefined,
  });
}

function formatExpiry(expiresAt: Date) {
  return expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isEmailDeliveryConfigured() {
  return getMailTransportConfig() !== null;
}

export async function sendPasswordResetEmail({
  to,
  resetLink,
  expiresAt,
}: PasswordResetEmailInput) {
  const config = getMailTransportConfig();

  if (!config) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST and SMTP_FROM_EMAIL to enable email delivery."
    );
  }

  const transporter = createTransport(config);
  const expiryLabel = formatExpiry(expiresAt);

  await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to,
    replyTo: config.replyTo ?? undefined,
    subject: "Reset your NSL admin password",
    text: [
      "A request was made to reset your National Snooker League admin password.",
      "",
      `Use this link to set a new password: ${resetLink}`,
      "",
      `This link expires at ${expiryLabel}.`,
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <p>A request was made to reset your National Snooker League admin password.</p>
        <p>
          <a
            href="${resetLink}"
            style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none;"
          >
            Reset password
          </a>
        </p>
        <p>This link expires at ${expiryLabel}.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendAccountInvitationEmail({
  to,
  inviteLink,
  expiresAt,
  playerName,
}: AccountInvitationEmailInput) {
  const config = getMailTransportConfig();

  if (!config) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST and SMTP_FROM_EMAIL to enable email delivery."
    );
  }

  const transporter = createTransport(config);
  const expiryLabel = formatExpiry(expiresAt);
  const greetingTarget = playerName?.trim() || "there";

  await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to,
    replyTo: config.replyTo ?? undefined,
    subject: "You have been invited to create your NSL account",
    text: [
      `Hi ${greetingTarget},`,
      "",
      "You have been invited to register your National Snooker League player account.",
      "",
      `Use this link to complete your account setup: ${inviteLink}`,
      "",
      `This link expires at ${expiryLabel}.`,
      "If you were not expecting this invitation, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <p>Hi ${greetingTarget},</p>
        <p>
          You have been invited to register your National Snooker League player account.
        </p>
        <p>
          <a
            href="${inviteLink}"
            style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none;"
          >
            Complete account setup
          </a>
        </p>
        <p>This link expires at ${expiryLabel}.</p>
        <p>If you were not expecting this invitation, you can ignore this email.</p>
      </div>
    `,
  });
}