import { Hono } from 'hono'

const app = new Hono()

// Mock agents data
const mockAgents = [
    { id: 'main-agent', name: 'Main Agent', status: 'active', workspace: 'workspace-main', model: 'claude-sonnet', sessions: 2, outputs: 15 },
    { id: 'guest-agent', name: 'Guest Agent', status: 'idle', workspace: 'workspace-guest', model: 'gemini-flash', sessions: 0, outputs: 8 },
    { id: 'security-agent', name: 'Security Agent', status: 'idle', workspace: 'workspace-security', model: 'claude-haiku', sessions: 0, outputs: 3 }
]

const mockOutputs = {
    'main-agent': [
        { id: '1', timestamp: new Date().toISOString(), type: 'response', content: 'Generated response for user', tokens: 500 },
        { id: '2', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'analysis', content: 'Security analysis complete', tokens: 800 }
    ]
}

const mockMemory = {
    'main-agent': { soul: '# Main Agent SOUL\n\nI am the primary agent...', daily: '# 2026-02-10\n\nToday I helped with...' }
}

// GET /api/agents - List all agents
app.get('/', (c) => {
    return c.json({ agents: mockAgents })
})

// GET /api/agents/:id/outputs - Agent outputs
app.get('/:id/outputs', (c) => {
    const id = c.req.param('id')
    const outputs = mockOutputs[id as keyof typeof mockOutputs] || []

    return c.json({ outputs })
})

// GET /api/agents/:id/memory - Agent memory files
app.get('/:id/memory', (c) => {
    const id = c.req.param('id')
    const memory = mockMemory[id as keyof typeof mockMemory] || { soul: '', daily: '' }

    return c.json(memory)
})

export const agentsRoutes = app
