import { NextResponse } from "next/server";
import {
  brevoErrorMessage,
  isValidEmail,
  looksLikeBrevoSmtpKey,
  normalizeEnv,
} from "@/lib/brevo-shared";

export const runtime = "nodejs";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeOneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildNewsletterNotifyHtml(subscriberEmail: string) {
  const e = escapeHtml(subscriberEmail);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f5;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(1,8,6,0.08);">
      <div style="height:5px;background:#DB9D30;"></div>
      <div style="padding:28px 24px 24px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#397466;">Muslim Nikah Matrimony</p>
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#010806;">New newsletter subscription</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#5c6562;">Someone subscribed via the website footer.</p>
        <div style="padding:16px;background:#E6EEEC;border-radius:12px;font-size:15px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;color:#397466;">Subscriber email</p>
          <a href="mailto:${encodeURIComponent(subscriberEmail)}" style="color:#085140;font-weight:600;">${e}</a>
        </div>
        <p style="margin:20px 0 0;font-size:12px;color:#878787;">Reply to this email to contact the subscriber (Reply-To is set to their address).</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const apiKey = normalizeEnv(process.env.BREVO_API_KEY);
    const senderEmail = normalizeEnv(process.env.BREVO_SENDER_EMAIL);
    const senderName =
      normalizeEnv(process.env.BREVO_SENDER_NAME) || "Muslim Nikah Matrimony";
    const toEmail = normalizeEnv(process.env.CONTACT_TO_EMAIL);

    if (!apiKey || !senderEmail || !toEmail) {
      return NextResponse.json(
        {
          ok: false,
          error: "Newsletter is not configured on the server.",
        },
        { status: 500 },
      );
    }

    if (looksLikeBrevoSmtpKey(apiKey)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email configuration." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as { email?: string };
    const email = sanitizeOneLine(body.email ?? "");

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Please enter your email address." },
        { status: 400 },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const subject = `Newsletter subscription — ${email}`;
    const textContent = [
      "Muslim Nikah Matrimony — Newsletter subscription (footer)",
      "",
      "A visitor subscribed to updates from the website footer.",
      "",
      `Subscriber email: ${email}`,
      "",
      "Reply to this email to contact them (Reply-To is set to their address).",
    ].join("\n");

    const htmlContent = buildNewsletterNotifyHtml(email);

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
        replyTo: { email, name: "Newsletter subscriber" },
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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }
}
