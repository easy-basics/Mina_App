const STORAGE_KEY = 'search_history'
const MAX_ITEMS = 10

export function getSearchHistory() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function addSearchHistory(keyword) {
  const kw = keyword?.trim()
  if (!kw) return
  let list = getSearchHistory().filter((item) => item !== kw)
  list.unshift(kw)
  if (list.length > MAX_ITEMS) list = list.slice(0, MAX_ITEMS)
  uni.setStorageSync(STORAGE_KEY, list)
}

export function clearSearchHistory() {
  uni.removeStorageSync(STORAGE_KEY)
}
