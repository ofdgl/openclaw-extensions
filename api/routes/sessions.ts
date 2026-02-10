import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

interface Session {
    sessionId: string
    user: string
    phone: string
    agent: string
    createdAt: string
    lastActivity: string
    messageCount: number
}

// GET /api/sessions - List all sessions
app.get('/', async (c) => {
    try {
        const sessionsDir = path.join(process.env.HOME || '/root', '.openclaw/agents/main/sessions')

        // Check if directory exists
        try {
            await fs.access(sessionsDir)
        } catch {
            return c.json({ sessions: [] })
        }

        const files = await fs.readdir(sessionsDir)
        const jsonFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.jsonl'))

        const sessions: Session[] = []

        for (const file of jsonFiles.slice(0, 50)) { // Limit to 50 sessions
            try {
                const filePath = path.join(sessionsDir, file)
                const content = await fs.readFile(filePath, 'utf-8')

                // Parse JSONL format (each line is a message)
                const lines = content.trim().split('\n').filter(l => l.trim())
                const messages = lines.map(l => {
                    try {
                        return JSON.parse(l)
                    } catch {
                        return null
                    }
                }).filter(Boolean)

                if (messages.length > 0) {
                    const firstMsg = messages[0]
                    const lastMsg = messages[messages.length - 1]

                    sessions.push({
                        sessionId: file.replace('.json', '').replace('.jsonl', ''),
                        user: firstMsg.user || firstMsg.from || 'Unknown',
                        phone: firstMsg.phone || firstMsg.jid || '',
                        agent: 'main-agent',
                        createdAt: firstMsg.timestamp || new Date().toISOString(),
                        lastActivity: lastMsg.timestamp || new Date().toISOString(),
                        messageCount: messages.length
                    })
                }
            } catch (e) {
                console.error(`Failed to parse session file ${file}:`, e)
            }
        }

        return c.json({
            sessions: sessions.sort((a, b) =>
                new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
            )
        })
    } catch (error) {
        console.error('Failed to fetch sessions:', error)
        return c.json({ sessions: [] })
    }
})

// GET /api/sessions/:id/messages - Get session conversation
app.get('/:id/messages', async (c) => {
    try {
        const sessionId = c.req.param('id')
        const sessionsDir = path.join(process.env.HOME || '/root', '.openclaw/agents/main/sessions')

        // Try both .json and .jsonl extensions
        let filePath = path.join(sessionsDir, `${sessionId}.jsonl`)
        try {
            await fs.access(filePath)
        } catch {
            filePath = path.join(sessionsDir, `${sessionId}.json`)
        }

        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.trim().split('\n').filter(l => l.trim())

        const messages = lines.map(l => {
            try {
                const msg = JSON.parse(l)
                return {
                    role: msg.role || (msg.from ? 'user' : 'assistant'),
                    content: msg.content || msg.text || '',
                    timestamp: msg.timestamp || new Date().toISOString(),
                    tokens: msg.tokens || 0,
                    cost: msg.cost || 0
                }
            } catch {
                return null
            }
        }).filter(Boolean)

        return c.json({ messages })
    } catch (error) {
        console.error('Failed to fetch messages:', error)
        return c.json({ messages: [] })
    }
})

// POST /api/sessions/:id/send - Send message (placeholder)
app.post('/:id/send', async (c) => {
    return c.json({ success: true, messageId: `msg-${Date.now()}` })
})

export const sessionsRoutes = app
