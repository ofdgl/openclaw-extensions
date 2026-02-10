import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/memory - List memory files
app.get('/', async (c) => {
    try {
        const memoryDir = path.join(process.env.HOME || '/root', '.openclaw/memory')

        const files: any[] = []

        try {
            await fs.access(memoryDir)
            const dirFiles = await fs.readdir(memoryDir)

            for (const file of dirFiles) {
                // Skip sqlite files
                if (file.endsWith('.sqlite') || file.endsWith('.db')) {
                    continue
                }

                const filePath = path.join(memoryDir, file)
                try {
                    const stat = await fs.stat(filePath)

                    if (stat.isFile()) {
                        files.push({
                            id: file,
                            name: file,
                            path: filePath,
                            size: stat.size,
                            modified: stat.mtime.toISOString(),
                            type: file.endsWith('.md') ? 'markdown' : file.endsWith('.txt') ? 'text' : 'file'
                        })
                    }
                } catch {
                    // Skip files that can't be read
                }
            }
        } catch {
            // Directory doesn't exist or not accessible
        }

        // If no files found, return helpful message
        if (files.length === 0) {
            return c.json({
                files: [],
                message: 'No memory files found. Memory directory contains only database files.'
            })
        }

        return c.json({ files })
    } catch (error) {
        console.error('Failed to fetch memory files:', error)
        return c.json({ files: [], message: 'Error reading memory directory' })
    }
})

// GET /api/memory/:id - Get file content
app.get('/:id', async (c) => {
    try {
        const fileName = c.req.param('id')
        const memoryDir = path.join(process.env.HOME || '/root', '.openclaw/memory')

        const filePath = path.join(memoryDir, fileName)

        try {
            const content = await fs.readFile(filePath, 'utf-8')
            return c.json({ content })
        } catch {
            return c.json({ error: 'File not found or not readable' }, 404)
        }
    } catch (error) {
        return c.json({ error: 'Failed to read file' }, 500)
    }
})

export const memoryRoutes = app
