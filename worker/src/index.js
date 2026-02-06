import { handleScheduleRequest } from './api/schedule';
import { sendEmail } from './email';

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

function parseAllowedOrigins(env) {
  const raw = String(env.ALLOWED_ORIGINS || '').trim();
  if (!raw) return [];
  if (raw === '*') return ['*'];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeadersFor(origin, allowedOrigins) {
  if (!origin) return {};

  if (allowedOrigins.includes('*')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }

  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }

  return {};
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildEmail({ name, email, subject, message, ip, ua, origin }) {
  const cleanSubject = subject ? subject : 'New contact form submission';
  const text =
    `New contact form submission\n\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Subject: ${cleanSubject}\n\n` +
    `Message:\n${message}\n\n` +
    `---\n` +
    `Origin: ${origin || ''}\n` +
    `IP: ${ip || ''}\n` +
    `User-Agent: ${ua || ''}\n`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5;">
      <h2 style="margin: 0 0 12px 0;">New contact form submission</h2>
      <p style="margin: 0 0 8px 0;"><b>Name:</b> ${escapeHtml(name)}</p>
      <p style="margin: 0 0 8px 0;"><b>Email:</b> ${escapeHtml(email)}</p>
      <p style="margin: 0 0 16px 0;"><b>Subject:</b> ${escapeHtml(cleanSubject)}</p>
      <div style="padding: 12px 14px; background: #f6f6f6; border-radius: 8px;">
        <pre style="margin: 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${escapeHtml(message)}</pre>
      </div>
      <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e5e5;" />
      <p style="margin: 0; color: #555;"><b>Origin:</b> ${escapeHtml(origin || '')}</p>
      <p style="margin: 0; color: #555;"><b>IP:</b> ${escapeHtml(ip || '')}</p>
      <p style="margin: 0; color: #555;"><b>User-Agent:</b> ${escapeHtml(ua || '')}</p>
    </div>
  `;

  return { subject: `[BBM Contact] ${cleanSubject}`, text, html };
}

async function sendViaMailChannels(env, { replyToEmail, subject, text, html }) {
  await sendEmail(env, {
    to: env.EMAIL_TO,
    fromEmail: env.EMAIL_FROM,
    fromName: env.FROM_NAME || 'Website',
    replyTo: replyToEmail,
    subject,
    text,
    html,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Schedule API is fully isolated under worker/src/api/schedule.
    // This early dispatch keeps the existing contact endpoint behavior intact.
    if (url.pathname.startsWith('/api/schedule/')) {
      return handleScheduleRequest(request, env);
    }

    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = parseAllowedOrigins(env);
    const cors = corsHeadersFor(origin, allowedOrigins);

    // Expect /api/contact (but allow any path as long as POST)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'Method not allowed' }, { status: 405, headers: cors });
    }

    // Basic origin enforcement when ALLOWED_ORIGINS is not '*'
    if (!allowedOrigins.includes('*') && origin && !allowedOrigins.includes(origin)) {
      return jsonResponse({ ok: false, error: 'Origin not allowed' }, { status: 403, headers: cors });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: cors });
    }

    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();

    // Honeypot
    const company = String(body?.company || '').trim();
    if (company) {
      return jsonResponse({ ok: true }, { status: 200, headers: cors });
    }

    // Basic validation
    if (!name || name.length > 80) {
      return jsonResponse({ ok: false, error: 'Please provide your name.' }, { status: 400, headers: cors });
    }
    if (!email || email.length > 120 || !email.includes('@')) {
      return jsonResponse({ ok: false, error: 'Please provide a valid email.' }, { status: 400, headers: cors });
    }
    if (!message || message.length > 4000) {
      return jsonResponse({ ok: false, error: 'Please enter a message (max 4000 characters).' }, { status: 400, headers: cors });
    }

    if (!env.EMAIL_TO || !env.EMAIL_FROM) {
      return jsonResponse({ ok: false, error: 'Email service not configured.' }, { status: 500, headers: cors });
    }

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ua = request.headers.get('User-Agent') || '';

    const emailContent = buildEmail({ name, email, subject, message, ip, ua, origin });

    try {
      await sendViaMailChannels(env, {
        replyToEmail: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
      return jsonResponse({ ok: true }, { status: 200, headers: cors });
    } catch (e) {
      return jsonResponse(
        { ok: false, error: e instanceof Error ? e.message : 'Failed to send email.' },
        { status: 502, headers: cors }
      );
    }
  },
};
