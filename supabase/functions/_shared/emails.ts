// Shared brand-styled email templates for La Tribu.
// Email clients can't load web fonts reliably, so we use web-safe stacks with
// the brand display look approximated by bold uppercase + letter-spacing.

const SITE = "https://latribu.co.uk";
const LOGO = `${SITE}/images/logo-white.svg`;
const HERO = `${SITE}/images/hero-bg.webp`;
const SHOTS = `${SITE}/images/tequila_shots.png`;

// Brand tokens (from css/styles.css)
const CHARCOAL = "#12100e";
const CREAM = "#f4eadc";
const GOLD = "#e2a23c";
const CORAL = "#ef5a3f";
const WHITE = "#fff8ec";
const MUTED = "#d8c7af";

function shell(innerHtml: string, preheader: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>La Tribu</title>
</head>
<body style="margin:0;padding:0;background:${CHARCOAL};">
<span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CHARCOAL};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CHARCOAL};border:1px solid rgba(226,162,60,0.25);border-radius:18px;overflow:hidden;">
      <tr><td align="center" style="padding:36px 32px 8px;">
        <img src="${LOGO}" width="150" alt="La Tribu" style="display:block;border:0;outline:none;max-width:150px;height:auto;">
      </td></tr>
      ${innerHtml}
      <tr><td style="padding:28px 32px 36px;border-top:1px solid rgba(226,162,60,0.18);">
        <p style="margin:0;color:${MUTED};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;text-align:center;">
          La Tribu London &middot; Latin heart. London home.<br>
          You received this because you joined the Tribe at <a href="${SITE}" style="color:${GOLD};text-decoration:none;">latribu.co.uk</a>.<br>
          <a href="${SITE}/unsubscribe" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function welcomeEmail(opts: { offerCode?: string | null; eventLabel?: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const { offerCode, eventLabel = "9 July 2026" } = opts;

  const codeBlock = offerCode
    ? `
      <tr><td align="center" style="padding:8px 32px 4px;">
        <p style="margin:0 0 10px;color:${WHITE};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;">
          Here's your code for <strong style="color:${GOLD};">2 free shots</strong> on ${eventLabel}:
        </p>
      </td></tr>
      <tr><td align="center" style="padding:4px 32px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td
          style="background:rgba(226,162,60,0.10);border:2px dashed ${GOLD};border-radius:12px;padding:18px 26px;">
          <span style="font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:bold;letter-spacing:3px;color:${GOLD};">${offerCode}</span>
        </td></tr></table>
      </td></tr>
      <tr><td align="center" style="padding:6px 32px 8px;">
        <p style="margin:0;color:${MUTED};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
          Show this code at the bar. One code per person. Over-18s only.<br>Valid only at La Tribu on ${eventLabel}.
        </p>
      </td></tr>`
    : `
      <tr><td align="center" style="padding:8px 32px 12px;">
        <p style="margin:0;color:${WHITE};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;">
          You're on the list for event drops, exclusive offers and community news.
        </p>
      </td></tr>`;

  const html = shell(`
      <tr><td align="center" style="padding:8px 32px 0;">
        <h1 style="margin:0;color:${CREAM};font-family:'Arial Black',Arial,sans-serif;font-size:34px;line-height:1.1;letter-spacing:2px;text-transform:uppercase;">Welcome to the Tribe</h1>
      </td></tr>
      <tr><td align="center" style="padding:14px 32px 8px;">
        <img src="${SHOTS}" width="220" alt="" style="display:block;border:0;border-radius:12px;max-width:220px;height:auto;">
      </td></tr>
      ${codeBlock}
      <tr><td align="center" style="padding:18px 32px 8px;">
        <a href="${SITE}" style="display:inline-block;background:${CORAL};color:${CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 30px;border-radius:999px;">See what's on</a>
      </td></tr>
  `, offerCode ? `Your code for 2 free shots on ${eventLabel} is inside.` : "Welcome to La Tribu.");

  const text = offerCode
    ? `WELCOME TO THE TRIBE\n\nHere's your code for 2 free shots on ${eventLabel}:\n\n    ${offerCode}\n\nShow this code at the bar. One code per person. Over-18s only. Valid only at La Tribu on ${eventLabel}.\n\nSee what's on: ${SITE}\n\n--\nLa Tribu London. Unsubscribe: ${SITE}/unsubscribe`
    : `WELCOME TO THE TRIBE\n\nYou're on the list for event drops, exclusive offers and community news.\n\nSee what's on: ${SITE}\n\n--\nLa Tribu London. Unsubscribe: ${SITE}/unsubscribe`;

  return {
    subject: offerCode ? "Welcome to La Tribu — your 2 free shots are inside" : "Welcome to La Tribu",
    html,
    text,
  };
}

// Reusable promo skeleton for one-off Broadcasts sent from the Resend dashboard.
export function promoEmail(opts: {
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  heroUrl?: string;
}): string {
  const { headline, body, ctaLabel, ctaUrl, heroUrl = HERO } = opts;
  const cta = ctaLabel && ctaUrl
    ? `<tr><td align="center" style="padding:18px 32px 8px;">
         <a href="${ctaUrl}" style="display:inline-block;background:${CORAL};color:${CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 30px;border-radius:999px;">${ctaLabel}</a>
       </td></tr>`
    : "";
  return shell(`
      <tr><td align="center" style="padding:14px 0 0;">
        <img src="${heroUrl}" width="600" alt="" style="display:block;border:0;width:100%;max-width:600px;height:auto;">
      </td></tr>
      <tr><td align="center" style="padding:22px 32px 0;">
        <h1 style="margin:0;color:${CREAM};font-family:'Arial Black',Arial,sans-serif;font-size:30px;line-height:1.15;letter-spacing:1.5px;text-transform:uppercase;">${headline}</h1>
      </td></tr>
      <tr><td align="center" style="padding:14px 32px 4px;">
        <p style="margin:0;color:${WHITE};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;">${body}</p>
      </td></tr>
      ${cta}
  `, headline);
}
