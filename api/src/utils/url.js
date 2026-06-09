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

/** 入库/管理端展示：统一为 /uploads/... 相对路径 */
function toRelativeMediaPath(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/uploads/')) return trimmed;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed);
      if (u.pathname.startsWith('/uploads/')) return u.pathname;
    } catch {
      /* ignore */
    }
  }

  const idx = trimmed.indexOf('/uploads/');
  if (idx !== -1) return trimmed.slice(idx);

  return trimmed.startsWith('/') ? trimmed : null;
}

module.exports = { getPublicBaseUrl, toAbsoluteUrl, toRelativeMediaPath };
