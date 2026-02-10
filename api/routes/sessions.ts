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

                // Parse JSONL format (each line is a JSON object)
                const lines = content.trim().split('\n').filter(l => l.trim())
                const allEntries = lines.map(l => {
                    try {
                        return JSON.parse(l)
                    } catch {
                        return null
                    }
                }).filter(Boolean)

                if (allEntries.length === 0) continue

                // First line is session metadata, rest are messages
                const sessionMeta = allEntries[0]
                const messages = allEntries.slice(1).filter((m: any) => m.role || m.from || m.content)

                // Find first user message to get user info
                const firstUserMsg = messages.find((m: any) => m.role === 'user' || m.from)

                sessions.push({
                    sessionId: file.replace('.json', '').replace('.jsonl', ''),
                    user: firstUserMsg?.senderName || firstUserMsg?.from || firstUserMsg?.user || 'Unknown',
                    phone: firstUserMsg?.jid || firstUserMsg?.phone || '',
                    agent: 'main-agent',
                    createdAt: sessionMeta?.timestamp || allEntries[0]?.timestamp || new Date().toISOString(),
                    lastActivity: allEntries[allEntries.length - 1]?.timestamp || new Date().toISOString(),
                    messageCount: messages.length
                })
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

        const allEntries = lines.map(l => {
            try {
                return JSON.parse(l)
            } catch {
                return null
            }
        }).filter(Boolean)

        // Skip first line (session metadata), process messages
        const messages = allEntries.slice(1).map((msg: any) => {
            // Determine role
            let role = 'assistant'
            if (msg.role) {
                role = msg.role
            } else if (msg.from || msg.jid) {
                role = 'user'
            }

            return {
                role,
                content: msg.content || msg.text || msg.body || '',
                timestamp: msg.timestamp || new Date().toISOString(),
                tokens: msg.usage?.total_tokens || msg.tokens || 0,
                cost: msg.cost || 0
            }
        }).filter((m: any) => m.content) // Only messages with content

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
