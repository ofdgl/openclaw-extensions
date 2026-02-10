import { Hono } from 'hono'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const app = new Hono()

// POST /api/terminal/exec - Execute command on VPS
app.post('/exec', async (c) => {
    try {
        const { command } = await c.req.json()

        if (!command || typeof command !== 'string') {
            return c.json({ error: 'Invalid command' }, 400)
        }

        // Whitelist allowed commands for security
        const allowedCommands = [
            'openclaw status',
            'openclaw',
            'ps aux | grep openclaw',
            'ps aux | grep tsx',
            'tail -20 ~/.openclaw/gateway.log',
            'tail -50 ~/.openclaw/gateway.log',
            'tail -100 ~/.openclaw/gateway.log',
            'ls -la ~/.openclaw/',
            'ls -la ~/.openclaw',
            'ls ~/.openclaw/hooks',
            'cat ~/.openclaw/.env | grep MODE',
            'cat ~/.openclaw/.env'
        ]

        const isAllowed = allowedCommands.some(allowed => command.trim().startsWith(allowed))

        if (!isAllowed) {
            return c.json({
                error: `Command not whitelisted: "${command}"\n\nAllowed commands:\n${allowedCommands.map(c => `  • ${c}`).join('\n')}`
            }, 403)
        }

        const { stdout, stderr } = await execAsync(command, {
            timeout: 5000,
            cwd: process.env.HOME || '/root'
        })

        return c.json({
            success: true,
            output: stdout || stderr || 'Command executed successfully'
        })
    } catch (error: any) {
        return c.json({
            success: false,
            output: error.message || 'Command execution failed'
        })
    }
})

export const terminalRoutes = app
