import React, { useState } from 'react';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuToggle = () => setMenuOpen((open) => !open);
  const handleMenuClose = () => setMenuOpen(false);
  return (
    <div className="bbm-root">
      <nav className="bbm-navbar">
        <div className="bbm-navbar-content">
          <a href="#top" className="bbm-navbar-logo">Black Bridge Mindset</a>
          <button className="bbm-navbar-menu" aria-label="Menu" onClick={handleMenuToggle} aria-expanded={menuOpen} aria-controls="bbm-navbar-dropdown">
            <span className="bbm-navbar-menu-icon"></span>
          </button>
          {menuOpen && (
            <div className="bbm-navbar-dropdown" id="bbm-navbar-dropdown">
              <a href="#bbm-platforms" onClick={handleMenuClose}>Listen</a>
              <a href="#bbm-episodes" onClick={handleMenuClose}>Episodes</a>
              <a href="#bbm-contact" onClick={handleMenuClose}>Contact</a>
            </div>
          )}
        </div>
      </nav>
      <header className="bbm-hero" id="top">
        <div className="bbm-overlay">
          <h1 className="bbm-title">The Black Bridge Mindset</h1>
          <h2 className="bbm-subtitle">Where culture and entrepreneurship collide!</h2>
          <p className="bbm-intro">Welcome to The Black Bridge Mindset podcast, where culture, entrepreneurship, and business intersect to fuel inspiration. This podcast celebrates the power of diverse voices shaping the future of business.</p>
        </div>
      </header>

      <section className="bbm-section bbm-about">
        <h2>About the Podcast</h2>
        <p>
          From the small business dreamers to the big business disruptors, we’re here to uncover the challenges, triumphs, and transformative ideas that redefine success. Because when culture and ambition come together, the results are game-changing.<br /><br />
          Each episode we’ll delve deep into the challenges, triumphs, and transformative ideas that redefine success. Because when culture and ambition come together, the results are game-changing.<br /><br />
          So, whether you’re building a business, breaking barriers, or just looking for some serious inspiration, you’re in the right place.<br /><br />
          <strong>The Black Bridge Mindset: Where culture and entrepreneurship collide!</strong>
        </p>
        <div style={{textAlign: 'center', marginTop: '2rem'}}>
          <a href="#bbm-platforms" className="bbm-scroll-btn">Listen on Your Favorite Platform</a>
        </div>
      </section>

      <section className="bbm-section bbm-trio">
        <h2>Meet the Trio</h2>
        <div className="bbm-trio-cards">
          {/* Card 1: Text left, image right */}
          <div className="bbm-trio-card bbm-trio-row">
            <div className="bbm-trio-text">
              <p className="bbm-host-bio">
                A self-driven leader with an entrepreneurial mindset, Mike thrives on turning big ideas into reality. With a background in engineering, business ownership, and site acquisition, he’s led major projects, built strong relationships, and delivered real results. Whether scouting EV charging locations for work, negotiating real estate deals on the side, or strategizing growth, he brings a forward-thinking approach to everything he does.<br /><br />
                Outside of work, he’s all about traveling, working out, volleyball, and gaming with friends. A Chicago-based foodie, he’s always on the hunt for the best pizza and wings!<br /><br />
                As creator and cohost of Black Bridge Mindset, he dives into conversations with small minority business owners and industry leaders, sharing insights, experiences, and real talk about success and mindset. No fluff—just straight value!
              </p>
            </div>
            <div className="bbm-trio-photo">
              <img className="bbm-avatar" src="/images/Lovett.png" alt="Host 1" loading="lazy" decoding="async" />
              <h3>Mike Lovett</h3>
              <div className="bbm-host-label">Host &amp; Creator</div>
            </div>
          </div>
          {/* Card 2: Image left, text right */}
          <div className="bbm-trio-card bbm-trio-row bbm-trio-row-reverse">
            <div className="bbm-trio-photo">
              <img className="bbm-avatar" src="/images/CJ.png" alt="Host 2" loading="lazy" decoding="async" />
              <h3>Chris Johnson</h3>
              <div className="bbm-host-label">Co-Host</div>
            </div>
            <div className="bbm-trio-text">
              <p className="bbm-host-bio">
                Chris makes up one-third of the BBM team – a safe space where minority business education, entrepreneurship and culture take center stage. At first impression, Chris seems to be the more serious, intense member; however, he is actually very jovial and demure. Having a history of being honest and forthcoming, Chris strives on maintaining his friendships and supporting those around him.<br /><br />
                With several years of tech experience in the construction industry, Chris quietly ran a successful fire protection engineering contracting business for 11 years. This sole proprietorship grew out of necessity and forced Chris to become an even more focused individual. This intuitive nature to succeed falls squarely in line with the construct of the BBM podcast. When not designing fire alarm systems, Chris is avidly listening to and dissecting music of all types, attending a sporting event or enjoying a strong margarita.
              </p>
            </div>
          </div>
          {/* Card 3: Text left, image right */}
          <div className="bbm-trio-card bbm-trio-row">
            <div className="bbm-trio-text">
              <p className="bbm-host-bio">
                Ken is one of the voices behind the Black Bridge Mindset Podcast—a space where entrepreneurship, culture and minority businesses take center stage. With an insatiable curiosity for what drives people and a gift for drawing out their stories, he loves to chat with business owners, serial entrepreneurs, and industry experts to unpack their experiences, challenges and the wins that have shaped their journeys.<br /><br />
                A natural conversationalist and life-long learner, Ken brings a unique blend of insight, warmth and competitive spirit to every episode. When not behind the mic, Ken is out exploring the world, immersing in local arts and culture, or diving into the history the world has to offer. He is highly social and deeply connected to his friends, family & community and believes that great conversations don’t just inform—they inspire action.<br /><br />
                Tune into the Black Bridge Mindset Podcast where every story sparks the next big idea.
              </p>
            </div>
            <div className="bbm-trio-photo">
              <img className="bbm-avatar" src="/images/Ken.png" alt="Host 3" loading="lazy" decoding="async" />
              <h3>Ken Peak</h3>
              <div className="bbm-host-label">Co-Host</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bbm-section bbm-episodes" id="bbm-episodes">
        <h2>Episodes</h2>
        <div className="bbm-videos-list">
          <div className="bbm-videos-embeds">
            <div className="bbm-video-item">
              <iframe width="360" height="215" src="https://www.youtube.com/embed/GH__uwwYHc0" title="Mandy Ralston: Innovating Autism Care with Tech and Big Data" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
              <div className="bbm-video-title">Mandy Ralston: Innovating Autism Care with Tech and Big Data</div>
            </div>
            <div className="bbm-video-item">
              <iframe width="360" height="215" src="https://www.youtube.com/embed/-8CNeRJDA_A" title="No Shortcuts_ Consistency is Key." frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
              <div className="bbm-video-title">No Shortcuts_ Consistency is Key.</div>
            </div>
            <div className="bbm-video-item">
              <iframe width="360" height="215" src="https://www.youtube.com/embed/YVsLsv54wgU" title="Inspiring Entrepreneurial Journey of Attorney Keith Lamar Jr." frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
              <div className="bbm-video-title">Inspiring Entrepreneurial Journey of Attorney Keith Lamar Jr.</div>
            </div>
          </div>
          <div style={{textAlign: 'center', marginTop: '1rem'}}>
            <a href="https://www.youtube.com/@BlackBridgeMindset" target="_blank" rel="noopener noreferrer" style={{color: '#f7c873', fontWeight: 600}}>See all videos on YouTube</a>
          </div>
        </div>
      </section>


      <section className="bbm-section bbm-platforms" id="bbm-platforms">
        <h2>Listen on Your Favorite Platform</h2>
        <div className="bbm-platforms-grid">
          {[
            { name: 'Apple Podcasts', logo: '/images/apple.jpg', href: 'https://podcasts.apple.com/podcast/id1804483344' },
            { name: 'Spotify', logo: '/images/spotify.png', href: 'https://open.spotify.com/show/3MyZWfhu2rPPDSbu7wlTjt' },
            { name: 'Amazon Music', logo: '/images/amazon.png', href: 'https://music.amazon.com/podcasts/f070d1b9-2419-4ec5-82a6-f7bff1611ed3' },
            { name: 'Podcast Index', logo: '/images/podcast.jpg', href: 'https://podcastindex.org/podcast/7267846' },
            { name: 'Overcast', logo: '/images/overcast.png', href: 'https://overcast.fm/itunes1804483344' },
            { name: 'iHeartRadio', logo: '/images/iheart.jpg', href: 'https://www.iheart.com/podcast/269-black-bridge-mindset-270994431/' },
            { name: 'Podcast Addict', logo: '/images/addict.png', href: 'https://podcastaddict.com/podcast/black-bridge-mindset/5772556' },
            { name: 'Castro', logo: '/images/castro.jpg', href: 'https://castro.fm/itunes/1804483344' },
            { name: 'Castbox', logo: '/images/castbox.jpg', href: 'https://castbox.fm/vic/1804483344?ref=buzzsprout' },
            { name: 'Podchaser', logo: '/images/podchaser.jpg', href: 'https://www.podchaser.com/podcasts/black-bridge-mindset-6041296' },
            { name: 'Pocket Casts', logo: '/images/pocket.png', href: 'https://pca.st/dijukwcs' },
            { name: 'Deezer', logo: '/images/deezer.png', href: 'https://www.deezer.com/show/1001749991' },
            { name: 'Listen Notes', logo: '/images/listen.png', href: 'https://www.listennotes.com/c/43d73d613b13440a8a868032d284f9be/' },
            { name: 'Player FM', logo: '/images/player.jpg', href: 'https://player.fm/series/series-3655117' },
            { name: 'Goodpods', logo: '/images/good.png', href: 'https://www.goodpods.com/podcasts-aid/1804483344' },
            { name: 'TrueFans', logo: '/images/true.jpg', href: 'https://truefans.fm/41a48165-a6cd-58ab-8245-7687e88ababd' },
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

      <section className="bbm-section bbm-contact" id="bbm-contact">
        <h2>Contact</h2>
        <div className="bbm-social-icons">
          <a href="http://facebook.com/share/12EqRNzg4YP/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="bbm-social-link">
            <img src="/images/facebook.png" alt="Facebook" className="bbm-social-img" loading="lazy" decoding="async" />
          </a>
          <a href="http://instagram.com/blackbridgemindset" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="bbm-social-link">
            <img src="/images/instagram.png" alt="Instagram" className="bbm-social-img" loading="lazy" decoding="async" />
          </a>
          <a href="https://www.youtube.com/@BlackBridgeMindset" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="bbm-social-link">
            <img src="/images/youtube.png" alt="YouTube" className="bbm-social-img" />
          </a>
          <a href="https://blackbridgemindset.buzzsprout.com/" target="_blank" rel="noopener noreferrer" aria-label="Buzzsprout" className="bbm-social-link">
            <img src="/images/buzzsprout.png" alt="Buzzsprout" className="bbm-social-img" />
          </a>
        </div>
        <p>Want to connect, collaborate, or share your story? <a href="mailto:info@blackbridgemindset.com">Email us</a> or follow us on social media.</p>
      </section>

      <footer className="bbm-footer">
        <p>&copy; {new Date().getFullYear()} Black Bridge Mindset Podcast. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
