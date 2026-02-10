import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { dashboardRoutes } from './routes/dashboard'
import { costRoutes } from './routes/costs'

const app = new Hono()

// CORS for frontend
app.use('/*', cors({
    origin: ['http://localhost:5173', 'http://116.203.255.159:5173'],
    credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API routes
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/costs', costRoutes)

export default app
