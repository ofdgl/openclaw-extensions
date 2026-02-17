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
            user: e.user,
            phone: e.phone,
            message: e.content || `${e.role} message`,
            model: e.model,
            tokens: e.totalTokens,
            inputTokens: e.inputTokens,
            outputTokens: e.outputTokens,
            cacheReadTokens: e.cacheReadTokens,
            cacheCreationTokens: e.cacheCreationTokens,
            cost: e.cost,
            role: e.role,
            channel: e.channel,
            session: e.session,
            agentId: e.agentId,
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
        user: log.user,
        phone: log.phone,
        message: log.content || `${log.role} message`,
        model: log.model,
        tokens: log.totalTokens,
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens,
        cacheReadTokens: log.cacheReadTokens,
        cacheCreationTokens: log.cacheCreationTokens,
        cost: log.cost,
        role: log.role,
        channel: log.channel,
        session: log.session,
        agentId: log.agentId,
        fullThinking: '',
        toolCalls: [],
        retryHistory: []
    })
})

export const logsRoutes = app
