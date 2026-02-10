import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

interface Session {
    sessionId: string
    user: string
    phone: string
    agent: string
    model: string
    createdAt: string
    lastActivity: string
    messageCount: number
}

// GET /api/sessions - List all sessions
app.get('/', async (c) => {
    try {
        const sessionsDir = path.join(process.env.HOME || '/root', '.openclaw/agents/main/sessions')

        try {
            await fs.access(sessionsDir)
        } catch {
            return c.json({ sessions: [] })
        }

        const files = await fs.readdir(sessionsDir)
        const jsonFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.jsonl'))

        const sessions: Session[] = []

        for (const file of jsonFiles.slice(0, 50)) {
            try {
                const filePath = path.join(sessionsDir, file)
                const content = await fs.readFile(filePath, 'utf-8')
                const lines = content.trim().split('\n').filter(l => l.trim())

                const entries = lines.map(l => {
                    try { return JSON.parse(l) } catch { return null }
                }).filter(Boolean)

                if (entries.length === 0) continue

                // Session metadata is first line with type:'session'
                const sessionMeta = entries.find((e: any) => e.type === 'session')
                // Model info from model_change entry
                const modelEntry = entries.find((e: any) => e.type === 'model_change')
                // Actual messages have type:'message'
                const messages = entries.filter((e: any) => e.type === 'message')

                // Extract user info from first user message
                let userName = 'Unknown'
                let phone = ''
                const firstUserMsg = messages.find((m: any) => m.message?.role === 'user')
                if (firstUserMsg) {
                    // Try to get user name from message metadata
                    userName = firstUserMsg.senderName || firstUserMsg.pushName || firstUserMsg.from || 'User'
                    phone = firstUserMsg.jid || firstUserMsg.phone || ''
                }

                sessions.push({
                    sessionId: file.replace('.json', '').replace('.jsonl', ''),
                    user: userName,
                    phone,
                    agent: sessionMeta?.cwd?.includes('agents/') ? 'main-agent' : 'main-agent',
                    model: modelEntry?.modelId || modelEntry?.provider || 'unknown',
                    createdAt: sessionMeta?.timestamp || entries[0]?.timestamp || new Date().toISOString(),
                    lastActivity: entries[entries.length - 1]?.timestamp || new Date().toISOString(),
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

        // Try .jsonl first, then .json
        let filePath = path.join(sessionsDir, `${sessionId}.jsonl`)
        try {
            await fs.access(filePath)
        } catch {
            filePath = path.join(sessionsDir, `${sessionId}.json`)
        }

        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.trim().split('\n').filter(l => l.trim())

        const entries = lines.map(l => {
            try { return JSON.parse(l) } catch { return null }
        }).filter(Boolean)

        // Only type:'message' entries are actual messages
        const messages = entries
            .filter((e: any) => e.type === 'message')
            .map((entry: any) => {
                // Role from entry.message.role
                const role = entry.message?.role || 'unknown'

                // Content is an array of parts: [{type:'text', text:'...'}]
                let textContent = ''
                if (Array.isArray(entry.content)) {
                    textContent = entry.content
                        .filter((p: any) => p.type === 'text')
                        .map((p: any) => p.text)
                        .join('\n')
                } else if (typeof entry.content === 'string') {
                    textContent = entry.content
                }

                return {
                    role,
                    content: textContent,
                    timestamp: entry.timestamp || new Date().toISOString(),
                    tokens: entry.usage?.total_tokens || entry.tokens || 0,
                    cost: entry.cost || 0
                }
            })
            .filter((m: any) => m.content) // Only messages with actual text content

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
