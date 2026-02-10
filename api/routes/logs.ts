import { Hono } from 'hono'
import * as fs from 'fs'
import * as path from 'path'

const app = new Hono()

// Mock data for when files don't exist
const mockLogs = [
    { id: '1', timestamp: new Date().toISOString(), user: '+1234567890', message: 'Test message', model: 'claude-sonnet', tokens: 1500, cost: 0.045, thinking: 'Processing request...', tools: ['search'], retries: 0 },
    { id: '2', timestamp: new Date().toISOString(), user: '+0987654321', message: 'Another message', model: 'gemini-flash', tokens: 800, cost: 0, thinking: '', tools: [], retries: 1 }
]

// GET /api/logs/tokens - Paginated token/message logs
app.get('/tokens', (c) => {
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    const model = c.req.query('model')
    const user = c.req.query('user')

    // Try to read from billing tracker logs
    try {
        // In production: parse ~/.openclaw/logs/billing-tracker.log
        // For now: return mock data
        let logs = [...mockLogs]

        if (model) logs = logs.filter(l => l.model.includes(model))
        if (user) logs = logs.filter(l => l.user === user)

        const paginated = logs.slice(offset, offset + limit)

        return c.json({
            logs: paginated,
            total: logs.length,
            offset,
            limit
        })
    } catch (error) {
        return c.json({ error: 'Failed to load logs', logs: [], total: 0 }, 500)
    }
})

// GET /api/logs/tokens/:id/details - Specific message details
app.get('/tokens/:id/details', (c) => {
    const id = c.req.param('id')
    const log = mockLogs.find(l => l.id === id)

    if (!log) {
        return c.json({ error: 'Log not found' }, 404)
    }

    return c.json({
        ...log,
        fullThinking: log.thinking,
        toolCalls: log.tools.map(t => ({ tool: t, success: true })),
        retryHistory: Array(log.retries).fill({ reason: 'Rate limit', delay: 1000 })
    })
})

export const logsRoutes = app
