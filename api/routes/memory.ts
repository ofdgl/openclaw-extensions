import { Hono } from 'hono'

const app = new Hono()

// Mock memory files
const mockFiles = [
    { path: 'memory/2026-02-10.md', type: 'daily', size: 2048, modified: new Date().toISOString() },
    { path: 'SOUL.md', type: 'shared', size: 4096, modified: new Date(Date.now() - 86400000).toISOString() },
    { path: 'workspace-main/SOUL.md', type: 'agent', size: 3072, modified: new Date(Date.now() - 172800000).toISOString() }
]

const mockContent = {
    'memory/2026-02-10.md': '# Daily Log - 2026-02-10\n\n## Activities\n- Handled 15 user requests\n- Token usage: 12,500\n\n## Notable Events\n- Implemented new features',
    'SOUL.md': '# Shared Memory\n\nThis is the main agent memory...',
    'workspace-main/SOUL.md': '# Main Agent Soul\n\nI am responsible for...'
}

// GET /api/memory/files - List memory files
app.get('/files', (c) => {
    const type = c.req.query('type')

    let files = [...mockFiles]
    if (type) {
        files = files.filter(f => f.type === type)
    }

    return c.json({ files })
})

// GET /api/memory/content - Get file content
app.get('/content', (c) => {
    const filePath = c.req.query('path')

    if (!filePath) {
        return c.json({ error: 'Path required' }, 400)
    }

    const content = mockContent[filePath as keyof typeof mockContent]

    if (!content) {
        return c.json({ error: 'File not found' }, 404)
    }

    return c.json({ path: filePath, content })
})

export const memoryRoutes = app
