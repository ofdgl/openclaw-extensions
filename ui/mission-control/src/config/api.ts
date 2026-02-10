// API Configuration
export const API_BASE_URL = import.meta.env.PROD
    ? 'http://76.13.137.215:3001'
    : 'http://localhost:3001'

// API Key (loaded from environment variable on server side)
export const API_KEY = import.meta.env.VITE_API_KEY || ''
