import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// Available models for selection
const AVAILABLE_MODELS = [
    // Anthropic — Claude 4.6 (latest)
    { id: 'anthropic/claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic' },
    { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic' },
    { id: 'anthropic/claude-haiku-4-6', name: 'Claude Haiku 4.6', provider: 'anthropic' },
    // Anthropic — Claude 4.5
    { id: 'anthropic/claude-opus-4-5', name: 'Claude Opus 4.5', provider: 'anthropic' },
    { id: 'anthropic/claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
    { id: 'anthropic/claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic' },
    // Anthropic — Claude 4
    { id: 'anthropic/claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
    // Anthropic — Claude 3.5 (legacy)
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
    // Google
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
    { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'google' },
    { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
    // OpenAI
    { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'openai' },
    { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai' },
    { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'openai/o4-mini', name: 'o4-mini', provider: 'openai' },
]

// GET /api/agents - List all agents with status
app.get('/', async (c) => {
    try {
        const home = process.env.HOME || '/root'
        const configPath = path.join(home, '.openclaw/openclaw.json')
        let config: any = {}
        try {
            const content = await fs.readFile(configPath, 'utf-8')
            config = JSON.parse(content)
        } catch { }

        const agentConfig = config.agents || {}
        const agentsList = agentConfig.list || []
        const defaultModel = agentConfig.defaults?.model?.primary || agentConfig.defaults?.model || 'unknown'

        // Read agent directories
        const agentsDir = path.join(home, '.openclaw/agents')
        let agentDirs: string[] = []
        try {
            agentDirs = await fs.readdir(agentsDir)
        } catch { }

        // Merge: agents from config.agents.list + agent directories
        const seenIds = new Set<string>()
        const agents: any[] = []

        // Helper: check SOUL.md at multiple possible paths
        const checkSoul = async (agentId: string): Promise<{ hasSoul: boolean; soulName: string }> => {
            const soulPaths = [
                path.join(home, `.openclaw/agents/${agentId}/SOUL.md`),
                path.join(home, `.openclaw/workspace-${agentId}/SOUL.md`),
                path.join(home, '.openclaw/workspace/SOUL.md'),
            ]
            for (const sp of soulPaths) {
                try {
                    await fs.access(sp)
                    const content = await fs.readFile(sp, 'utf-8')
                    const firstLine = content.split('\n').find(l => l.trim().startsWith('#'))
                    const soulName = firstLine ? firstLine.replace(/^#+\s*/, '').trim() : 'Loaded'
                    return { hasSoul: true, soulName }
                } catch { }
            }
            return { hasSoul: false, soulName: '' }
        }

        // First, add agents from agents.list config
        for (const agentDef of agentsList) {
            const id = agentDef.id || 'main'
            seenIds.add(id)

            // Session count
            let sessionCount = 0
            try {
                const sessionsDir = path.join(agentsDir, id, 'sessions')
                const sessionFiles = await fs.readdir(sessionsDir)
                sessionCount = sessionFiles.filter((f: string) => f.endsWith('.jsonl')).length
            } catch { }

            const model = agentDef.model || defaultModel
            const status = sessionCount > 0 ? 'active' : 'idle'
            const soul = await checkSoul(id)

            agents.push({
                id,
                name: agentDef.name || id.charAt(0).toUpperCase() + id.slice(1) + ' Agent',
                status,
                workspace: agentDef.workspace || `~/.openclaw/workspace-${id}`,
                model: typeof model === 'string' ? model : model?.primary || 'unknown',
                sessions: sessionCount,
                hasSoul: soul.hasSoul,
                soulName: soul.soulName,
                tools: agentDef.tools || {},
                sandbox: agentDef.sandbox || {},
                isDefault: agentDef.default || false,
                identity: agentDef.identity || {}
            })
        }

        // Then, add agents from directories not already in config
        for (const dirName of agentDirs) {
            if (seenIds.has(dirName)) continue
            seenIds.add(dirName)

            let sessionCount = 0
            try {
                const sessionsDir = path.join(agentsDir, dirName, 'sessions')
                const sessionFiles = await fs.readdir(sessionsDir)
                sessionCount = sessionFiles.filter((f: string) => f.endsWith('.jsonl')).length
            } catch { }

            const entryConfig = agentConfig.entries?.[dirName] || {}
            const model = entryConfig.model || defaultModel

            const displayNames: Record<string, string> = {
                main: 'Main Agent',
                admin: 'Admin Agent',
                security: 'Security Agent',
                demo: 'Demo Agent',
                intern: 'Intern Agent',
                guest: 'Guest Agent'
            }

            const soul = await checkSoul(dirName)

            agents.push({
                id: dirName,
                name: displayNames[dirName] || dirName.charAt(0).toUpperCase() + dirName.slice(1) + ' Agent',
                status: sessionCount > 0 ? 'active' : 'idle',
                workspace: `~/.openclaw/workspace-${dirName}`,
                model: typeof model === 'string' ? model : model?.primary || 'unknown',
                sessions: sessionCount,
                hasSoul: soul.hasSoul,
                soulName: soul.soulName,
                tools: entryConfig.tools || (dirName === 'main' ? 'all' : []),
                sandbox: entryConfig.sandbox || false,
                isDefault: dirName === 'main'
            })
        }

        return c.json({ agents, availableModels: AVAILABLE_MODELS })
    } catch (error) {
        console.error('Failed to fetch agents:', error)
        return c.json({ agents: [], availableModels: AVAILABLE_MODELS })
    }
})

// PATCH /api/agents/:id/model - Update model for a SPECIFIC agent
// If agentId === 'main' or no agents.list entry, update agents.defaults.model.primary
// Otherwise, update the specific agents.list[].model
app.patch('/:id/model', async (c) => {
    try {
        const agentId = c.req.param('id')
        const { model } = await c.req.json()

        if (!model || typeof model !== 'string') {
            return c.json({ error: 'Invalid model ID' }, 400)
        }

        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        if (!config.agents) config.agents = {}

        let oldModel = 'unknown'

        // Check if this agent is in agents.list
        const agentsList = config.agents.list || []
        const agentIndex = agentsList.findIndex((a: any) => a.id === agentId)

        if (agentIndex >= 0) {
            // Update specific agent in agents.list
            oldModel = agentsList[agentIndex].model || 'unknown'
            config.agents.list[agentIndex].model = model
        } else if (agentId === 'main') {
            // Update default model
            if (!config.agents.defaults) config.agents.defaults = {}
            if (!config.agents.defaults.model) config.agents.defaults.model = {}
            oldModel = config.agents.defaults.model.primary || 'unknown'
            config.agents.defaults.model.primary = model
        } else {
            // Create an entry in agents.list for this agent
            if (!config.agents.list) config.agents.list = []
            config.agents.list.push({
                id: agentId,
                model: model,
                workspace: `~/.openclaw/workspace-${agentId}`
            })
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        console.log(`Model changed for ${agentId}: ${oldModel} -> ${model}`)
        return c.json({ success: true, agent: agentId, oldModel, model })
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
        const home = process.env.HOME || '/root'

        // Try multiple SOUL locations
        const soulPaths = [
            path.join(home, `.openclaw/workspace-${agentId}/SOUL.md`),
            path.join(home, `.openclaw-active/souls/${agentId}.md`),
            path.join(home, `.openclaw-kamino/souls/${agentId}.md`),
            path.join(home, `.openclaw/agents/${agentId}/SOUL.md`),
            path.join(home, '.openclaw/workspace/SOUL.md'), // Main agent fallback
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
