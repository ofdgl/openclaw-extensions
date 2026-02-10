import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/memory - List all workspace and memory files
// Checks: ~/.openclaw/workspace/, ~/.openclaw-kamino/workspaces/*, ~/.openclaw-active/souls/
app.get('/', async (c) => {
    try {
        const home = process.env.HOME || '/root'
        const files: any[] = []

        // 1. Main workspace files (SOUL.md, etc)
        const mainWorkspace = path.join(home, '.openclaw/workspace')
        await scanDir(mainWorkspace, files, 'Main Workspace')

        // 2. Agent workspaces
        const kaminoWorkspaces = path.join(home, '.openclaw-kamino/workspaces')
        try {
            const agents = await fs.readdir(kaminoWorkspaces)
            for (const agent of agents) {
                const agentDir = path.join(kaminoWorkspaces, agent)
                await scanDir(agentDir, files, `Agent: ${agent}`)
                // Also check memory subdirectory
                await scanDir(path.join(agentDir, 'memory'), files, `Agent: ${agent}/memory`)
            }
        } catch { }

        // 3. Active workspaces
        const activeWorkspaces = path.join(home, '.openclaw-active/workspaces')
        try {
            const agents = await fs.readdir(activeWorkspaces)
            for (const agent of agents) {
                const agentDir = path.join(activeWorkspaces, agent)
                await scanDir(agentDir, files, `Active: ${agent}`)
                await scanDir(path.join(agentDir, 'memory'), files, `Active: ${agent}/memory`)
            }
        } catch { }

        // 4. SOUL files
        const soulsDir = path.join(home, '.openclaw-active/souls')
        await scanDir(soulsDir, files, 'SOULs')

        return c.json({
            files,
            message: files.length === 0 ? 'No workspace files found' : `${files.length} files found`
        })
    } catch (error) {
        console.error('Failed to fetch memory files:', error)
        return c.json({ files: [], message: 'Error reading workspace directories' })
    }
})

// Helper: scan a directory for readable files (skip .git, .sqlite, node_modules)
async function scanDir(dirPath: string, files: any[], source: string) {
    try {
        await fs.access(dirPath)
        const dirFiles = await fs.readdir(dirPath)

        for (const file of dirFiles) {
            // Skip hidden dirs, git, sqlite, node_modules
            if (file.startsWith('.') || file.endsWith('.sqlite') || file.endsWith('.db') || file === 'node_modules') continue

            const filePath = path.join(dirPath, file)
            try {
                const stat = await fs.stat(filePath)
                if (stat.isFile() && stat.size < 500000) { // Skip files > 500KB
                    const ext = path.extname(file).toLowerCase()
                    let type = 'file'
                    if (ext === '.md') type = 'markdown'
                    else if (ext === '.txt') type = 'text'
                    else if (ext === '.json') type = 'json'
                    else if (ext === '.yaml' || ext === '.yml') type = 'yaml'
                    else if (ext === '.ts' || ext === '.js') type = 'code'

                    files.push({
                        id: `${source}/${file}`,
                        name: file,
                        path: filePath,
                        size: stat.size,
                        modified: stat.mtime.toISOString(),
                        type,
                        source
                    })
                }
            } catch { }
        }
    } catch { }
}

// GET /api/memory/:id - Get file content (base64 encoded path)
app.get('/content', async (c) => {
    try {
        const filePath = c.req.query('path')
        if (!filePath) {
            return c.json({ error: 'Path parameter required' }, 400)
        }

        // Security: only allow reading from openclaw dirs
        const home = process.env.HOME || '/root'
        if (!filePath.startsWith(path.join(home, '.openclaw'))) {
            return c.json({ error: 'Access denied' }, 403)
        }

        const content = await fs.readFile(filePath, 'utf-8')
        return c.json({ content, path: filePath })
    } catch (error) {
        return c.json({ error: 'File not found or not readable' }, 404)
    }
})

export const memoryRoutes = app
