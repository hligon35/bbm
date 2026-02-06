import { verifyAdminSession } from './auth';
import { sendEmail } from '../../email';

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function unauthorized(corsHeaders) {
  return jsonResponse({ ok: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
}

function isDevMode(env) {
  return String(env.SCHEDULE_DEV_MODE || '').toLowerCase() === 'true';
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function dedupeEmails(list) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const email = normalizeEmail(raw);
    if (!email) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 120) return false;
  if (!email.includes('@')) return false;
  return true;
}

async function getNewsletterSubscribers(env) {
  if (!env.SCHEDULE_CONFIG) return { ok: false, status: 501, error: 'Newsletter storage not configured' };

  try {
    const value = await env.SCHEDULE_CONFIG.get('newsletter:subscribers', { type: 'json' });
    const subscribers = dedupeEmails(Array.isArray(value) ? value : []);
    return { ok: true, status: 200, subscribers };
  } catch (e) {
    console.error('newsletter subscribers read failed', e);
    return { ok: false, status: 500, error: 'Failed to read subscribers' };
  }
}

async function setNewsletterSubscribers(env, subscribers) {
  if (!env.SCHEDULE_CONFIG) return { ok: false, status: 501, error: 'Newsletter storage not configured' };

  const list = dedupeEmails(subscribers).filter(validateEmail);

  if (list.length === 0) return { ok: false, status: 400, error: 'No valid subscribers provided' };
  if (list.length > 5000) return { ok: false, status: 400, error: 'Too many subscribers (max 5000)' };

  try {
    await env.SCHEDULE_CONFIG.put('newsletter:subscribers', JSON.stringify(list));
    return { ok: true, status: 200, subscribers: list };
  } catch (e) {
    console.error('newsletter subscribers write failed', e);
    return { ok: false, status: 500, error: 'Failed to save subscribers' };
  }
}

function buildNewsletterEmail({ subject, message }) {
  const cleanSubject = String(subject || '').trim();
  const cleanMessage = String(message || '').trim();

  const text = cleanMessage;
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.55;">
      <h2 style="margin: 0 0 12px 0;">${escapeHtml(cleanSubject)}</h2>
      <pre style="margin: 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${escapeHtml(
        cleanMessage
      )}</pre>
    </div>
  `;

  return { subject: cleanSubject, text, html };
}


function getBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

function normalizeAvailability(input) {
  const raw = input && typeof input === 'object' ? input : {};

  const timezone = String(raw.timezone || 'America/Chicago').trim() || 'America/Chicago';
  const slotDurationMinutes = Number(raw.slotDurationMinutes || 30);
  const daysAhead = Number(raw.daysAhead || 14);
  const startDaysFromNow = Number(raw.startDaysFromNow || 1);

  const days = Array.isArray(raw.days) ? raw.days : [];
  const normalizedDays = Array.from({ length: 7 }).map((_, idx) => {
    const d = days[idx] && typeof days[idx] === 'object' ? days[idx] : {};
    return {
      enabled: Boolean(d.enabled),
      start: String(d.start || '09:00'),
      end: String(d.end || '17:00'),
    };
  });

  return {
    timezone,
    slotDurationMinutes: Number.isFinite(slotDurationMinutes) ? slotDurationMinutes : 30,
    daysAhead: Number.isFinite(daysAhead) ? daysAhead : 14,
    startDaysFromNow: Number.isFinite(startDaysFromNow) ? startDaysFromNow : 1,
    days: normalizedDays,
  };
}

async function readAvailability(env) {
  const kv = env.SCHEDULE_CONFIG;
  if (!kv) return { ok: false, error: 'Schedule config storage not configured', status: 501 };

  try {
    const value = await kv.get('availability', { type: 'json' });
    if (!value) return { ok: true, availability: null };
    return { ok: true, availability: normalizeAvailability(value) };
  } catch (e) {
    console.error('SCHEDULE_CONFIG availability read failed', e);
    return { ok: false, error: 'Failed to read availability', status: 500 };
  }
}

async function writeAvailability(env, availability) {
  const kv = env.SCHEDULE_CONFIG;
  if (!kv) return { ok: false, error: 'Schedule config storage not configured', status: 501 };

  const normalized = normalizeAvailability(availability);

  try {
    await kv.put('availability', JSON.stringify(normalized));
    return { ok: true, availability: normalized };
  } catch (e) {
    console.error('SCHEDULE_CONFIG availability write failed', e);
    return { ok: false, error: 'Failed to save availability', status: 500 };
  }
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in Workers.
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createInviteToken(env, { email, days }) {
  if (!env.SCHEDULE_TOKENS) {
    return { ok: false, status: 501, error: 'Schedule token storage not configured' };
  }

  const cleanEmail = String(email || '').trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, status: 400, error: 'Invalid email' };
  }

  const daysNumber = Number(days || 7);
  if (!Number.isFinite(daysNumber) || daysNumber <= 0 || daysNumber > 365) {
    return { ok: false, status: 400, error: 'Invalid days' };
  }

  const token = generateToken();
  const expiresAt = Date.now() + daysNumber * 24 * 60 * 60 * 1000;

  const payload = {
    token,
    email: cleanEmail,
    expiresAt,
    used: false,
  };

  await env.SCHEDULE_TOKENS.put(token, JSON.stringify(payload));
  return { ok: true, token, expiresAt };
}

function getRequestHost(request) {
  const url = new URL(request.url);
  return url.host;
}

function parseAllowedHosts(env) {
  const raw = String(env.SCHEDULE_ADMIN_ALLOWED_HOSTS || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdminSession(request, env, corsHeaders) {
  const session = await verifyAdminSession(request, env);
  if (session.ok) return null;

  // Local dev fallback: allow bearer token.
  if (isDevMode(env)) {
    const expected = String(env.SCHEDULE_ADMIN_TOKEN || '').trim();
    if (expected) {
      const got = getBearerToken(request);
      if (got && got === expected) return null;
    }
  }

  return unauthorized(corsHeaders);
}

function enforceAdminHost(request, env, corsHeaders) {
  // If you protect /api/schedule/admin/* with Cloudflare Access on your custom domain,
  // the public *.workers.dev hostname can become a bypass unless we block it here.
  const host = getRequestHost(request).toLowerCase();

  if (isDevMode(env)) {
    // Allow localhost and workers.dev during local development.
    return null;
  }

  if (host.endsWith('.workers.dev')) {
    return jsonResponse({ ok: false, error: 'Forbidden' }, { status: 403, headers: corsHeaders });
  }

  const allowedHosts = parseAllowedHosts(env);
  if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
    return jsonResponse({ ok: false, error: 'Forbidden' }, { status: 403, headers: corsHeaders });
  }

  return null;
}

function inviteUrlForHost(host, token) {
  return `https://${host}/schedule/${token}`;
}

