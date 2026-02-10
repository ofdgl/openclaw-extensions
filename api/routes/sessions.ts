import { Hono } from 'hono'
import * as fs from 'fs'
import * as path from 'path'

const app = new Hono()

// Mock sessions data
const mockSessions = [
    { id: 'session-main-1', user: '+1234567890', agent: 'main-agent', model: 'claude-sonnet', messageCount: 45, inputTokens: 12000, outputTokens: 8000, cost: 0.60, lastActivity: new Date().toISOString(), status: 'active' },
    { id: 'session-guest-1', user: '+0987654321', agent: 'guest-agent', model: 'gemini-flash', messageCount: 120, inputTokens: 25000, outputTokens: 18000, cost: 0, lastActivity: new Date(Date.now() - 3600000).toISOString(), status: 'idle' }
]

const mockMessages = {
    'session-main-1': [
        { role: 'user', content: 'Hello', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { role: 'assistant', content: 'Hi! How can I help?', timestamp: new Date(Date.now() - 7100000).toISOString(), tokens: 150, cost: 0.005 }
    ],
    'session-guest-1': [
        { role: 'user', content: 'Test message', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { role: 'assistant', content: 'This is a test response', timestamp: new Date(Date.now() - 3500000).toISOString(), tokens: 80, cost: 0 }
    ]
}

// GET /api/sessions - All sessions with stats
app.get('/', (c) => {
    const status = c.req.query('status')
    const agent = c.req.query('agent')

    let sessions = [...mockSessions]

    if (status) sessions = sessions.filter(s => s.status === status)
    if (agent) sessions = sessions.filter(s => s.agent === agent)

    return c.json({ sessions })
})

// GET /api/sessions/:id/messages - Session conversation
app.get('/:id/messages', (c) => {
    const id = c.req.param('id')
    const messages = mockMessages[id as keyof typeof mockMessages] || []

    return c.json({ messages })
})

// POST /api/sessions/:id/send - Send message to session
app.post('/:id/send', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()

    // In production: actually send via WhatsApp gateway
    // For now: acknowledge
    return c.json({ success: true, messageId: `msg-${Date.now()}` })
})

export const sessionsRoutes = app
