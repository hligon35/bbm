import React, { useEffect, useMemo, useState } from 'react';

const CHANNEL_ID = 'UCzaxkVQzZ-okUD461Bif6PQ';
const CHANNEL_URL = 'https://www.youtube.com/channel/UCzaxkVQzZ-okUD461Bif6PQ';
const CHANNEL_HANDLE_URL = 'https://www.youtube.com/@BlackBridgeMindset';

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

async function getAllUploadVideos({ apiKey, uploadsPlaylistId }) {
  const all = [];
  let pageToken = '';

  while (all.length < MAX_VIDEOS) {
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
    }

    pageToken = data?.nextPageToken || '';
    if (!pageToken) break;
  }

  return all;
}

export default function YouTubeVideos() {
  const [videos, setVideos] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState('');

  const showApiList = Boolean(API_KEY);
  const playlistEmbedUrl = useMemo(
    () => `https://www.youtube.com/embed?listType=playlist&list=${UPLOADS_PLAYLIST_ID}`,
    []
  );

  useEffect(() => {
    if (!API_KEY) return;

    let cancelled = false;
    const run = async () => {
      setStatus('loading');
      setError('');
      try {
        const uploadsPlaylistId = await getUploadsPlaylistId({ apiKey: API_KEY, channelId: CHANNEL_ID });
        const allVideos = await getAllUploadVideos({ apiKey: API_KEY, uploadsPlaylistId });
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
  }, []);

  // No API key: YouTube API (and RSS feed) can’t be fetched reliably due to browser CORS.
  // The playlist embed still shows the full uploads playlist.
  if (!showApiList) {
    return (
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <iframe
          width="100%"
          height="480"
          src={playlistEmbedUrl}
          title="Black Bridge Mindset Episodes"
          frameBorder="0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
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

  if (status === 'error') return <div style={{ color: 'red' }}>{error || 'Failed to fetch videos.'}</div>;
  if (status !== 'ready') return <div>Loading videos...</div>;

  return (
    <div className="bbm-videos-list">
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#f7c873', fontWeight: 600 }}>
          View channel on YouTube
        </a>
      </div>
      <div className="bbm-videos-embeds">
        {videos.map((video) => (
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
  );
}
