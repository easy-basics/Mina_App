function getPublicBaseUrl() {
  return (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(
    /\/$/,
    ''
  );
}

function toAbsoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = getPublicBaseUrl();
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

module.exports = { getPublicBaseUrl, toAbsoluteUrl };
