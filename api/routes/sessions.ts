import { Hono } from 'hono'

const app = new Hono()

// Sessions, agents, hooks, contacts, memory, cron - these return empty for now
// Will populate when real OpenClaw data exists

app.get('/', (c) => c.json({ sessions: [] }))
app.get('/:id/messages', (c) => c.json({ messages: [] }))
app.post('/:id/send', (c) => c.json({ success: true, messageId: `msg-${Date.now()}` }))

export const sessionsRoutes = app
