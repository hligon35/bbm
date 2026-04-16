import React, { useEffect } from 'react';

import Layout from './Layout';
import YouTubeVideos from './YouTubeVideos';
import { asset } from './utils/asset';

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@BlackBridgeMindset';
const YOUTUBE_SUBSCRIBE_URL = 'https://www.youtube.com/@BlackBridgeMindset?sub_confirmation=1';

export default function Episodes() {
  useEffect(() => { document.title = 'Episodes | Black Bridge Mindset'; }, []);
  return (
    <Layout>
      <main>
        <section className="bbm-section bbm-channel-card bbm-channel-card--episodes">
          <div className="bbm-episodes-top">
            <div className="bbm-episodes-top-meta">
              <img
                className="bbm-channel-avatar"
                src={asset('images/bbmlogo.jpg')}
                alt="Black Bridge Mindset channel"
                decoding="async"
              />

              <div className="bbm-channel-title">Black Bridge Mindset</div>
              <div className="bbm-channel-handle">
                <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  @BlackBridgeMindset
                </a>
              </div>

              <div className="bbm-channel-links">
                <a
                  className="bbm-channel-subscribe-img"
                  href={YOUTUBE_SUBSCRIBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={asset('images/subscribe.png')} alt="Subscribe" decoding="async" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bbm-section bbm-episodes">
          <h2>Episodes</h2>
          <YouTubeVideos />
        </section>
      </main>
    </Layout>
  );
}
