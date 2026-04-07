/** Strip BOM / accidental whitespace from .env (common on Windows). */
export function normalizeEnv(value: string | undefined) {
  if (!value) return "";
  return value.replace(/^\uFEFF/, "").trim();
}

export function isValidEmail(email: string) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

export function looksLikeBrevoSmtpKey(key: string) {
  return key.trim().toLowerCase().startsWith("xsmtpsib-");
}

export function brevoErrorMessage(rawBody: string, apiKeyHint: string): string {
  try {
    const j = JSON.parse(rawBody) as { message?: string; code?: string };

    if (
      /authorised ip|authorized ip|ip address|whitelist|unknown ip/i.test(
        j.message ?? "",
      )
    ) {
      return (
        "Brevo rejected the request (IP security). Open Brevo → Security → Authorized IPs " +
        "(https://app.brevo.com/security/authorised_ips): allow your IP or disable blocking for unknown IPs, then try again."
      );
    }

    if (j.code === "unauthorized" || /key not found/i.test(j.message ?? "")) {
      return looksLikeBrevoSmtpKey(apiKeyHint)
        ? "Wrong key type: you pasted the SMTP key (starts with xsmtpsib-). Use the API key from SMTP & API → API keys & MCP (starts with xkeysib-), not the SMTP password."
        : "Brevo did not accept this API key. Copy the full key again from SMTP & API → API keys & MCP (use the “API key” field, not MCP). If it still fails, generate a new key, replace BREVO_API_KEY in .env, restart npm run dev, and check Brevo → Security → Authorized IPs.";
    }
    if (j.message) return j.message;
  } catch {
    // ignore
  }
  return "Brevo rejected the email request. Check the response details or Brevo logs.";
}
