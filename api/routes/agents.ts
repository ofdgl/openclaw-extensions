import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const app = new Hono()

// GET /api/agents - List all agents with status
app.get('/', async (c) => {
    try {
        const agentsDir = path.join(process.env.HOME || '/root', '.openclaw/agents')

        try {
            await fs.access(agentsDir)
        } catch {
            return c.json({ agents: [] })
        }

        const agentDirs = await fs.readdir(agentsDir)
        const agents = []

        for (const agentId of agentDirs) {
            try {
                const agentPath = path.join(agentsDir, agentId)
                const stat = await fs.stat(agentPath)

                if (!stat.isDirectory()) continue

                // Check for sessions
                const sessionsDir = path.join(agentPath, 'sessions')
                let sessionCount = 0
                try {
                    const sessionFiles = await fs.readdir(sessionsDir)
                    sessionCount = sessionFiles.filter(f => f.endsWith('.json') || f.endsWith('.jsonl')).length
                } catch { }

                // Check for SOUL.md
                const soulPath = path.join(agentPath, 'SOUL.md')
                let hasSoul = false
                try {
                    await fs.access(soulPath)
                    hasSoul = true
                } catch { }

                // Determine status (simple heuristic: has recent sessions = active)
                const status = sessionCount > 0 ? 'active' : 'idle'

                agents.push({
                    id: agentId,
                    name: agentId === 'main' ? 'Main Agent' : agentId === 'guest' ? 'Guest Agent' : agentId,
                    status,
                    workspace: agentPath,
                    model: 'claude-sonnet-4-5', // Default
                    sessions: sessionCount,
                    outputs: 0 // Placeholder
                })
            } catch (e) {
                console.error(`Failed to process agent ${agentId}:`, e)
            }
        }

        return c.json({ agents })
    } catch (error) {
        console.error('Failed to fetch agents:', error)
        return c.json({ agents: [] })
    }
})

// GET /api/agents/:id/outputs - Get agent outputs (placeholder)
app.get('/:id/outputs', (c) => {
    return c.json({ outputs: [] })
})

// GET /api/agents/:id/memory - Get agent SOUL and memory
app.get('/:id/memory', async (c) => {
    try {
        const agentId = c.req.param('id')
        const agentPath = path.join(process.env.HOME || '/root', '.openclaw/agents', agentId)
        const soulPath = path.join(agentPath, 'SOUL.md')

        let soul = ''
        try {
            soul = await fs.readFile(soulPath, 'utf-8')
        } catch { }

        return c.json({ soul, daily: '' })
    } catch (error) {
        return c.json({ soul: '', daily: '' })
    }
})

export const agentsRoutes = app
