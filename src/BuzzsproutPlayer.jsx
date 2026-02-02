import React, { useEffect } from 'react';

const CONTAINER_ID = 'buzzsprout-small-player-artist-black-bridge-mindset';
const SCRIPT_SRC =
  'https://www.buzzsprout.com/2456952.js?artist=Black+Bridge+Mindset+&container_id=buzzsprout-small-player-artist-black-bridge-mindset&player=small';

export default function BuzzsproutPlayer() {
  useEffect(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    // Clear any prior embeds (helps when navigating back/forward)
    container.innerHTML = '';

    // Remove previously injected scripts for this player
    const existing = document.querySelectorAll(`script[data-buzzsprout-container="${CONTAINER_ID}"]`);
    existing.forEach((node) => node.parentNode?.removeChild(node));

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.src = SCRIPT_SRC;
    script.setAttribute('data-buzzsprout-container', CONTAINER_ID);

    // Appending to <body> is safest; script uses container_id to find the div.
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script and any rendered iframes
      script.parentNode?.removeChild(script);
      const c = document.getElementById(CONTAINER_ID);
      if (c) c.innerHTML = '';
    };
  }, []);

  return <div className="bbm-buzzsprout-player" id={CONTAINER_ID} />;
}
