import React, { useEffect, useState } from 'react';

// Channel ID for Black Bridge Mindset
const CHANNEL_ID = 'UCzaxkVQzZ-okUD461Bif6PQ';
// YouTube uploads playlist ID always starts with 'UU' + channel ID (without the first character)
const UPLOADS_PLAYLIST_ID = 'UUzaxkVQzZ-okUD461Bif6PQ';
// TODO: Replace with your YouTube Data API key
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

export default function YouTubeVideos() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If no API key, fallback to embed playlist
    if (!API_KEY) return;
    const fetchVideos = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=20`
        );
        const data = await res.json();
        if (data.items) setVideos(data.items);
        else setError('No videos found.');
      } catch (e) {
        setError('Failed to fetch videos.');
      }
    };
    fetchVideos();
  }, []);

  // Fallback: show playlist embed if no API key
  if (!API_KEY) {
    return (
      <div style={{textAlign: 'center', margin: '2rem 0'}}>
        <iframe
          width="100%"
          height="400"
          src={`https://www.youtube.com/embed?listType=playlist&list=${UPLOADS_PLAYLIST_ID}`}
          title="Black Bridge Mindset Episodes"
          frameBorder="0"
          allowFullScreen
        ></iframe>
        <div style={{marginTop: '1rem'}}>
          <a href="https://www.youtube.com/@BlackBridgeMindset" target="_blank" rel="noopener noreferrer" style={{color: '#f7c873', fontWeight: 600}}>See all videos on YouTube</a>
        </div>
      </div>
    );
  }

  if (error) return <div style={{color: 'red'}}>{error}</div>;
  if (!videos.length) return <div>Loading videos...</div>;

  return (
    <div className="bbm-videos-list">
      <div className="bbm-videos-embeds">
        {videos.map((video) => (
          video.id.videoId && (
            <div className="bbm-video-item" key={video.id.videoId}>
              <iframe
                width="360"
                height="215"
                src={`https://www.youtube.com/embed/${video.id.videoId}`}
                title={video.snippet.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
              <div className="bbm-video-title">{video.snippet.title}</div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
