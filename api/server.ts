import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { dashboardRoutes } from './routes/dashboard'
import { costRoutes } from './routes/costs'
import { logsRoutes } from './routes/logs'
import { sessionsRoutes } from './routes/sessions'
import { agentsRoutes } from './routes/agents'
import { hooksRoutes } from './routes/hooks'
import { contactsRoutes } from './routes/contacts'
import { memoryRoutes } from './routes/memory'
import { cronRoutes } from './routes/cron'
import { terminalRoutes } from './routes/terminal'
import { logviewerRoutes } from './routes/logviewer'
import { securityRoutes } from './routes/security'
import { routingRoutes } from './routes/routing'

const app = new Hono()

// CORS
app.use('*', cors({
    origin: ['https://kamino.xn--merfaruk-m4a.com', 'http://localhost:5173', 'http://localhost:7891'],
    credentials: true,
}))

// Auth middleware
app.use('/api/*', async (c, next) => {
    const key = c.req.header('X-API-Key') || c.req.query('key')
    const expectedKey = process.env.API_SECRET_KEY

    if (!expectedKey) {
        console.error('⚠️ API_SECRET_KEY not set! All requests will be rejected.')
        return c.json({ error: 'Server misconfigured' }, 500)
    }

    if (key !== expectedKey) {
        return c.json({ error: 'Unauthorized' }, 401)
    }
    await next()
})

// Health check (no auth required)
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Auth check (behind /api/* middleware — used by AccessGuard)
app.get('/api/auth/check', (c) => c.json({ authenticated: true }))

// API routes
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/costs', costRoutes)
app.route('/api/logs', logsRoutes)
app.route('/api/sessions', sessionsRoutes)
app.route('/api/agents', agentsRoutes)
app.route('/api/hooks', hooksRoutes)
app.route('/api/contacts', contactsRoutes)
app.route('/api/memory', memoryRoutes)
app.route('/api/cron', cronRoutes)
app.route('/api/terminal', terminalRoutes)
app.route('/api/logviewer', logviewerRoutes)
app.route('/api/security', securityRoutes)
app.route('/api/routing', routingRoutes)

export default app
