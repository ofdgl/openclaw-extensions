import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// Available models for selection
const AVAILABLE_MODELS = [
    { id: 'anthropic/claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'anthropic/claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai' },
]

// GET /api/agents - List all agents with status
app.get('/', async (c) => {
    try {
        // Read from openclaw.json to get agent config
        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        let agentConfig: any = {}
        try {
            const configContent = await fs.readFile(configPath, 'utf-8')
            const config = JSON.parse(configContent)
            agentConfig = config.agents || {}
        } catch { }

        // Read agent directories
        const agentsDir = path.join(process.env.HOME || '/root', '.openclaw/agents')
        let agentDirs: string[] = []
        try {
            agentDirs = await fs.readdir(agentsDir)
        } catch { }

        // Also check SOULs directory for multi-agent definitions
        const soulsDir = path.join(process.env.HOME || '/root', '.openclaw-active/souls')
        let soulFiles: string[] = []
        try {
            soulFiles = (await fs.readdir(soulsDir)).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''))
        } catch { }

        // Merge agents from directories + souls
        const allAgentIds = [...new Set([...agentDirs, ...soulFiles])]
        const defaultModel = agentConfig.defaults?.model?.primary || agentConfig.defaults?.model || 'unknown'

        const agents = []

        for (const agentId of allAgentIds) {
            try {
                const agentPath = path.join(agentsDir, agentId)
                let isDir = false
                try {
                    const stat = await fs.stat(agentPath)
                    isDir = stat.isDirectory()
                } catch { }

                // Session count
                let sessionCount = 0
                if (isDir) {
                    try {
                        const sessionsDir = path.join(agentPath, 'sessions')
                        const sessionFiles = await fs.readdir(sessionsDir)
                        sessionCount = sessionFiles.filter(f => f.endsWith('.json') || f.endsWith('.jsonl')).length
                    } catch { }
                }

                // Get model from agent config entries or defaults
                const entryConfig = agentConfig.entries?.[agentId] || {}
                const model = entryConfig.model || defaultModel

                // Check for SOUL file
                const hasSoul = soulFiles.includes(agentId)

                // Agent display names
                const displayNames: Record<string, string> = {
                    main: 'Main Agent',
                    admin: 'Admin Agent',
                    security: 'Security Agent',
                    demo: 'Demo Agent',
                    intern: 'Intern Agent',
                    guest: 'Guest Agent'
                }

                const status = sessionCount > 0 ? 'active' : hasSoul ? 'idle' : 'offline'

                agents.push({
                    id: agentId,
                    name: displayNames[agentId] || agentId,
                    status,
                    workspace: isDir ? agentPath : `~/.openclaw-kamino/workspaces/${agentId}`,
                    model: typeof model === 'string' ? model : model?.primary || 'unknown',
                    sessions: sessionCount,
                    outputs: 0,
                    hasSoul,
                    tools: entryConfig.tools || (agentId === 'admin' ? 'all' : []),
                    sandbox: entryConfig.sandbox || false
                })
            } catch (e) {
                console.error(`Failed to process agent ${agentId}:`, e)
            }
        }

        return c.json({ agents, availableModels: AVAILABLE_MODELS })
    } catch (error) {
        console.error('Failed to fetch agents:', error)
        return c.json({ agents: [], availableModels: AVAILABLE_MODELS })
    }
})

// PATCH /api/agents/:id/model - Update agent model
app.patch('/:id/model', async (c) => {
    try {
        const agentId = c.req.param('id')
        const { model } = await c.req.json()

        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        if (!config.agents) config.agents = {}
        if (!config.agents.entries) config.agents.entries = {}
        if (!config.agents.entries[agentId]) config.agents.entries[agentId] = {}

        config.agents.entries[agentId].model = model

        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        return c.json({ success: true, agent: agentId, model })
    } catch (error) {
        console.error('Failed to update agent model:', error)
        return c.json({ error: 'Failed to update model' }, 500)
    }
})

// GET /api/agents/:id/outputs - Get agent outputs
app.get('/:id/outputs', (c) => {
    return c.json({ outputs: [] })
})

// GET /api/agents/:id/memory - Get agent SOUL and memory
app.get('/:id/memory', async (c) => {
    try {
        const agentId = c.req.param('id')

        // Try multiple SOUL locations
        const soulPaths = [
            path.join(process.env.HOME || '/root', `.openclaw-active/souls/${agentId}.md`),
            path.join(process.env.HOME || '/root', `.openclaw-kamino/souls/${agentId}.md`),
            path.join(process.env.HOME || '/root', `.openclaw/agents/${agentId}/SOUL.md`),
            path.join(process.env.HOME || '/root', '.openclaw/workspace/SOUL.md'), // Main agent
        ]

        let soul = ''
        for (const sp of soulPaths) {
            try {
                soul = await fs.readFile(sp, 'utf-8')
                break
            } catch { }
        }

        return c.json({ soul, daily: '' })
    } catch (error) {
        return c.json({ soul: '', daily: '' })
    }
})

export const agentsRoutes = app
