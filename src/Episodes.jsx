import React from 'react';

import Layout from './Layout';
import YouTubeVideos from './YouTubeVideos';

export default function Episodes() {
  return (
    <Layout>
      <main className="bbm-section bbm-episodes">
        <h2>Episodes</h2>
        <YouTubeVideos />
      </main>
    </Layout>
  );
}
