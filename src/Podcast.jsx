import React from 'react';
import Layout from './Layout';

const asset = (path) => {
  const base = (import.meta.env.BASE_URL || '/');
  const clean = String(path).replace(/^\/+/,'');
  return `${base}${clean}`;
};

export default function Podcast() {
  return (
    <Layout>
      <main className="bbm-section bbm-podcast">
        <h2>About the Podcast</h2>
        <p>Welcome to The Black Bridge Mindset podcast, where culture, entrepreneurship, and business intersect to fuel inspiration. This podcast celebrates the power of diverse voices shaping the future of business.</p>
        <p>Each episode we’ll delve deep into the challenges, triumphs, and transformative ideas that redefine success. Because when culture and ambition come together, the results are game-changing.</p>
      </main>
      <section className="bbm-section bbm-platforms" id="bbm-platforms">
        <h2>Listen on Your Favorite Platform</h2>
        <div className="bbm-platforms-grid">
          {[
            { name: 'Apple Podcasts', logo: asset('images/apple.jpg'), href: 'https://podcasts.apple.com/podcast/id1804483344' },
            { name: 'Spotify', logo: asset('images/spotify.png'), href: 'https://open.spotify.com/show/3MyZWfhu2rPPDSbu7wlTjt' },
            { name: 'Amazon Music', logo: asset('images/amazon.png'), href: 'https://music.amazon.com/podcasts/f070d1b9-2419-4ec5-82a6-f7bff1611ed3' },
            { name: 'Podcast Index', logo: asset('images/podcast.jpg'), href: 'https://podcastindex.org/podcast/7267846' },
            { name: 'Overcast', logo: asset('images/overcast.png'), href: 'https://overcast.fm/itunes1804483344' },
            { name: 'iHeartRadio', logo: asset('images/iheart.jpg'), href: 'https://www.iheart.com/podcast/269-black-bridge-mindset-270994431/' },
            { name: 'Podcast Addict', logo: asset('images/addict.png'), href: 'https://podcastaddict.com/podcast/black-bridge-mindset/5772556' },
            { name: 'Castro', logo: asset('images/castro.jpg'), href: 'https://castro.fm/itunes/1804483344' },
            { name: 'Castbox', logo: asset('images/castbox.jpg'), href: 'https://castbox.fm/vic/1804483344?ref=buzzsprout' },
            { name: 'Podchaser', logo: asset('images/podchaser.jpg'), href: 'https://www.podchaser.com/podcasts/black-bridge-mindset-6041296' },
            { name: 'Pocket Casts', logo: asset('images/pocket.png'), href: 'https://pca.st/dijukwcs' },
            { name: 'Deezer', logo: asset('images/deezer.png'), href: 'https://www.deezer.com/show/1001749991' },
            { name: 'Listen Notes', logo: asset('images/listen.png'), href: 'https://www.listennotes.com/c/43d73d613b13440a8a868032d284f9be/' },
            { name: 'Player FM', logo: asset('images/player.jpg'), href: 'https://player.fm/series/series-3655117' },
            { name: 'Goodpods', logo: asset('images/good.png'), href: 'https://www.goodpods.com/podcasts-aid/1804483344' },
            { name: 'TrueFans', logo: asset('images/true.jpg'), href: 'https://truefans.fm/41a48165-a6cd-58ab-8245-7687e88ababd' },
          ].map((platform) => (
            platform.href ? (
              <a
                className="bbm-platform-row"
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div className="bbm-platform-logo">
                  <img src={platform.logo} alt={platform.name + ' logo'} className="bbm-platform-img" loading="lazy" decoding="async" />
                </div>
                <div className="bbm-platform-name">{platform.name}</div>
              </a>
            ) : (
              <div className="bbm-platform-row" key={platform.name}>
                <div className="bbm-platform-logo">
                  <img src={platform.logo} alt={platform.name + ' logo'} className="bbm-platform-img" loading="lazy" decoding="async" />
                </div>
                <div className="bbm-platform-name">{platform.name}</div>
              </div>
            )
          ))}
        </div>
      </section>
    </Layout>
  );
}
