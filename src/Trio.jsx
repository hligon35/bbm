import React from 'react';
import Layout from './Layout';

const asset = (path) => {
  const base = (import.meta.env.BASE_URL || '/');
  const clean = String(path).replace(/^\/+/,'');
  return `${base}${clean}`;
};

export default function Trio() {
  return (
    <Layout>
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
              <img className="bbm-avatar" src={asset('images/Lovett.png')} alt="Host 1" loading="lazy" decoding="async" />
              <h3>Mike Lovett</h3>
              <div className="bbm-host-label">Host &amp; Creator</div>
            </div>
          </div>
          {/* Card 2: Image left, text right */}
          <div className="bbm-trio-card bbm-trio-row bbm-trio-row-reverse">
            <div className="bbm-trio-photo">
              <img className="bbm-avatar" src={asset('images/CJ.jpg')} alt="Host 2" loading="lazy" decoding="async" />
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
              <img className="bbm-avatar" src={asset('images/Ken.png')} alt="Host 3" loading="lazy" decoding="async" />
              <h3>Ken Peak</h3>
              <div className="bbm-host-label">Co-Host</div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
