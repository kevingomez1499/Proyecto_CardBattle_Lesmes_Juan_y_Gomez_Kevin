// Las rutas guardadas en db.json son relativas (ej. "images/cards/voltaris.svg").
// Esta función las adapta a la URL base (necesario para GitHub Pages).
export function asset(path) {
  if (!path) return '';
  if (/^(https?:|data:)/.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}

export const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
