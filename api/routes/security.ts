import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const app = new Hono()

// GET /api/security/events - Get security events from security.jsonl + auth.log
app.get('/events', async (c) => {
    const events: any[] = []

    // 1. OpenClaw security events from ~/.openclaw/logs/security.jsonl
    try {
        const securityLog = path.join(process.env.HOME || '/root', '.openclaw/logs/security.jsonl')
        const content = await fs.readFile(securityLog, 'utf-8')
        const lines = content.trim().split('\n').filter(l => l.trim())

        // Take last 100 events
        const recentLines = lines.slice(-100)

        for (const line of recentLines) {
            try {
                const event = JSON.parse(line)
                events.push({
                    timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
                    type: event.type || 'unknown',
                    severity: getSeverity(event.type),
                    source: event.session_key || event.agent || 'system',
                    description: formatEventDescription(event)
                })
            } catch { }
        }
    } catch (e) {
        console.error('Failed to read security.jsonl:', e)
    }

    // 2. Failed SSH attempts from auth.log
    try {
        const { stdout } = await execAsync("grep 'Failed password' /var/log/auth.log 2>/dev/null | tail -30")
        const lines = stdout.trim().split('\n').filter(l => l)

        for (const line of lines) {
            const match = line.match(/(\w+\s+\d+\s+[\d:]+).*Failed password.*from ([\d.]+)/)
            if (match) {
                events.push({
                    timestamp: match[1],
                    type: 'failed_login',
                    severity: 'warning',
                    source: match[2],
                    description: `Failed SSH login attempt from ${match[2]}`
                })
            }
        }
    } catch { }

    // 3. Fail2ban bans
    try {
        const { stdout } = await execAsync("grep 'Ban' /var/log/fail2ban.log 2>/dev/null | tail -20")
        const lines = stdout.trim().split('\n').filter(l => l)

        for (const line of lines) {
            const match = line.match(/([\d-]+\s+[\d:,]+).*Ban\s+([\d.]+)/)
            if (match) {
                events.push({
                    timestamp: match[1],
                    type: 'ip_banned',
                    severity: 'high',
                    source: match[2],
                    description: `IP ${match[2]} banned by Fail2ban`
                })
            }
        }
    } catch { }

    // Sort by timestamp descending
    events.sort((a, b) => {
        try {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        } catch {
            return 0
        }
    })

    return c.json({ events })
})

// GET /api/security/ports - List open ports
app.get('/ports', async (c) => {
    try {
        const { stdout } = await execAsync("ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null")
        const lines = stdout.trim().split('\n').filter(l => l.includes('LISTEN'))

        const ports = lines.map(line => {
            const parts = line.trim().split(/\s+/)
            // ss format: State  Recv-Q  Send-Q  Local  Peer  Process
            // netstat format: Proto  Recv-Q  Send-Q  Local  Foreign  State  PID
            let localAddr = ''
            if (line.includes('ss')) {
                localAddr = parts[3] || ''
            } else {
                localAddr = parts[3] || ''
            }

            // Extract port from address (could be *:port, 0.0.0.0:port, :::port)
            const portMatch = localAddr.match(/:(\d+)$/)
            const port = portMatch ? portMatch[1] : 'unknown'
            const address = localAddr.replace(`:${port}`, '') || '0.0.0.0'

            return {
                port,
                protocol: parts[0]?.includes('udp') ? 'udp' : 'tcp',
                address,
                service: getServiceName(port)
            }
        }).filter(p => p.port !== 'unknown')

        // Deduplicate by port
        const uniquePorts = Array.from(new Map(ports.map(p => [p.port, p])).values())

        return c.json({ ports: uniquePorts })
    } catch (error) {
        console.error('Failed to get ports:', error)
        return c.json({ ports: [] })
    }
})

// GET /api/security/stats - Security statistics
app.get('/stats', async (c) => {
    let failedLogins = 0
    let bannedIPs = 0
    let securityEvents = 0

    try {
        const { stdout } = await execAsync("grep -c 'Failed password' /var/log/auth.log 2>/dev/null || echo 0")
        failedLogins = parseInt(stdout.trim()) || 0
    } catch { }

    try {
        const { stdout } = await execAsync("grep -c 'Ban' /var/log/fail2ban.log 2>/dev/null || echo 0")
        bannedIPs = parseInt(stdout.trim()) || 0
    } catch { }

    try {
        const securityLog = path.join(process.env.HOME || '/root', '.openclaw/logs/security.jsonl')
        const content = await fs.readFile(securityLog, 'utf-8')
        securityEvents = content.trim().split('\n').filter(l => l.trim()).length
    } catch { }

    return c.json({ failedLogins, bannedIPs, securityEvents })
})

// Helper functions
function getSeverity(type: string): string {
    switch (type) {
        case 'loop_detected': return 'warning'
        case 'rate_limit_exceeded': return 'high'
        case 'blocked_access': return 'high'
        case 'failed_login': return 'warning'
        case 'ip_banned': return 'critical'
        default: return 'low'
    }
}

function formatEventDescription(event: any): string {
    switch (event.type) {
        case 'loop_detected':
            return `Loop detected in ${event.session_key || 'unknown session'} (${Math.round((event.duration_ms || 0) / 1000)}s, timeout: ${Math.round((event.timeout_ms || 0) / 1000)}s)`
        case 'rate_limit_exceeded':
            return `Rate limit exceeded for ${event.user || event.phone || 'unknown'}`
        case 'blocked_access':
            return `Blocked access attempt from ${event.source || 'unknown'}`
        default:
            return event.message || event.description || `${event.type} event`
    }
}

function getServiceName(port: string): string {
    const services: Record<string, string> = {
        '22': 'SSH',
        '80': 'HTTP (UI)',
        '443': 'HTTPS',
        '3001': 'API Server',
        '5432': 'PostgreSQL',
        '6379': 'Redis',
        '8080': 'Alt HTTP',
        '18789': 'OpenClaw Gateway',
        '3000': 'Node.js',
        '25': 'SMTP',
        '53': 'DNS',
    }
    return services[port] || `Port ${port}`
}

export const securityRoutes = app
