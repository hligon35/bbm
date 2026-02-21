function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
    'Cache-Control': 'no-store',
  };
}

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...securityHeaders(),
      ...headers,
    },
  });
}

const CHANNEL_ID = 'UCzaxkVQzZ-okUD461Bif6PQ';
const UPLOADS_PLAYLIST_ID = CHANNEL_ID.replace(/^UC/, 'UU');
const MAX_LIMIT = 50; // keep single-request and cheap

function clampLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 12;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(n)));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`YouTube API request failed (${res.status}). ${text}`);
  }
  return res.json();
}

export async function handleYouTubeUploads(request, env, corsHeaders) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...securityHeaders(), ...(corsHeaders || {}) } });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  const apiKey = String(env.YOUTUBE_API_KEY || '').trim();
  if (!apiKey) {
    return jsonResponse(
      { ok: false, error: 'YouTube service not configured' },
      { status: 500, headers: corsHeaders }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const limit = clampLimit(body?.limit);

  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.searchParams.set('part', 'snippet,contentDetails');
  url.searchParams.set('maxResults', String(limit));
  url.searchParams.set('playlistId', UPLOADS_PLAYLIST_ID);
  url.searchParams.set('key', apiKey);

  try {
    const data = await fetchJson(url.toString());
    const items = Array.isArray(data?.items) ? data.items : [];
    const videos = [];

    for (const item of items) {
      const videoId = item?.contentDetails?.videoId;
      const title = item?.snippet?.title;
      if (!videoId || !title) continue;
      videos.push({
        videoId,
        title,
        publishedAt: item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    return jsonResponse({ ok: true, videos }, { status: 200, headers: corsHeaders });
  } catch (e) {
    return jsonResponse(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch YouTube uploads' },
      { status: 502, headers: corsHeaders }
    );
  }
}
