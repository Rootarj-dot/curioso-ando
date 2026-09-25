import nodemailer from "nodemailer";

/**
 * Delivery for the public contact form.
 *
 * The form used to fake a successful send, so messages were silently dropped.
 * Configure these in the hosting panel:
 *
 *   SMTP_HOST      smtp.hostinger.com
 *   SMTP_PORT      465
 *   SMTP_USER      the mailbox address that sends
 *   SMTP_PASS      its password
 *   CONTACT_TO     where the messages should land (defaults below)
 */

const DEFAULT_CONTACT_TO = "julanito94_9@hotmail.com";

export function isMailerConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function buildTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const to = process.env.CONTACT_TO || DEFAULT_CONTACT_TO;
  const transport = buildTransport();

  // From must stay on our own domain or the mail is rejected as spoofed; the
  // visitor's address goes in Reply-To so a reply reaches them directly.
  await transport.sendMail({
    from: `"Curioseando Ando" <${process.env.SMTP_USER}>`,
    to,
    replyTo: `"${input.name}" <${input.email}>`,
    subject: `Mensaje de ${input.name} desde Curioseando Ando`,
    text: `Nombre: ${input.name}\nCorreo: ${input.email}\n\n${input.message}\n`,
    html:
      `<p><strong>Nombre:</strong> ${escapeHtml(input.name)}<br>` +
      `<strong>Correo:</strong> ${escapeHtml(input.email)}</p>` +
      `<hr><p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
  });
}

/**
 * Small in-memory throttle. A public form that sends mail is a spam target, and
 * this keeps one address from flooding the mailbox without needing a store.
 */
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

export function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return true;
}
