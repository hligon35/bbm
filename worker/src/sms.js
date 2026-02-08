function assertString(name, value) {
  const v = String(value || '').trim();
  if (!v) throw new Error(`${name} not configured`);
  return v;
}

function normalizeE164(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  // Keep leading +, strip common formatting characters.
  const cleaned = raw
    .replace(/[\s().-]/g, '')
    .replace(/^00/, '+');

  if (!cleaned.startsWith('+')) return '';
  if (!/^\+[0-9]{8,16}$/.test(cleaned)) return '';
  return cleaned;
}

/**
 * Send an SMS via Twilio.
 *
 * Required secrets:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * And either:
 * - TWILIO_MESSAGING_SERVICE_SID  (recommended)
 * - TWILIO_FROM_NUMBER           (E.164)
 */
export async function sendSms(env, { to, body }) {
  const accountSid = assertString('TWILIO_ACCOUNT_SID', env.TWILIO_ACCOUNT_SID);
  const authToken = assertString('TWILIO_AUTH_TOKEN', env.TWILIO_AUTH_TOKEN);

  const toPhone = normalizeE164(to);
  if (!toPhone) throw new Error('Invalid phone');

  const messageBody = String(body || '').trim();
  if (!messageBody) throw new Error('Message body is required');

  const messagingServiceSid = String(env.TWILIO_MESSAGING_SERVICE_SID || '').trim();
  const fromNumber = String(env.TWILIO_FROM_NUMBER || '').trim();

  const params = new URLSearchParams();
  params.set('To', toPhone);
  params.set('Body', messageBody);

  if (messagingServiceSid) {
    params.set('MessagingServiceSid', messagingServiceSid);
  } else {
    const fromPhone = normalizeE164(fromNumber);
    if (!fromPhone) {
      throw new Error('TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER not configured');
    }
    params.set('From', fromPhone);
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;

  const basic = btoa(`${accountSid}:${authToken}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Twilio SMS failed (${res.status}). ${text}`);
  }

  return { ok: true };
}

export function normalizePhoneForStorage(value) {
  return normalizeE164(value);
}
