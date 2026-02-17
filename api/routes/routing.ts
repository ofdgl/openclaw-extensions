import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/routing - Get current routing config (agents.list + bindings)
app.get('/', async (c) => {
    try {
        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        return c.json({
            agents: config.agents?.list || [],
            bindings: config.bindings || [],
            defaultAgent: findDefaultAgent(config),
            defaultModel: config.agents?.defaults?.model?.primary || 'unknown',
            channels: config.channels || {},
        })
    } catch (error) {
        console.error('Failed to read routing config:', error)
        return c.json({ agents: [], bindings: [], defaultAgent: 'main', defaultModel: 'unknown', channels: {} })
    }
})

// PUT /api/routing/agents - Update agents.list in openclaw.json
app.put('/agents', async (c) => {
    try {
        const { agents } = await c.req.json()
        if (!Array.isArray(agents)) {
            return c.json({ error: 'agents must be an array' }, 400)
        }

        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        if (!config.agents) config.agents = {}
        config.agents.list = agents

        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        return c.json({ success: true, agents })
    } catch (error) {
        console.error('Failed to update agents list:', error)
        return c.json({ error: 'Failed to update' }, 500)
    }
})

// PUT /api/routing/bindings - Update bindings in openclaw.json
app.put('/bindings', async (c) => {
    try {
        const { bindings } = await c.req.json()
        if (!Array.isArray(bindings)) {
            return c.json({ error: 'bindings must be an array' }, 400)
        }

        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        config.bindings = bindings

        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        return c.json({ success: true, bindings })
    } catch (error) {
        console.error('Failed to update bindings:', error)
        return c.json({ error: 'Failed to update' }, 500)
    }
})

// POST /api/routing/agents/:id - Add or update a single agent in agents.list
app.post('/agents/:id', async (c) => {
    try {
        const agentId = c.req.param('id')
        const agentData = await c.req.json()

        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        if (!config.agents) config.agents = {}
        if (!config.agents.list) config.agents.list = []

        const existingIdx = config.agents.list.findIndex((a: any) => a.id === agentId)
        const agentEntry = { id: agentId, ...agentData }

        if (existingIdx >= 0) {
            config.agents.list[existingIdx] = agentEntry
        } else {
            config.agents.list.push(agentEntry)
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        return c.json({ success: true, agent: agentEntry })
    } catch (error) {
        return c.json({ error: 'Failed to update agent' }, 500)
    }
})

// DELETE /api/routing/agents/:id - Remove an agent from agents.list
app.delete('/agents/:id', async (c) => {
    try {
        const agentId = c.req.param('id')

        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        if (config.agents?.list) {
            config.agents.list = config.agents.list.filter((a: any) => a.id !== agentId)
        }
        // Also remove bindings for this agent
        if (config.bindings) {
            config.bindings = config.bindings.filter((b: any) => b.agentId !== agentId)
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to delete agent' }, 500)
    }
})

// POST /api/routing/bindings - Add a new binding
app.post('/bindings/add', async (c) => {
    try {
        const binding = await c.req.json()

        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        if (!config.bindings) config.bindings = []
        config.bindings.push(binding)

        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        return c.json({ success: true, binding })
    } catch (error) {
        return c.json({ error: 'Failed to add binding' }, 500)
    }
})

// DELETE /api/routing/bindings/:index - Remove a binding by index
app.delete('/bindings/:index', async (c) => {
    try {
        const index = parseInt(c.req.param('index'))

        const configPath = path.join(process.env.HOME || '/root', '.openclaw/openclaw.json')
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)

        if (config.bindings && index >= 0 && index < config.bindings.length) {
            config.bindings.splice(index, 1)
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to remove binding' }, 500)
    }
})

// GET /api/routing/settings - Get mission control settings
app.get('/settings', async (c) => {
    try {
        const settingsPath = path.join(process.env.HOME || '/root', '.openclaw/mission-control-settings.json')
        const content = await fs.readFile(settingsPath, 'utf-8')
        return c.json(JSON.parse(content))
    } catch {
        return c.json({
            terminalWhitelist: { enabled: false },
            autoRefresh: { enabled: true, interval: 30 }
        })
    }
})

// PUT /api/routing/settings - Update mission control settings
app.put('/settings', async (c) => {
    try {
        const settings = await c.req.json()
        const settingsPath = path.join(process.env.HOME || '/root', '.openclaw/mission-control-settings.json')
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2))
        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to save settings' }, 500)
    }
})

function findDefaultAgent(config: any): string {
    const list = config.agents?.list || []
    const defaultAgent = list.find((a: any) => a.default === true)
    return defaultAgent?.id || list[0]?.id || 'main'
}

export const routingRoutes = app
