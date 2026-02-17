// API Configuration
export const API_BASE_URL = import.meta.env.PROD
    ? `${window.location.origin}/api`
    : 'http://localhost:9347'

// Auth: URL key → localStorage → login box
function initApiKey(): string {
    // 1. Check URL param (first-time / share link)
    const urlParams = new URLSearchParams(window.location.search)
    const urlKey = urlParams.get('key')
    if (urlKey) {
        localStorage.setItem('kamino_api_key', urlKey)
        localStorage.setItem('kamino_api_key_ts', Date.now().toString())
        // Clean URL
        urlParams.delete('key')
        const clean = urlParams.toString()
        const newUrl = window.location.pathname + (clean ? `?${clean}` : '')
        window.history.replaceState({}, '', newUrl)
        return urlKey
    }

    // 2. Check localStorage (30 day TTL)
    const stored = localStorage.getItem('kamino_api_key')
    const storedTs = localStorage.getItem('kamino_api_key_ts')
    if (stored && storedTs) {
        const age = Date.now() - parseInt(storedTs)
        const thirtyDays = 30 * 24 * 60 * 60 * 1000
        if (age < thirtyDays) return stored
        // Expired
        localStorage.removeItem('kamino_api_key')
        localStorage.removeItem('kamino_api_key_ts')
    }

    // 3. Fallback: env var (dev mode)
    return import.meta.env.VITE_API_KEY || ''
}

export const API_KEY = initApiKey()

// Auth headers for fetch calls
export function getApiHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
        ...extra,
    }
}

// Set key programmatically (from login box)
export function setApiKey(key: string) {
    localStorage.setItem('kamino_api_key', key)
    localStorage.setItem('kamino_api_key_ts', Date.now().toString())
    window.location.reload()
}

// Check if authenticated
export function isAuthenticated(): boolean {
    return API_KEY.length > 0
}

// Debug logging
console.log('[Kamino Config] API_BASE_URL:', API_BASE_URL)
console.log('[Kamino Config] Authenticated:', isAuthenticated())
