import React, { useEffect, useMemo, useRef, useState } from 'react';

const CHANNEL_ID = 'UCzaxkVQzZ-okUD461Bif6PQ';
const CHANNEL_URL = 'https://www.youtube.com/channel/UCzaxkVQzZ-okUD461Bif6PQ';
const CHANNEL_HANDLE_URL = 'https://www.youtube.com/@BlackBridgeMindset';

// Optional client-side key (bundled into the build). Prefer using the Worker endpoint
// (/api/schedule/youtube/uploads) so the key can live server-side.
//
// If you do use a client key, restrict it heavily in Google Cloud Console.
// Set in `.env` / hosting env vars:
//   VITE_YOUTUBE_API_KEY=... (YouTube Data API v3)
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

const UPLOADS_PLAYLIST_ID = CHANNEL_ID.replace(/^UC/, 'UU');
const MAX_VIDEOS = 500; // safety cap (prevents infinite pagination)

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}). ${text}`);
  }
  return res.json();
}

async function getUploadsPlaylistId({ apiKey, channelId }) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
  const data = await fetchJson(url);
  const uploads = data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error('Could not resolve uploads playlist for this channel.');
  return uploads;
}

async function getUploadVideos({ apiKey, uploadsPlaylistId, limit }) {
  const max = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : MAX_VIDEOS;
  const all = [];
  let pageToken = '';

  while (all.length < max) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('playlistId', uploadsPlaylistId);
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const data = await fetchJson(url.toString());
    const items = Array.isArray(data?.items) ? data.items : [];

    for (const item of items) {
      const videoId = item?.contentDetails?.videoId;
      const title = item?.snippet?.title;
      if (!videoId || !title) continue;
      all.push({
        videoId,
        title,
        publishedAt: item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });

      if (all.length >= max) break;
    }

    pageToken = data?.nextPageToken || '';
    if (!pageToken) break;
  }

  return all;
}

function getScheduleApiBase() {
  const explicit = String(import.meta.env.VITE_SCHEDULE_API_BASE || '').trim();
  if (!explicit) return '';
  return explicit.replace(/\/$/, '');
}

async function fetchUploadsViaWorker({ limit }) {
  const base = getScheduleApiBase();
  const endpoint = `${base}/api/schedule/youtube/uploads`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    const msg = data?.error || `Request failed (${res.status}).`;
    throw new Error(msg);
  }

  const list = Array.isArray(data?.videos) ? data.videos : [];
  return list
    .filter((v) => v && typeof v === 'object' && v.videoId && v.title)
    .map((v) => ({
      videoId: String(v.videoId),
      title: String(v.title),
      publishedAt: String(v.publishedAt || ''),
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(String(v.videoId))}`,
    }));
}

