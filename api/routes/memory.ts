import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/memory - List all workspace and memory files
// Scans: ~/.openclaw/workspace/, ~/.openclaw/workspace-*/, ~/.openclaw/agents/*/
app.get('/', async (c) => {
    try {
        const home = process.env.HOME || '/root'
        const files: any[] = []

        // 1. Main workspace files (SOUL.md, AGENTS.md, etc)
        const mainWorkspace = path.join(home, '.openclaw/workspace')
        await scanDir(mainWorkspace, files, 'Main Workspace')

        // 2. Main workspace memory subdirectory
        await scanDir(path.join(mainWorkspace, 'memory'), files, 'Main Workspace/memory')

        // 3. Per-agent workspaces (workspace-admin, workspace-demo etc)
        try {
            const openclawDir = path.join(home, '.openclaw')
            const entries = await fs.readdir(openclawDir)
            for (const entry of entries) {
                if (entry.startsWith('workspace-') && entry !== 'workspace') {
                    const agentName = entry.replace('workspace-', '')
                    const wsDir = path.join(openclawDir, entry)
                    await scanDir(wsDir, files, `Agent: ${agentName}`)
                    await scanDir(path.join(wsDir, 'memory'), files, `Agent: ${agentName}/memory`)
                    await scanDir(path.join(wsDir, 'skills'), files, `Agent: ${agentName}/skills`)
                }
            }
        } catch { }

        // 4. Agent state directories
        const agentsDir = path.join(home, '.openclaw/agents')
        try {
            const agents = await fs.readdir(agentsDir)
            for (const agent of agents) {
                const agentStateDir = path.join(agentsDir, agent, 'agent')
                await scanDir(agentStateDir, files, `Agent State: ${agent}`)
            }
        } catch { }

        // 5. Hooks directory
        const hooksDir = path.join(home, '.openclaw/hooks')
        try {
            const hooks = await fs.readdir(hooksDir)
            for (const hook of hooks) {
                const hookDir = path.join(hooksDir, hook)
                await scanDir(hookDir, files, `Hook: ${hook}`)
            }
        } catch { }

        // 6. Shared skills
        const sharedSkillsDir = path.join(home, '.openclaw/skills')
        await scanDir(sharedSkillsDir, files, 'Shared Skills')

        // 7. Logs directory
        const logsDir = path.join(home, '.openclaw/logs')
        await scanDir(logsDir, files, 'Logs')

        // 8. Config files
        const configFiles = [
            { path: path.join(home, '.openclaw/openclaw.json'), name: 'openclaw.json', source: 'Config' },
        ]
        for (const cf of configFiles) {
            try {
                const stat = await fs.stat(cf.path)
                files.push({
                    id: `Config/${cf.name}`,
                    name: cf.name,
                    path: cf.path,
                    size: stat.size,
                    modified: stat.mtime.toISOString(),
                    type: 'json',
                    source: cf.source
                })
            } catch { }
        }

        return c.json({
            files,
            message: files.length === 0 ? 'No workspace files found' : `${files.length} files found`
        })
    } catch (error) {
        console.error('Failed to fetch memory files:', error)
        return c.json({ files: [], message: 'Error reading workspace directories' })
    }
})

// Helper: recursively scan a directory for readable files
async function scanDir(dirPath: string, files: any[], source: string, depth = 0) {
    if (depth > 2) return // Max 2 levels deep
    try {
        await fs.access(dirPath)
        const dirFiles = await fs.readdir(dirPath)

        for (const file of dirFiles) {
            // Skip hidden dirs, git, sqlite, node_modules, lock files
            if (file.startsWith('.') || file === 'node_modules' || file === 'dist'
                || file.endsWith('.sqlite') || file.endsWith('.db')
                || file === 'package-lock.json') continue

            const filePath = path.join(dirPath, file)
            try {
                const stat = await fs.stat(filePath)

                if (stat.isDirectory() && depth < 2) {
                    await scanDir(filePath, files, `${source}/${file}`, depth + 1)
                } else if (stat.isFile() && stat.size < 500000) { // Skip files > 500KB
                    const ext = path.extname(file).toLowerCase()
                    let type = 'file'
                    if (ext === '.md') type = 'markdown'
                    else if (ext === '.txt') type = 'text'
                    else if (ext === '.json') type = 'json'
                    else if (ext === '.yaml' || ext === '.yml') type = 'yaml'
                    else if (ext === '.ts' || ext === '.js') type = 'code'
                    else if (ext === '.jsonl') type = 'log'
                    else if (ext === '.log') type = 'log'

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

// GET /api/memory/content - Get file content
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
