/*
  SPA deep-link helper for static hosts.

  - On 404.html: store the deep link in sessionStorage and redirect to '/'
  - On index.html: restore the stored URL before React mounts
*/
(function () {
  try {
    var hasRoot = !!document.getElementById('root');

    // index.html: restore saved deep link
    if (hasRoot) {
      var redirect = sessionStorage.getItem('bbm_redirect');
      if (!redirect) return;
      sessionStorage.removeItem('bbm_redirect');
      history.replaceState(null, '', redirect);
      return;
    }

    // 404.html: capture and redirect
    var l = window.location;
    if (l.pathname === '/') return;

    try {
      sessionStorage.setItem('bbm_redirect', l.pathname + l.search + l.hash);
    } catch (e) {
      // ignore
    }

    l.replace('/');
  } catch (e) {
    // ignore
  }
})();
