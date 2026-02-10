import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'yaml'

const app = new Hono()

// GET /api/cron/jobs - List all cron jobs
app.get('/jobs', async (c) => {
    try {
        const cronDir = path.join(process.env.HOME || '/root', '.openclaw/cron')

        try {
            await fs.access(cronDir)
        } catch {
            return c.json({ jobs: [] })
        }

        const files = await fs.readdir(cronDir)
        const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))

        const jobs = []

        for (const file of yamlFiles) {
            try {
                const content = await fs.readFile(path.join(cronDir, file), 'utf-8')
                const config = yaml.parse(content)

                jobs.push({
                    id: path.basename(file, path.extname(file)),
                    name: config.name || file,
                    schedule: config.schedule || config.cron || '* * * * *',
                    enabled: config.enabled !== false,
                    lastRun: config.lastRun || null,
                    nextRun: null, // Calculate later if needed
                    agent: config.agent || 'main-agent'
                })
            } catch (e) {
                console.error(`Failed to parse cron file ${file}:`, e)
            }
        }

        return c.json({ jobs })
    } catch (error) {
        console.error('Failed to fetch cron jobs:', error)
        return c.json({ jobs: [] })
    }
})

// POST /api/cron/:id/trigger - Manual trigger (placeholder)
app.post('/:id/trigger', (c) => {
    return c.json({ success: true })
})

// PATCH /api/cron/:id - Update job (placeholder)
app.patch('/:id', async (c) => {
    return c.json({ success: true })
})

export const cronRoutes = app
