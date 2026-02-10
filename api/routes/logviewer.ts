import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/logviewer/files - List available log files
app.get('/files', async (c) => {
    try {
        const logsDir = path.join(process.env.HOME || '/root', '.openclaw/logs')

        try {
            await fs.access(logsDir)
        } catch {
            return c.json({ files: ['gateway.log'] }) // Default if no logs dir
        }

        const files = await fs.readdir(logsDir)
        const logFiles = files.filter(f => f.endsWith('.log') || f.endsWith('.jsonl'))

        return c.json({ files: logFiles })
    } catch (error) {
        return c.json({ files: [] })
    }
})

// GET /api/logviewer/tail?file=gateway.log&lines=100 - Tail log file
app.get('/tail', async (c) => {
    try {
        const filename = c.req.query('file') || 'gateway.log'
        const lines = parseInt(c.req.query('lines') || '100')

        const logPath = path.join(process.env.HOME || '/root', '.openclaw/logs', filename)

        // Security: prevent path traversal
        if (filename.includes('..') || filename.includes('/')) {
            return c.json({ error: 'Invalid filename' }, 400)
        }

        try {
            await fs.access(logPath)
        } catch {
            return c.json({ entries: [] })
        }

        const content = await fs.readFile(logPath, 'utf-8')
        const allLines = content.trim().split('\n')
        const tailedLines = allLines.slice(-lines)

        // Parse log entries
        const entries = tailedLines.map((line, idx) => {
            // Try to detect format: [timestamp] [level] message
            const match = line.match(/\[(.*?)\]\s*\[(.*?)\]\s*(.*)/)

            if (match) {
                return {
                    time: match[1],
                    level: match[2].toLowerCase(),
                    message: match[3],
                    source: filename.replace('.log', '')
                }
            }

            // Fallback: simple line
            return {
                time: new Date().toISOString(),
                level: 'info',
                message: line,
                source: filename.replace('.log', '')
            }
        })

        return c.json({ entries })
    } catch (error) {
        console.error('Failed to tail log:', error)
        return c.json({ entries: [] })
    }
})

export const logviewerRoutes = app
