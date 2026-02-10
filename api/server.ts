import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { dashboardRoutes } from './routes/dashboard'
import { costRoutes } from './routes/costs'

const app = new Hono()

// Load API secret from environment
const API_SECRET = process.env.API_SECRET_KEY || 'dev-secret-key'

// CORS for frontend
app.use('/*', cors({
    origin: ['http://localhost:5173', 'http://76.13.137.215', 'http://76.13.137.215:5173'],
    credentials: true,
}))

// Auth middleware for API routes
app.use('/api/*', async (c, next) => {
    const key = c.req.query('key')
    if (key !== API_SECRET) {
        return c.json({ error: 'Unauthorized' }, 401)
    }
    await next()
})

// Health check (no auth required)
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API routes
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/costs', costRoutes)

export default app
