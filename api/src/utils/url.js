function getPublicBaseUrl() {
  const raw = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  let base = raw.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') {
    base = base.replace(/^http:\/\//i, 'https://');
  }
  return base;
}

function toAbsoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
      return url.replace(/^http:\/\//i, 'https://');
    }
    return url;
  }
  const base = getPublicBaseUrl();
  const absolute = url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  return absolute;
}

module.exports = { getPublicBaseUrl, toAbsoluteUrl };
