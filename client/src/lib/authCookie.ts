const TOKEN_COOKIE = 'token'
const MAX_AGE_SEC = 7 * 24 * 60 * 60

function cookieDomain(): string {
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return 'localhost'
  return host
}

export function setTokenCookie(token: string): void {
  const domain = cookieDomain()
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Domain=${domain}; Max-Age=${MAX_AGE_SEC}; SameSite=Lax${secure}`
}

export function clearTokenCookie(): void {
  const domain = cookieDomain()
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Domain=${domain}; Max-Age=0`
}
