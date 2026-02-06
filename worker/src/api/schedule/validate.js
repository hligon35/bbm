function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

function normalizeExpiresAt(expiresAt) {
  if (typeof expiresAt === 'number') return expiresAt;
  if (typeof expiresAt === 'string') {
    const asNumber = Number(expiresAt);
    if (Number.isFinite(asNumber)) return asNumber;
    const asDate = Date.parse(expiresAt);
    if (Number.isFinite(asDate)) return asDate;
  }
  return null;
}

/**
 * Reads a token entry from Cloudflare KV.
 *
 * KV binding to add in wrangler.toml (scaffold only):
 * - SCHEDULE_TOKENS (KV namespace)
 *
 * Key strategy (choose one later):
 * - key = token
 * - OR key = `token:${token}`
 */
async function readTokenFromKv(env, token) {
  const kv = env.SCHEDULE_TOKENS;
  if (!kv) {
    // Scaffold: binding isn't set up yet.
    return { ok: false, reason: 'KV_NOT_CONFIGURED' };
  }

  let direct;
  try {
    direct = await kv.get(token, { type: 'json' });
  } catch (e) {
    console.error('SCHEDULE_TOKENS direct key JSON read failed', e);
    return { ok: false, reason: 'KV_READ_ERROR' };
  }
  if (direct) return { ok: true, key: token, value: direct };

  const prefixedKey = `token:${token}`;
  let prefixed;
  try {
    prefixed = await kv.get(prefixedKey, { type: 'json' });
  } catch (e) {
    console.error('SCHEDULE_TOKENS prefixed key JSON read failed', e);
    return { ok: false, reason: 'KV_READ_ERROR' };
  }
  if (prefixed) return { ok: true, key: prefixedKey, value: prefixed };

  return { ok: false, reason: 'NOT_FOUND' };
}

export async function validateScheduleToken(env, token) {
  const trimmed = String(token || '').trim();
  if (!trimmed) {
    return { ok: false, status: 401, error: 'Missing token' };
  }

  // Local/dev convenience: allow viewing the scheduling UI without KV.
  // OFF by default. Enable only in local `wrangler dev` by setting:
  //   SCHEDULE_DEV_MODE = "true"
  // Then use tokens like: demo-token-123
  if (String(env.SCHEDULE_DEV_MODE || '').toLowerCase() === 'true') {
    if (trimmed.startsWith('demo-')) {
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      return {
        ok: true,
        status: 200,
        data: {
          token: trimmed,
          email: 'demo@example.com',
          expiresAt,
        },
        kv: {
          key: null,
          entry: null,
        },
      };
    }
  }

  const read = await readTokenFromKv(env, trimmed);
  if (!read.ok) {
    if (read.reason === 'KV_NOT_CONFIGURED') {
      return {
        ok: false,
        status: 501,
        error: 'Schedule token storage not configured',
      };
    }
    if (read.reason === 'KV_READ_ERROR') {
      return {
        ok: false,
        status: 500,
        error: 'Schedule token storage read error',
      };
    }
    return { ok: false, status: 401, error: 'Invalid or expired token' };
  }

  const entry = read.value || {};

  const used = Boolean(entry.used);
  const expiresAtMs = normalizeExpiresAt(entry.expiresAt);
  const now = Date.now();

  if (used) {
    return { ok: false, status: 401, error: 'Token already used' };
  }

  if (!expiresAtMs || expiresAtMs <= now) {
    return { ok: false, status: 401, error: 'Token expired' };
  }

  // Minimal metadata returned to frontend.
  return {
    ok: true,
    status: 200,
    data: {
      token: trimmed,
      email: String(entry.email || ''),
      expiresAt: expiresAtMs,
    },
    kv: {
      key: read.key,
      entry,
    },
  };
}

export async function handleValidate(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  const result = await validateScheduleToken(env, body?.token);

  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.error }, { status: result.status, headers: corsHeaders });
  }

  return jsonResponse(result.data, { status: 200, headers: corsHeaders });
}
