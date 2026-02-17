import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/logviewer/files - List available log files
app.get('/files', async (c) => {
    try {
        const home = process.env.HOME || '/root'
        const logFiles: string[] = []

        // 1. Check ~/.openclaw/logs/
        const logsDir = path.join(home, '.openclaw/logs')
        try {
            const files = await fs.readdir(logsDir)
            logFiles.push(...files.filter(f => f.endsWith('.log') || f.endsWith('.jsonl')))
        } catch { }

        // 2. Check for docker logs availability
        logFiles.push('docker:openclaw') // Docker container logs

        // 3. API serve log
        try {
            await fs.access('/tmp/serve.log')
            logFiles.push('serve.log')
        } catch { }

        return c.json({ files: logFiles.length > 0 ? logFiles : ['gateway.log'] })
    } catch (error) {
        return c.json({ files: ['gateway.log'] })
    }
})

// GET /api/logviewer/tail?file=gateway.log&lines=100 - Tail log file
app.get('/tail', async (c) => {
    try {
        const filename = c.req.query('file') || 'gateway.log'
        const lines = parseInt(c.req.query('lines') || '100')

        // Security: prevent path traversal
        if (filename.includes('..')) {
            return c.json({ error: 'Invalid filename' }, 400)
        }

        const home = process.env.HOME || '/root'
        let content = ''

        if (filename.startsWith('docker:')) {
            // Docker container logs
            const containerName = filename.replace('docker:', '')
            try {
                const { exec } = await import('child_process')
                const { promisify } = await import('util')
                const execAsync = promisify(exec)
                const result = await execAsync(`docker logs --tail ${lines} ${containerName} 2>&1`, {
                    timeout: 5000,
                    maxBuffer: 1024 * 1024
                })
                content = result.stdout || result.stderr || ''
            } catch (e: any) {
                content = e.message || 'Failed to read docker logs'
            }
        } else if (filename === 'serve.log') {
            try {
                content = await fs.readFile('/tmp/serve.log', 'utf-8')
            } catch {
                content = ''
            }
        } else {
            // Regular log file
            const logPath = path.join(home, '.openclaw/logs', filename)
            try {
                content = await fs.readFile(logPath, 'utf-8')
            } catch {
                return c.json({ entries: [] })
            }
        }

        const allLines = content.trim().split('\n').filter(l => l.trim())
        const tailedLines = allLines.slice(-lines)

        // Parse log entries
        const entries = tailedLines.map((line) => {
            // Try JSONL format
            try {
                const parsed = JSON.parse(line)
                return {
                    time: parsed.timestamp || parsed.time || parsed.ts || new Date().toISOString(),
                    level: parsed.level || parsed.severity || 'info',
                    message: parsed.message || parsed.msg || JSON.stringify(parsed),
                    source: filename.replace('.log', '').replace('.jsonl', '').replace('docker:', '')
                }
            } catch { }

            // Try [timestamp] [level] message format
            const match = line.match(/\[(.*?)\]\s*\[(.*?)\]\s*(.*)/)
            if (match) {
                return {
                    time: match[1],
                    level: match[2].toLowerCase(),
                    message: match[3],
                    source: filename.replace('.log', '')
                }
            }

            // Try timestamp - message format
            const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*Z?)\s+(.*)/)
            if (tsMatch) {
                const msg = tsMatch[2]
                let level = 'info'
                if (msg.includes('ERROR') || msg.includes('error')) level = 'error'
                else if (msg.includes('WARN') || msg.includes('warn')) level = 'warn'
                return { time: tsMatch[1], level, message: msg, source: filename.replace('.log', '') }
            }

            // Fallback: simple line
            let level = 'info'
            if (line.includes('error') || line.includes('ERROR')) level = 'error'
            else if (line.includes('warn') || line.includes('WARN')) level = 'warn'
            return {
                time: new Date().toISOString(),
                level,
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
