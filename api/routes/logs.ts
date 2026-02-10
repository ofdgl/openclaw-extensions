import { Hono } from 'hono'
import { parseBillingLogs } from '../services/billing'

const app = new Hono()

// GET /api/logs/tokens - Paginated token/message logs
app.get('/tokens', async (c) => {
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    const model = c.req.query('model')
    const user = c.req.query('user')

    try {
        const entries = await parseBillingLogs(1000)

        let logs = entries.map(e => ({
            id: `${e.timestamp}-${e.phone}`,
            timestamp: e.timestamp,
            user: `${e.user} (${e.phone})`,
            message: `API request`,
            model: e.model,
            tokens: e.totalTokens,
            cost: e.cost,
            thinking: '',
            tools: [],
            retries: 0
        }))

        if (model) logs = logs.filter(l => l.model.includes(model))
        if (user) logs = logs.filter(l => l.user.includes(user))

        const paginated = logs.slice(offset, offset + limit)

        return c.json({
            logs: paginated,
            total: logs.length,
            offset,
            limit
        })
    } catch (error) {
        return c.json({ logs: [], total: 0, offset, limit })
    }
})

// GET /api/logs/tokens/:id/details - Specific message details
app.get('/tokens/:id/details', async (c) => {
    const id = c.req.param('id')
    const entries = await parseBillingLogs(1000)

    const log = entries.find(e => `${e.timestamp}-${e.phone}` === id)

    if (!log) {
        return c.json({ error: 'Log not found' }, 404)
    }

    return c.json({
        id,
        timestamp: log.timestamp,
        user: `${log.user} (${log.phone})`,
        message: 'API request',
        model: log.model,
        tokens: log.totalTokens,
        cost: log.cost,
        fullThinking: '',
        toolCalls: [],
        retryHistory: []
    })
})

export const logsRoutes = app