export default function YouTubeVideos({
  variant = 'grid',
  limit,
  showChannelLink = true,
  autoScroll = false,
  autoScrollThreshold = 0,
  controls = 'none', // none | chevrons
} = {}) {
  const [videos, setVideos] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState('');

  const embedsRef = useRef(null);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const playlistEmbedUrl = useMemo(
    () => `https://www.youtube.com/embed?listType=playlist&list=${UPLOADS_PLAYLIST_ID}`,
    []
  );

  const list = useMemo(() => {
    if (!Number.isFinite(limit)) return videos;
    return videos.slice(0, Math.max(1, Math.floor(limit)));
  }, [videos, limit]);

  useEffect(() => {
    if (variant !== 'row') return;
    if (controls !== 'chevrons') return;
    if (status !== 'ready') return;

    const el = embedsRef.current;
    if (!el) return;

    const update = () => {
      const node = embedsRef.current;
      if (!node) return;
      setCanScrollLeft(node.scrollLeft > 0);
      setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [controls, status, variant, list.length]);

  useEffect(() => {
    if (variant !== 'row') return;
    if (!autoScroll) return;
    if (autoScrollPaused) return;
    if (status !== 'ready') return;

    const threshold = Number.isFinite(autoScrollThreshold) ? Math.max(0, Math.floor(autoScrollThreshold)) : 0;
    if (list.length <= threshold) return;

    const el = embedsRef.current;
    if (!el) return;

    // Respect reduced motion.
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) return;
    }

    let rafId = 0;
    let lastTs = 0;
    const speedPxPerSecond = 18;

    const step = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      // If the user resized or there isn't anything to scroll, keep the loop alive.
      if (el.scrollWidth <= el.clientWidth + 1) {
        rafId = requestAnimationFrame(step);
        return;
      }

      el.scrollLeft += speedPxPerSecond * dt;

      // Loop back to start when reaching the end.
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
        el.scrollLeft = 0;
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [autoScroll, autoScrollPaused, autoScrollThreshold, list.length, status, variant]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStatus('loading');
      setError('');

      // Prefer same-origin Worker endpoint (keeps API key off the client bundle).
      try {
        const workerVideos = await fetchUploadsViaWorker({ limit });
        if (cancelled) return;
        if (workerVideos.length > 0) {
          setVideos(workerVideos);
          setStatus('ready');
          return;
        }
      } catch (e) {
        // Ignore and fall back to client-side API key if configured.
      }

      if (!API_KEY) {
        if (cancelled) return;
        setStatus('error');
        setError('YouTube list unavailable (missing API configuration).');
        return;
      }

      try {
        const uploadsPlaylistId = await getUploadsPlaylistId({ apiKey: API_KEY, channelId: CHANNEL_ID });
        const allVideos = await getUploadVideos({ apiKey: API_KEY, uploadsPlaylistId, limit });
        if (cancelled) return;
        setVideos(allVideos);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Failed to load YouTube videos.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  // If we can't load a structured list (Worker + client API), fall back to the playlist embed.
  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <iframe
          width="100%"
          height={variant === 'row' ? '240' : '480'}
          src={playlistEmbedUrl}
          title="Black Bridge Mindset Episodes"
          frameBorder="0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
        {error ? <div style={{ marginTop: '0.75rem', color: '#e0e0e0', fontSize: 13 }}>{error}</div> : null}
        <div style={{ marginTop: '1rem' }}>
          <a
            href={CHANNEL_HANDLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#f7c873', fontWeight: 600 }}
          >
            See all videos on YouTube
          </a>
        </div>
      </div>
    );
  }

  if (status !== 'ready') return <div>Loading videos...</div>;

  const embedClassName = variant === 'row' ? 'bbm-videos-embeds bbm-videos-embeds--row' : 'bbm-videos-embeds';

  const showChevronControls = variant === 'row' && controls === 'chevrons';

  const handleChevronScroll = (direction) => {
    const el = embedsRef.current;
    if (!el) return;
    const amount = el.clientWidth || 0;
    if (!amount) return;
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <div className="bbm-videos-list">
      {showChannelLink ? (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#f7c873', fontWeight: 600 }}>
            View channel on YouTube
          </a>
        </div>
      ) : null}

      {showChevronControls ? (
        <div className="bbm-videos-row-shell">
          <button
            type="button"
            className="bbm-carousel-btn"
            onClick={() => handleChevronScroll(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll videos left"
          >
            <span className="bbm-carousel-icon" aria-hidden="true">
              ‹
            </span>
          </button>

          <div className="bbm-videos-viewport">
            <div
              className={embedClassName}
              ref={embedsRef}
              onMouseEnter={autoScroll ? () => setAutoScrollPaused(true) : undefined}
              onMouseLeave={autoScroll ? () => setAutoScrollPaused(false) : undefined}
              onFocusCapture={autoScroll ? () => setAutoScrollPaused(true) : undefined}
              onBlurCapture={autoScroll ? () => setAutoScrollPaused(false) : undefined}
            >
              {list.map((video) => (
                <div className="bbm-video-item" key={video.videoId}>
                  <iframe
                    width="360"
                    height="215"
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    title={video.title}
                    frameBorder="0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                  <div className="bbm-video-title">{video.title}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="bbm-carousel-btn"
            onClick={() => handleChevronScroll(1)}
            disabled={!canScrollRight}
            aria-label="Scroll videos right"
          >
            <span className="bbm-carousel-icon" aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      ) : (
        <div
          className={embedClassName}
          ref={variant === 'row' ? embedsRef : null}
          onMouseEnter={variant === 'row' && autoScroll ? () => setAutoScrollPaused(true) : undefined}
          onMouseLeave={variant === 'row' && autoScroll ? () => setAutoScrollPaused(false) : undefined}
          onFocusCapture={variant === 'row' && autoScroll ? () => setAutoScrollPaused(true) : undefined}
          onBlurCapture={variant === 'row' && autoScroll ? () => setAutoScrollPaused(false) : undefined}
        >
          {list.map((video) => (
            <div className="bbm-video-item" key={video.videoId}>
              <iframe
                width="360"
                height="215"
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                frameBorder="0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
              <div className="bbm-video-title">{video.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
