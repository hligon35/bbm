import { handleValidate } from './validate';
import { handleBook } from './book';
import { handleSlots } from './slots';
import { handleAdmin } from './admin';
import { handleAdminAuth } from './auth';

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

function isLocalhostOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return (
      (u.protocol === 'http:' || u.protocol === 'https:') &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1')
    );
  } catch {
    return false;
  }
}

function corsHeadersFor(origin, allowedOrigins, { devMode } = {}) {
  if (!origin) return {};

  const allowLocalDevOrigin = Boolean(devMode) && isLocalhostOrigin(origin);

  const allow = allowedOrigins.includes('*')
    ? origin
    : allowedOrigins.includes(origin)
      ? origin
      : allowLocalDevOrigin || allowedOrigins.length === 0
        ? origin
        : null;

  if (!allow) return {};

  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Schedule API router.
 *
 * Endpoints:
 * - POST /api/schedule/validate
 * - POST /api/schedule/slots
 * - POST /api/schedule/book
 *
 * All schedule-specific logic lives under worker/src/api/schedule.
 */
export async function handleScheduleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  const devMode = String(env.SCHEDULE_DEV_MODE || '').toLowerCase() === 'true';
  const allowedOrigins = parseAllowedOrigins(env);
  const cors = corsHeadersFor(origin, allowedOrigins, { devMode });

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, { status: 405, headers: cors });
  }

  // Basic origin enforcement when ALLOWED_ORIGINS is not '*'
  if (!allowedOrigins.includes('*') && origin && !allowedOrigins.includes(origin) && !(devMode && isLocalhostOrigin(origin))) {
    return jsonResponse({ ok: false, error: 'Origin not allowed' }, { status: 403, headers: cors });
  }

  if (url.pathname.startsWith('/api/schedule/admin/')) {
    if (url.pathname.startsWith('/api/schedule/admin/auth/')) {
      return handleAdminAuth(request, env, cors);
    }
    return handleAdmin(request, env, cors);
  }

  if (url.pathname === '/api/schedule/validate') {
    return handleValidate(request, env, cors);
  }

  if (url.pathname === '/api/schedule/book') {
    return handleBook(request, env, cors);
  }

  if (url.pathname === '/api/schedule/slots') {
    return handleSlots(request, env, cors);
  }

  return jsonResponse({ ok: false, error: 'Not found' }, { status: 404, headers: cors });
}
