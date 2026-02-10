import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/hooks - List all hooks
app.get('/', async (c) => {
    try {
        const hooksDir = path.join(process.env.HOME || '/root', '.openclaw/hooks')

        try {
            await fs.access(hooksDir)
        } catch {
            return c.json({ hooks: [] })
        }

        const hookNames = await fs.readdir(hooksDir)
        const hooks = []

        for (const name of hookNames) {
            const hookPath = path.join(hooksDir, name)
            const stat = await fs.stat(hookPath)

            if (stat.isDirectory()) {
                // Check for handler.ts or index.ts
                let enabled = false
                try {
                    await fs.access(path.join(hookPath, 'handler.ts'))
                    enabled = true
                } catch {
                    try {
                        await fs.access(path.join(hookPath, 'index.ts'))
                        enabled = true
                    } catch { }
                }

                hooks.push({
                    id: name,
                    name,
                    enabled,
                    description: `Hook: ${name}`,
                    executions: 0
                })
            }
        }

        return c.json({ hooks })
    } catch (error) {
        console.error('Failed to fetch hooks:', error)
        return c.json({ hooks: [] })
    }
})

app.patch('/:id', async (c) => c.json({ success: true }))

export const hooksRoutes = app
