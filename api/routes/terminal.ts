import { Hono } from 'hono'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const app = new Hono()

// Dangerous patterns that are ALWAYS blocked
const BLOCKED_PATTERNS = [
    'rm -rf /',
    'mkfs',
    ':(){:|:&};:',
    '> /dev/sda',
    'dd if=',
    'wget.*|.*sh',
    'curl.*|.*sh',
]

// POST /api/terminal/exec - Execute command on VPS
// Whitelist is toggleable via settings; when off, only blocks dangerous patterns
app.post('/exec', async (c) => {
    try {
        const { command } = await c.req.json()

        if (!command || typeof command !== 'string') {
            return c.json({ error: 'Invalid command' }, 400)
        }

        // Always block dangerous patterns
        const isBlocked = BLOCKED_PATTERNS.some(pattern =>
            command.toLowerCase().includes(pattern.toLowerCase())
        )
        if (isBlocked) {
            return c.json({ error: 'Command blocked for security reasons' }, 403)
        }

        // Check if whitelist mode is enabled in settings
        const home = process.env.HOME || '/root'
        let whitelistEnabled = false
        try {
            const settingsPath = path.join(home, '.openclaw/mission-control-settings.json')
            const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'))
            whitelistEnabled = settings.terminalWhitelist?.enabled ?? false
        } catch {
            // No settings file = whitelist disabled by default
        }

        if (whitelistEnabled) {
            // Whitelist mode: only predefined commands allowed
            const allowedCommands = [
                'openclaw', 'ps aux', 'tail', 'cat', 'ls', 'head',
                'docker ps', 'docker logs', 'docker restart',
                'systemctl status', 'systemctl restart',
                'ss -tlnp', 'df -h', 'free -h', 'uptime',
                'wc -l', 'du -sh', 'grep', 'find',
            ]
            const isAllowed = allowedCommands.some(allowed =>
                command.trim().startsWith(allowed)
            )
            if (!isAllowed) {
                return c.json({
                    error: `Command not whitelisted. Disable whitelist in Settings → Terminal, or use one of:\n${allowedCommands.map(c => `  • ${c}`).join('\n')}`
                }, 403)
            }
        }

        const { stdout, stderr } = await execAsync(command, {
            timeout: 10000,
            cwd: home,
            maxBuffer: 1024 * 1024 // 1MB
        })

        return c.json({
            success: true,
            output: stdout || stderr || 'Command executed successfully'
        })
    } catch (error: any) {
        return c.json({
            success: false,
            output: error.stderr || error.message || 'Command execution failed'
        })
    }
})

export const terminalRoutes = app
