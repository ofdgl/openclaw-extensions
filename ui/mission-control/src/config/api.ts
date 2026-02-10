// API Configuration
export const API_BASE_URL = import.meta.env.PROD
    ? 'http://76.13.137.215:3001'
    : 'http://localhost:3001'

// API Key (loaded from environment variable on server side)
export const API_KEY = import.meta.env.VITE_API_KEY || ''

// Debug logging
console.log('[Kamino Config] API_BASE_URL:', API_BASE_URL)
console.log('[Kamino Config] API_KEY loaded:', API_KEY ? `${API_KEY.substring(0, 16)}...` : 'EMPTY!')
console.log('[Kamino Config] import.meta.env.VITE_API_KEY:', import.meta.env.VITE_API_KEY ? 'Set' : 'Not Set')
console.log('[Kamino Config] import.meta.env.PROD:', import.meta.env.PROD)
