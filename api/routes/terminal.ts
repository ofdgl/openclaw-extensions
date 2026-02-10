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
            'ps aux | grep openclaw',
            'tail -20 ~/.openclaw/gateway.log',
            'ls -la ~/.openclaw/',
            'cat ~/.openclaw/.env | grep MODE'
        ]

        const isAllowed = allowedCommands.some(allowed => command.startsWith(allowed))

        if (!isAllowed) {
            return c.json({ error: 'Command not allowed. Use predefined fast commands.' }, 403)
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
