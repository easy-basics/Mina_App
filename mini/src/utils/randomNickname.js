const PREFIXES = ['布友', '访客', '用户']

export function generateRandomNickname() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}${suffix}`
}
