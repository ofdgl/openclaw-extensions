import { Hono } from 'hono'

const app = new Hono()

// Mock hooks data
const mockHooks = [
    { id: 'router-guard', name: 'Router Guard', enabled: true, executions: 245, lastRun: new Date().toISOString(), status: 'success' },
    { id: 'billing-tracker', name: 'Billing Tracker', enabled: true, executions: 189, lastRun: new Date(Date.now() - 300000).toISOString(), status: 'success' },
    { id: 'rate-limiter', name: 'Rate Limiter', enabled: false, executions: 0, lastRun: null, status: 'disabled' },
    { id: 'secret-guard', name: 'Secret Guard', enabled: true, executions: 52, lastRun: new Date(Date.now() - 600000).toISOString(), status: 'success' }
]

// GET /api/hooks - List all hooks
app.get('/', (c) => {
    const enabled = c.req.query('enabled')

    let hooks = [...mockHooks]
    if (enabled !== undefined) {
        hooks = hooks.filter(h => h.enabled === (enabled === 'true'))
    }

    return c.json({ hooks })
})

// PATCH /api/hooks/:id - Toggle hook enabled/disabled
app.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()

    const hook = mockHooks.find(h => h.id === id)
    if (!hook) {
        return c.json({ error: 'Hook not found' }, 404)
    }

    // In production: update hook config file
    hook.enabled = body.enabled

    return c.json({ success: true, hook })
})

export const hooksRoutes = app
