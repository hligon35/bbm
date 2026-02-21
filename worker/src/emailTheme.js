function safeText(v) {
  return String(v || '').trim();
}

/**
 * Shared HTML wrapper for all outbound emails.
 *
 * Email-client friendly:
 * - table-based layout
 * - inline styles
 * - avoids relying on CSS support beyond basics
 */
export function wrapBbmEmailHtml({
  title,
  preheader,
  contentHtml,
  footerHtml,
}) {
  const t = safeText(title);
  const ph = safeText(preheader);
  const body = String(contentHtml || '');
  const footer = String(footerHtml || '');

  // Theme tokens (mirrors the site): dark + gold accent.
  const bg = '#0a0a0a';
  const panel = '#151515';
  const border = '#2a2a2a';
  const text = '#ffffff';
  const muted = '#bdbdbd';
  const accent = '#f7c873';

  // A common Outlook trick: include a lot of whitespace after the preheader.
  const preheaderPadding = '&nbsp;'.repeat(200);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${t}</title>
  </head>
  <body style="margin:0; padding:0; background:${bg}; color:${text};">
    ${
      ph
        ? `<div style="display:none; font-size:1px; color:${bg}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${ph}${preheaderPadding}</div>`
        : ''
    }
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${bg}; width:100%;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="padding:0 0 14px 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
                <div style="font-size:12px; letter-spacing:3px; text-transform:uppercase; color:${muted};">Black Bridge Mindset</div>
                ${t ? `<div style="margin-top:10px; font-size:20px; font-weight:700; color:${text};">${t}</div>` : ''}
                <div style="margin-top:12px; height:2px; background:${accent}; width:100%;"></div>
              </td>
            </tr>
            <tr>
              <td style="background:${panel}; border:1px solid ${border}; border-radius:14px; padding:18px 18px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.6; color:${text};">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 2px 0 2px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:${muted}; font-size:12px; line-height:1.5;">
                ${
                  footer
                    ? footer
                    : `<div>Black Bridge Mindset</div>
                       <div style="margin-top:6px;">If this email isn’t relevant to you, you can ignore it.</div>`
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function bbmLinkStyle() {
  return 'color:#f7c873; text-decoration:underline;';
}

export function bbmMutedTextStyle() {
  return 'color:#bdbdbd;';
}

export function renderBbmCodeBoxHtml(codeEscaped) {
  const code = String(codeEscaped || '');
  return `
    <div style="font-size:26px; font-weight:800; letter-spacing:6px; padding:14px 16px; background:#232323; border:1px solid #2a2a2a; border-radius:12px; display:inline-block; color:#ffffff;">
      ${code}
    </div>
  `;
}

export function renderBbmMessageBoxHtml(innerHtml) {
  const content = String(innerHtml || '');
  return `
    <div style="padding:12px 14px; background:#0f0f0f; border:1px solid #2a2a2a; border-radius:12px;">
      ${content}
    </div>
  `;
}

export function renderBbmButtonHtml({ hrefEscaped, labelEscaped }) {
  const href = String(hrefEscaped || '').trim();
  const label = String(labelEscaped || '').trim();
  if (!href || !label) return '';

  // Button built from a table for better email client compatibility.
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
      <tr>
        <td bgcolor="#f7c873" style="border-radius:10px;">
          <a href="${href}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block; padding:10px 14px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:14px; font-weight:700; color:#232323; text-decoration:none; border-radius:10px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}
