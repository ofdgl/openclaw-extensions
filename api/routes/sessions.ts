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
    channel: string
    createdAt: string
    lastActivity: string
    messageCount: number
    totalTokens: number
}

// GET /api/sessions - List all sessions from ALL agents
app.get('/', async (c) => {
    try {
        const agentsBase = path.join(process.env.HOME || '/root', '.openclaw/agents')
        const sessions: Session[] = []

        let agentDirs: string[] = []
        try {
            agentDirs = await fs.readdir(agentsBase)
        } catch {
            return c.json({ sessions: [] })
        }

        for (const agentId of agentDirs) {
            const sessionsDir = path.join(agentsBase, agentId, 'sessions')
            let files: string[] = []
            try {
                files = (await fs.readdir(sessionsDir)).filter(f => f.endsWith('.jsonl'))
            } catch { continue }

            for (const file of files.slice(0, 50)) {
                try {
                    const filePath = path.join(sessionsDir, file)
                    const content = await fs.readFile(filePath, 'utf-8')
                    const lines = content.trim().split('\n').filter(l => l.trim())

                    const entries = lines.map(l => {
                        try { return JSON.parse(l) } catch { return null }
                    }).filter(Boolean)

                    if (entries.length === 0) continue

                    // Find session metadata
                    const sessionMeta = entries.find((e: any) => e.type === 'session')
                    const summaryEntry = entries.find((e: any) => e.type === 'summary')

                    // Model info
                    let model = 'unknown'
                    const modelEntry = entries.find((e: any) => e.type === 'model_change')
                    if (modelEntry) model = modelEntry.modelId || modelEntry.provider || 'unknown'
                    if (summaryEntry?.model) model = summaryEntry.model

                    // Count messages
                    const messages = entries.filter((e: any) => e.type === 'message')

                    // Extract user info from first user message
                    let userName = 'Unknown'
                    let phone = ''
                    let channel = ''
                    for (const msg of messages) {
                        if (msg.message?.role === 'user') {
                            userName = msg.senderName || msg.pushName || msg.from || 'User'
                            phone = msg.senderId || msg.jid || msg.phone || ''
                            channel = msg.commandSource || msg.channel || ''
                            break
                        }
                    }
                    // Also check session-level metadata
                    if (!channel && sessionMeta) {
                        channel = sessionMeta.lastChannel || sessionMeta.commandSource || ''
                    }
                    if (summaryEntry) {
                        channel = channel || summaryEntry.lastChannel || ''
                    }

                    // Sum total tokens
                    let totalTokens = 0
                    for (const msg of messages) {
                        const usage = msg.usage || msg.message?.usage || {}
                        totalTokens += (usage.input_tokens || 0) + (usage.output_tokens || 0)
                    }
                    // Also check summary entry
                    if (summaryEntry) {
                        totalTokens = totalTokens || (summaryEntry.inputTokens || 0) + (summaryEntry.outputTokens || 0)
                    }

                    sessions.push({
                        sessionId: file.replace('.jsonl', ''),
                        user: userName,
                        phone,
                        agent: agentId,
                        model,
                        channel,
                        createdAt: sessionMeta?.timestamp || entries[0]?.timestamp || new Date().toISOString(),
                        lastActivity: entries[entries.length - 1]?.timestamp || new Date().toISOString(),
                        messageCount: messages.length,
                        totalTokens
                    })
                } catch (e) {
                    console.error(`Failed to parse session file ${file}:`, e)
                }
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
// Supports ?agent=main to specify which agent's sessions to look in
app.get('/:id/messages', async (c) => {
    try {
        const sessionId = c.req.param('id')
        const agentId = c.req.query('agent') || 'main'
        const agentsBase = path.join(process.env.HOME || '/root', '.openclaw/agents')

        // First try the specified agent, then search all agents
        let filePath = ''
        const tryPaths = [
            path.join(agentsBase, agentId, 'sessions', `${sessionId}.jsonl`),
        ]

        // If not found in specified agent, search all
        for (const tp of tryPaths) {
            try {
                await fs.access(tp)
                filePath = tp
                break
            } catch { }
        }

        // Search all agents if not found
        if (!filePath) {
            let agentDirs: string[] = []
            try { agentDirs = await fs.readdir(agentsBase) } catch { }
            for (const ad of agentDirs) {
                const fp = path.join(agentsBase, ad, 'sessions', `${sessionId}.jsonl`)
                try {
                    await fs.access(fp)
                    filePath = fp
                    break
                } catch { }
            }
        }

        if (!filePath) {
            return c.json({ messages: [] })
        }

        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.trim().split('\n').filter(l => l.trim())

        const entries = lines.map(l => {
            try { return JSON.parse(l) } catch { return null }
        }).filter(Boolean)

        // Find session model
        let sessionModel = 'unknown'
        for (const e of entries) {
            if (e.type === 'model_change') {
                sessionModel = e.modelId || e.provider || 'unknown'
            } else if (e.type === 'summary') {
                sessionModel = e.model || sessionModel
            }
        }

        // Only type:'message' entries are actual messages
        const messages = entries
            .filter((e: any) => e.type === 'message')
            .map((entry: any) => {
                const role = entry.message?.role || 'unknown'

                // Content is in entry.message.content (NOT entry.content!)
                const msgContent = entry.message?.content
                let textContent = ''
                if (Array.isArray(msgContent)) {
                    textContent = msgContent
                        .filter((p: any) => p.type === 'text')
                        .map((p: any) => p.text)
                        .join('\n')
                } else if (typeof msgContent === 'string') {
                    textContent = msgContent
                }

                // Extract usage/tokens
                const usage = entry.usage || entry.message?.usage || {}
                const inputTokens = usage.input_tokens || usage.prompt_tokens || 0
                const outputTokens = usage.output_tokens || usage.completion_tokens || 0
                const cacheRead = usage.cache_read_input_tokens || 0
                const totalTokens = inputTokens + outputTokens

                return {
                    role,
                    content: textContent,
                    timestamp: entry.timestamp || new Date().toISOString(),
                    user: entry.senderName || entry.pushName || entry.from || '',
                    phone: entry.senderId || entry.jid || '',
                    channel: entry.commandSource || '',
                    model: sessionModel,
                    tokens: {
                        input: inputTokens,
                        output: outputTokens,
                        cacheRead,
                        total: totalTokens
                    },
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
