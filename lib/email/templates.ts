const LOGO_URL =
  "https://res.cloudinary.com/dgy9bf37b/image/upload/f_png,q_auto:good,w_420/v1769860718/movrr_logo_icon_green_no_bg_pycuih.png";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
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
  const actionButton = input.action
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="left" style="padding:32px 0 0"><a class="button" href="${actionUrl}" style="background:#fafafa;border:1px solid #567260;border-radius:12px;color:#0a3d2e;display:inline-block;font-size:15px;font-weight:700;line-height:18px;padding:15px 26px;text-decoration:none">${actionLabel} &nbsp;&#8594;</a></td></tr></table>`
    : "";
  const fallback = input.action
    ? `<p class="muted" style="color:#737373;font-size:12px;line-height:19px;margin:8px 0 0">If the button does not work, copy and paste this link into your browser:<br><a class="link" href="${actionUrl}" style="color:#0cbe55;text-decoration:underline;word-break:break-all">${actionUrl}</a></p>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${title}</title><style>:root{color-scheme:light dark;supported-color-schemes:light dark}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}@media(prefers-color-scheme:dark){.bg{background:#000d06!important}.card,.content{background:#0c2d1c!important}.body{color:#d1ddd4!important}.muted{color:#a8b6ac!important}.link{color:#10c259!important}}@media only screen and (max-width:600px){.card{width:100%!important;margin:0!important}.header{padding:30px 24px 38px!important}.content{padding:34px 24px 38px!important}.footer{padding:24px!important}.heading{font-size:36px!important;line-height:37px!important}.button{display:block!important;text-align:center!important}}</style><!--[if mso]><style>table,td,p,a{font-family:Arial,sans-serif!important}</style><![endif]--></head><body class="bg" style="background:#003415;color:#405b51;font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:0;width:100%"><div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preview}&#847;&nbsp;${"&#847;&nbsp;".repeat(80)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><table class="card" role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="background:#fff;margin:24px auto;max-width:640px;width:100%"><tr><td class="header" style="background:#003415;padding:42px 48px 52px"><a href="https://movrr.nl" style="display:inline-block;text-decoration:none"><img src="${LOGO_URL}" width="140" height="50" alt="MOVRR" style="border:0;display:block;height:50px;outline:none;width:140px"></a><h1 class="heading" style="color:#fcfcfc;font-size:46px;font-weight:600;letter-spacing:-.045em;line-height:47px;margin:46px 0 20px">${title}</h1><p style="color:#8ba294;font-size:16px;line-height:26px;margin:0">${intro}</p>${actionButton}</td></tr><tr><td class="content" style="background:#fff;padding:42px 48px 46px">${input.body}${fallback}</td></tr><tr><td class="footer" style="background:#072419;border-top:1px solid #214a35;padding:26px 48px 30px"><p class="muted" style="color:#91a69a;font-size:12px;line-height:18px;margin:0 0 5px">${footer}</p><p class="muted" style="color:#91a69a;font-size:12px;line-height:18px;margin:0">Movement that earns.</p></td></tr></table></td></tr></table></body></html>`;
}

export function passwordResetEmail(input: { resetUrl: string }) {
  return {
    subject: "Reset your MOVRR password",
    html: emailDocument({
      preview: "Use this secure link to reset your MOVRR password.",
      title: "Reset your password",
      intro: "We received a request to reset the password for your MOVRR account.",
      body: '<p class="body" style="color:#405b51;font-size:15px;line-height:25px;margin:0 0 17px">This link is single-use and expires automatically. If you did not request a reset, you can safely ignore this email.</p>',
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
      body: '<p class="body" style="color:#405b51;font-size:15px;line-height:25px;margin:0">If you made this change, no further action is needed. If you did not, reset your password immediately and contact MOVRR support.</p>',
      footer: "This is an essential account-security notification.",
    }),
    text: "Your MOVRR password was changed successfully. If you did not make this change, reset your password immediately and contact MOVRR support.",
  };
}
