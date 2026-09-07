import "server-only";

import { createHash } from "crypto";
import { RESEND_API_KEY, SYSTEM_EMAIL } from "@/lib/env";
import { passwordChangedEmail, passwordResetEmail } from "./templates";

type SendResult = { sent: true } | { sent: false; reason: "not_configured" | "failed" };

function idempotencyKey(
  kind: string,
  recipientKey: string,
  deduplicationWindowMs: number,
): string {
  const window = Math.floor(Date.now() / deduplicationWindowMs);
  const digest = createHash("sha256")
    .update(`${kind}:${recipientKey.toLowerCase()}:${window}`)
    .digest("hex")
    .slice(0, 32);
  return `movrr-app:${kind}:${digest}`;
}

async function send(
  to: string,
  message: { subject: string; html: string; text: string },
  key: string,
): Promise<SendResult> {
  if (!RESEND_API_KEY) return { sent: false, reason: "not_configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify({
        from: `MOVRR <${SYSTEM_EMAIL}>`,
        to: [to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        tags: [{ name: "category", value: "account-security" }],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Account email delivery failed", {
        status: response.status,
        kind: message.subject,
      });
      return { sent: false, reason: "failed" };
    }
    return { sent: true };
  } catch (error) {
    console.error("Account email delivery exception", {
      kind: message.subject,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { sent: false, reason: "failed" };
  }
}

export function sendPasswordResetEmail(email: string, resetUrl: string) {
  return send(
    email,
    passwordResetEmail({ resetUrl }),
    idempotencyKey("password-reset", email, 300_000),
  );
}

export function sendPasswordChangedEmail(userId: string, email: string) {
  return send(
    email,
    passwordChangedEmail(),
    // Each successful password change is independently security-significant.
    idempotencyKey("password-changed", userId, 1),
  );
}
