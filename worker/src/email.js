function assertString(name, value) {
  const v = String(value || '').trim();
  if (!v) throw new Error(`${name} not configured`);
  return v;
}

function toArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function normalizeEmail(value) {
  return String(value || '').trim();
}

function makePayload({ to, fromEmail, fromName, subject, text, html, replyTo }) {
  const recipients = toArray(to)
    .map((x) => normalizeEmail(x))
    .filter(Boolean)
    .map((email) => ({ email }));

  if (recipients.length === 0) throw new Error('No recipients');

  const personalizations = recipients.map((r) => ({ to: [r] }));

  const payload = {
    personalizations,
    from: {
      email: assertString('EMAIL_FROM', fromEmail),
      name: String(fromName || '').trim() || undefined,
    },
    subject: assertString('subject', subject),
    content: [{ type: 'text/plain', value: String(text || '') }],
  };

  if (html) {
    payload.content.push({ type: 'text/html', value: String(html) });
  }

  if (replyTo) {
    payload.reply_to = { email: normalizeEmail(replyTo) };
  }

  return payload;
}

async function sendViaMailChannels(payload) {
  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`MailChannels send failed (${res.status}). ${body}`);
  }
}

async function sendViaSendGrid(env, payload) {
  const apiKey = String(env.SENDGRID_API_KEY || '').trim();
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  // SendGrid returns 202 Accepted on success.
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SendGrid send failed (${res.status}). ${body}`);
  }
}

function hasSendGridKey(env) {
  return Boolean(String(env.SENDGRID_API_KEY || '').trim());
}

/**
 * Sends email using SendGrid when configured (recommended), otherwise falls back to MailChannels.
 */
export async function sendEmail(env, { to, fromEmail, fromName, subject, text, html, replyTo }) {
  const payload = makePayload({ to, fromEmail, fromName, subject, text, html, replyTo });

  if (hasSendGridKey(env)) {
    return sendViaSendGrid(env, payload);
  }

  return sendViaMailChannels(payload);
}
