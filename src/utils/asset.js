/**
 * Resolves a public asset path relative to the Vite BASE_URL.
 *
 * @param {string} path - Relative path within the public/ directory (e.g. 'images/logo.jpg')
 * @returns {string} Full URL-safe path for use in src/href attributes.
 */
export function asset(path) {
  const base = import.meta.env.BASE_URL || '/';
  const clean = String(path).replace(/^\/+/, '');
  return `${base}${clean}`;
}
