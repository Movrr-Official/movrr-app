const LOGO_URL =
  "https://res.cloudinary.com/dgy9bf37b/image/upload/v1769860718/movrr_logo_icon_green_no_bg_pycuih.png";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type EmailDocumentInput = {
  preview: string;
  title: string;
  intro: string;
  body: string;
  action?: { label: string; url: string };
  footer: string;
};

function emailDocument(input: EmailDocumentInput): string {
  const preview = escapeHtml(input.preview);
  const title = escapeHtml(input.title);
  const intro = escapeHtml(input.intro);
  const footer = escapeHtml(input.footer);
  const actionUrl = input.action ? escapeHtml(input.action.url) : "";
  const actionLabel = input.action ? escapeHtml(input.action.label) : "";
  const action = input.action
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:10px 0 20px"><a class="button" href="${actionUrl}" style="background:#2f6844;border:1px solid #2f6844;border-radius:8px;color:#fff;display:inline-block;font-size:15px;font-weight:700;line-height:18px;padding:14px 24px;text-decoration:none">${actionLabel}</a></td></tr></table><p class="muted" style="color:#718078;font-size:12px;line-height:19px;margin:0">If the button does not work, copy and paste this link into your browser:<br><a class="link" href="${actionUrl}" style="color:#2f6844;text-decoration:underline;word-break:break-all">${actionUrl}</a></p>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${title}</title><style>:root{color-scheme:light dark;supported-color-schemes:light dark}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}@media(prefers-color-scheme:dark){.bg{background:#101512!important}.card{background:#19201b!important;border-color:#344238!important}.heading,.wordmark{color:#f1f5f2!important}.body{color:#d1ddd4!important}.muted{color:#a8b6ac!important}.rule{border-color:#344238!important}.link{color:#8fd1a5!important}}@media only screen and (max-width:600px){.card{width:auto!important;margin:16px!important}.header,.content,.footer{padding-left:22px!important;padding-right:22px!important}.heading{font-size:23px!important;line-height:29px!important}.button{display:block!important;text-align:center!important}}</style><!--[if mso]><style>table,td,p,a{font-family:Arial,sans-serif!important}</style><![endif]--></head><body class="bg" style="background:#f4f7f5;color:#4d6358;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:0;width:100%"><div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preview}&#847;&nbsp;${"&#847;&nbsp;".repeat(80)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><table class="card" role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border:1px solid #dce6dd;border-radius:14px;margin:40px auto;max-width:560px;overflow:hidden;width:100%"><tr><td class="header" style="padding:26px 30px 22px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="42"><img src="${LOGO_URL}" width="32" height="32" alt="MOVRR" style="border:0;display:block;height:32px;outline:none;width:32px"></td><td class="wordmark" style="color:#1e3a2c;font-size:16px;font-weight:800;letter-spacing:.08em">MOVRR</td></tr></table></td></tr><tr><td class="rule" style="border-top:1px solid #dce6dd"></td></tr><tr><td class="content" style="padding:30px 30px 26px"><h1 class="heading" style="color:#1e3a2c;font-size:26px;line-height:33px;margin:0 0 14px">${title}</h1><p class="body" style="color:#4d6358;font-size:15px;line-height:24px;margin:0 0 18px">${intro}</p>${input.body}${action}</td></tr><tr><td class="footer rule" style="border-top:1px solid #dce6dd;padding:20px 30px 24px"><p class="muted" style="color:#718078;font-size:12px;line-height:18px;margin:0 0 5px">${footer}</p><p class="muted" style="color:#718078;font-size:12px;line-height:18px;margin:0">MOVRR · Movement that earns.</p></td></tr></table></td></tr></table></body></html>`;
}

export function passwordResetEmail(input: { resetUrl: string }) {
  return {
    subject: "Reset your MOVRR password",
    html: emailDocument({
      preview: "Use this secure link to reset your MOVRR password.",
      title: "Reset your password",
      intro: "We received a request to reset the password for your MOVRR account.",
      body: '<p class="body" style="color:#4d6358;font-size:15px;line-height:24px;margin:0 0 16px">This link is single-use and expires automatically. If you did not request a reset, you can safely ignore this email.</p>',
      action: { label: "Reset password", url: input.resetUrl },
      footer: "For your security, MOVRR will never ask you to send your password by email.",
    }),
    text: `Reset your MOVRR password\n\nUse this secure, single-use link to reset your password:\n${input.resetUrl}\n\nIf you did not request a reset, you can ignore this email.`,
  };
}

export function passwordChangedEmail() {
  return {
    subject: "Your MOVRR password was changed",
    html: emailDocument({
      preview: "Your MOVRR account password was changed.",
      title: "Password changed",
      intro: "The password for your MOVRR account was changed successfully.",
      body: '<p class="body" style="color:#4d6358;font-size:15px;line-height:24px;margin:0">If you made this change, no further action is needed. If you did not, reset your password immediately and contact MOVRR support.</p>',
      footer: "This is an essential account-security notification.",
    }),
    text: "Your MOVRR password was changed successfully. If you did not make this change, reset your password immediately and contact MOVRR support.",
  };
}
