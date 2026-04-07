import { NextResponse } from "next/server";
import {
  brevoErrorMessage,
  isValidEmail,
  looksLikeBrevoSmtpKey,
  normalizeEnv,
} from "@/lib/brevo-shared";

/** Ensure Node runtime (full `fetch` + env) for outbound Brevo calls. */
export const runtime = "nodejs";

type ContactPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
};

/** Optional phone: if provided, require plausible length after stripping formatting. */
function phoneDigitsOnly(phone: string) {
  return phone.replace(/[\s\-().+]/g, "");
}

function isValidPhoneOptional(phone: string) {
  const t = phone.trim();
  if (!t) return true;
  const d = phoneDigitsOnly(t);
  return /^\d+$/.test(d) && d.length >= 8 && d.length <= 15;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildNotificationHtml(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  message: string,
) {
  const p = phone || "—";
  const msg = escapeHtml(message).replace(/\r\n|\n|\r/g, "<br/>");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f5;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(1,8,6,0.08);">
      <div style="height:5px;background:#DB9D30;"></div>
      <div style="padding:28px 24px 24px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#397466;font-family:system-ui,sans-serif;">Muslim Nikah Matrimony</p>
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#010806;">New contact form message</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#5c6562;font-family:system-ui,sans-serif;">A visitor submitted the contact form on your website.</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;font-family:system-ui,sans-serif;color:#010806;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E6EEEC;color:#666;width:120px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #E6EEEC;">${escapeHtml(`${firstName} ${lastName}`)}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E6EEEC;color:#666;">Email</td><td style="padding:10px 0;border-bottom:1px solid #E6EEEC;"><a href="mailto:${encodeURIComponent(email)}" style="color:#397466;">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E6EEEC;color:#666;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #E6EEEC;">${escapeHtml(p)}</td></tr>
        </table>
        <div style="margin-top:20px;padding:18px;background:#E6EEEC;border-radius:12px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#397466;font-family:system-ui,sans-serif;">Message</p>
          <div style="margin:0;font-size:14px;line-height:1.6;color:#010806;font-family:system-ui,sans-serif;">${msg}</div>
        </div>
        <p style="margin:24px 0 0;font-size:12px;color:#878787;font-family:system-ui,sans-serif;">Reply directly to this email to reach the sender (Reply-To is set to their address).</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildAutoReplyHtml(firstName: string, message: string) {
  const msg = escapeHtml(message).replace(/\r\n|\n|\r/g, "<br/>");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f5;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(1,8,6,0.08);">
      <div style="height:5px;background:#DB9D30;"></div>
      <div style="padding:28px 24px 24px;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#010806;">Assalamu alaikum ${escapeHtml(firstName)},</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5c6562;">Thank you for contacting <strong style="color:#397466;">Muslim Nikah Matrimony</strong>. We have received your message and aim to respond within 24 hours.</p>
        <div style="padding:16px;background:#E6EEEC;border-radius:12px;font-size:14px;line-height:1.6;color:#010806;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;color:#397466;">Your message</p>
          <div style="margin:0;">${msg}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function sanitizeOneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export async function POST(req: Request) {
  try {
    const apiKey = normalizeEnv(process.env.BREVO_API_KEY);
    const senderEmail = normalizeEnv(process.env.BREVO_SENDER_EMAIL);
    const senderName = normalizeEnv(process.env.BREVO_SENDER_NAME) || "Muslim Nikah Matrimony";
    const toEmail = normalizeEnv(process.env.CONTACT_TO_EMAIL);

    if (!apiKey || !senderEmail || !toEmail) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server email is not configured. Missing BREVO_API_KEY / BREVO_SENDER_EMAIL / CONTACT_TO_EMAIL.",
        },
        { status: 500 },
      );
    }

    if (looksLikeBrevoSmtpKey(apiKey)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "BREVO_API_KEY is your SMTP key (xsmtpsib-…). Use an API key from Brevo → SMTP & API → API Keys instead, then restart npm run dev.",
        },
        { status: 400 },
      );
    }

    const body = (await req.json()) as Partial<ContactPayload>;

    const firstName = sanitizeOneLine(body.firstName ?? "");
    const lastName = sanitizeOneLine(body.lastName ?? "");
    const email = sanitizeOneLine(body.email ?? "");
    const phone = sanitizeOneLine(body.phone ?? "");
    const message = (body.message ?? "").toString().trim();

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Please fill in all required fields." },
        { status: 400 },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }
    if (!isValidPhoneOptional(phone)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Please enter a valid phone number (8–15 digits), or leave it blank.",
        },
        { status: 400 },
      );
    }
    if (message.length < 5) {
      return NextResponse.json(
        { ok: false, error: "Message is too short." },
        { status: 400 },
      );
    }

    const subject = `New contact message from ${firstName} ${lastName}`;

    const textContent = [
      "Muslim Nikah Matrimony — New contact form submission",
      "",
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      "",
      "Message:",
      message,
      "",
      "—",
      "Reply to this email to contact the sender (Reply-To set to their address).",
    ].join("\n");

    const htmlContent = buildNotificationHtml(
      firstName,
      lastName,
      email,
      phone,
      message,
    );

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject,
        textContent,
        htmlContent,
        replyTo: { email, name: `${firstName} ${lastName}` },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      const friendly = brevoErrorMessage(errorText, apiKey);
      const clientStatus =
        res.status >= 400 && res.status < 500 ? res.status : 502;
      return NextResponse.json(
        {
          ok: false,
          error: friendly,
          details:
            process.env.NODE_ENV === "development"
              ? errorText || undefined
              : undefined,
        },
        { status: clientStatus },
      );
    }

    // Optional auto-reply to the user (set CONTACT_AUTOREPLY=true)
    const autoReplyEnabled = (process.env.CONTACT_AUTOREPLY ?? "")
      .toLowerCase()
      .trim();
    if (autoReplyEnabled === "true") {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email }],
          subject: "We received your message — Muslim Nikah Matrimony",
          textContent: [
            `Assalamu alaikum ${firstName},`,
            "",
            "Thank you for contacting Muslim Nikah Matrimony.",
            "We received your message and aim to respond within 24 hours.",
            "",
            "Your message:",
            message,
            "",
            "— Muslim Nikah Matrimony",
          ].join("\n"),
          htmlContent: buildAutoReplyHtml(firstName, message),
        }),
      }).catch(() => {
        // best-effort; ignore auto-reply failures
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }
}

