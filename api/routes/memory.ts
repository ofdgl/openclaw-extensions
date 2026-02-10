import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/memory - List memory files
app.get('/', async (c) => {
    try {
        const memoryDirs = [
            path.join(process.env.HOME || '/root', '.openclaw/memory'),
            path.join(process.env.HOME || '/root', '.openclaw/agents/main/memory')
        ]

        const files: any[] = []

        for (const memoryDir of memoryDirs) {
            try {
                await fs.access(memoryDir)
                const dirFiles = await fs.readdir(memoryDir)

                for (const file of dirFiles) {
                    const filePath = path.join(memoryDir, file)
                    const stat = await fs.stat(filePath)

                    if (stat.isFile()) {
                        files.push({
                            id: file,
                            name: file,
                            path: filePath,
                            size: stat.size,
                            modified: stat.mtime.toISOString(),
                            type: file.endsWith('.md') ? 'markdown' : 'text'
                        })
                    }
                }
            } catch {
                // Directory doesn't exist, skip
            }
        }

        return c.json({ files })
    } catch (error) {
        console.error('Failed to fetch memory files:', error)
        return c.json({ files: [] })
    }
})

// GET /api/memory/:id - Get file content
app.get('/:id', async (c) => {
    try {
        const fileName = c.req.param('id')
        const memoryDirs = [
            path.join(process.env.HOME || '/root', '.openclaw/memory'),
            path.join(process.env.HOME || '/root', '.openclaw/agents/main/memory')
        ]

        for (const memoryDir of memoryDirs) {
            try {
                const filePath = path.join(memoryDir, fileName)
                const content = await fs.readFile(filePath, 'utf-8')
                return c.json({ content })
            } catch {
                // Try next directory
            }
        }

        return c.json({ error: 'File not found' }, 404)
    } catch (error) {
        return c.json({ error: 'Failed to read file' }, 500)
    }
})

export const memoryRoutes = app