export async function handleAdmin(request, env, corsHeaders) {
  const hostError = enforceAdminHost(request, env, corsHeaders);
  if (hostError) return hostError;

  const authError = await requireAdminSession(request, env, corsHeaders);
  if (authError) return authError;

  const url = new URL(request.url);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  if (url.pathname === '/api/schedule/admin/availability/get') {
    const res = await readAvailability(env);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, { status: res.status, headers: corsHeaders });
    return jsonResponse({ ok: true, availability: res.availability }, { status: 200, headers: corsHeaders });
  }

  if (url.pathname === '/api/schedule/admin/availability/set') {
    const res = await writeAvailability(env, body?.availability);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, { status: res.status, headers: corsHeaders });
    return jsonResponse({ ok: true, availability: res.availability }, { status: 200, headers: corsHeaders });
  }

  if (url.pathname === '/api/schedule/admin/invite') {
    const created = await createInviteToken(env, { email: body?.email, days: body?.days });
    if (!created.ok) {
      return jsonResponse({ ok: false, error: created.error }, { status: created.status, headers: corsHeaders });
    }

    const host = getRequestHost(request);
    return jsonResponse(
      {
        ok: true,
        token: created.token,
        expiresAt: created.expiresAt,
        inviteUrl: inviteUrlForHost(host, created.token),
      },
      { status: 200, headers: corsHeaders }
    );
  }

  if (url.pathname === '/api/schedule/admin/newsletter/subscribers/get') {
    const res = await getNewsletterSubscribers(env);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, { status: res.status, headers: corsHeaders });
    return jsonResponse({ ok: true, subscribers: res.subscribers }, { status: 200, headers: corsHeaders });
  }

  if (url.pathname === '/api/schedule/admin/newsletter/subscribers/set') {
    const res = await setNewsletterSubscribers(env, body?.subscribers);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, { status: res.status, headers: corsHeaders });
    return jsonResponse({ ok: true, subscribers: res.subscribers }, { status: 200, headers: corsHeaders });
  }

  if (url.pathname === '/api/schedule/admin/newsletter/send') {
    const rawSubject = String(body?.subject || '').trim();
    const rawMessage = String(body?.message || '').trim();

    if (!rawSubject) return jsonResponse({ ok: false, error: 'Subject is required' }, { status: 400, headers: corsHeaders });
    if (rawSubject.length > 150) {
      return jsonResponse({ ok: false, error: 'Subject too long (max 150)' }, { status: 400, headers: corsHeaders });
    }
    if (!rawMessage) return jsonResponse({ ok: false, error: 'Message is required' }, { status: 400, headers: corsHeaders });
    if (rawMessage.length > 20000) {
      return jsonResponse({ ok: false, error: 'Message too long (max 20000 characters)' }, { status: 400, headers: corsHeaders });
    }

    const fromEmail = String(env.EMAIL_FROM || '').trim();
    const fromName = String(env.FROM_NAME || 'Black Bridge Mindset').trim();
    if (!fromEmail) return jsonResponse({ ok: false, error: 'Email service not configured' }, { status: 500, headers: corsHeaders });

    const testEmail = normalizeEmail(body?.testEmail);
    let recipients = [];

    if (testEmail) {
      if (!validateEmail(testEmail)) {
        return jsonResponse({ ok: false, error: 'Invalid test email' }, { status: 400, headers: corsHeaders });
      }
      recipients = [testEmail];
    } else {
      const provided = dedupeEmails(body?.recipients).filter(validateEmail);
      if (provided.length > 0) {
        recipients = provided;
      } else {
        const stored = await getNewsletterSubscribers(env);
        if (!stored.ok) {
          return jsonResponse({ ok: false, error: stored.error }, { status: stored.status, headers: corsHeaders });
        }
        recipients = stored.subscribers;
      }
    }

    if (recipients.length === 0) {
      return jsonResponse({ ok: false, error: 'No recipients' }, { status: 400, headers: corsHeaders });
    }

    // Keep individual API calls bounded.
    if (recipients.length > 200) {
      return jsonResponse({ ok: false, error: 'Too many recipients in one request (max 200)' }, { status: 400, headers: corsHeaders });
    }

    const { subject, text, html } = buildNewsletterEmail({ subject: rawSubject, message: rawMessage });

    try {
      await sendEmail(env, {
        to: recipients,
        fromEmail,
        fromName,
        subject,
        text,
        html,
      });
      return jsonResponse({ ok: true, recipients: recipients.length }, { status: 200, headers: corsHeaders });
    } catch (e) {
      return jsonResponse(
        { ok: false, error: e instanceof Error ? e.message : 'Failed to send email' },
        { status: 502, headers: corsHeaders }
      );
    }
  }

  return jsonResponse({ ok: false, error: 'Not found' }, { status: 404, headers: corsHeaders });
}
