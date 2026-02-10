import { Hono } from 'hono'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const app = new Hono()

// GET /api/security/events - Get security events
app.get('/events', async (c) => {
    try {
        const events: any[] = []

        // 1. Failed SSH attempts from auth.log
        try {
            const { stdout } = await execAsync("grep 'Failed password' /var/log/auth.log | tail -50")
            const lines = stdout.trim().split('\n').filter(l => l)

            lines.forEach(line => {
                const match = line.match(/(\w+\s+\d+\s+[\d:]+).*Failed password.*from ([\d.]+)/)
                if (match) {
                    events.push({
                        timestamp: match[1],
                        type: 'failed_login',
                        severity: 'warning',
                        source: match[2],
                        description: 'Failed SSH login attempt'
                    })
                }
            })
        } catch { }

        // 2. Fail2ban bans
        try {
            const { stdout } = await execAsync("grep 'Ban' /var/log/fail2ban.log 2>/dev/null | tail -30")
            const lines = stdout.trim().split('\n').filter(l => l)

            lines.forEach(line => {
                const match = line.match(/([\d-]+\s+[\d:,]+).*Ban ([\d.]+)/)
                if (match) {
                    events.push({
                        timestamp: match[1],
                        type: 'ip_banned',
                        severity: 'high',
                        source: match[2],
                        description: `IP banned by Fail2ban`
                    })
                }
            })
        } catch { }

        // 3. OpenClaw security events
        try {
            const securityLog = path.join(process.env.HOME || '/root', '.openclaw/logs/security.jsonl')
            const content = await fs.readFile(securityLog, 'utf-8')
            const lines = content.trim().split('\n').filter(l => l)

            lines.slice(-50).forEach(line => {
                try {
                    const event = JSON.parse(line)
                    events.push({
                        timestamp: event.timestamp || new Date().toISOString(),
                        type: event.type || 'security_event',
                        severity: event.severity || 'info',
                        source: event.source || 'unknown',
                        description: event.message || event.description || 'Security event'
                    })
                } catch { }
            })
        } catch { }

        // Sort by timestamp (newest first)
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        return c.json({ events: events.slice(0, 100) })
    } catch (error) {
        console.error('Failed to fetch security events:', error)
        return c.json({ events: [] })
    }
})

// GET /api/security/ports - Get open ports
app.get('/ports', async (c) => {
    try {
        const { stdout } = await execAsync("netstat -tuln | grep LISTEN")
        const lines = stdout.trim().split('\n')

        const ports = lines.map(line => {
            const parts = line.trim().split(/\s+/)
            const localAddress = parts[3] || ''
            const [ip, port] = localAddress.split(':')

            return {
                port: port || 'unknown',
                protocol: parts[0] || 'tcp',
                address: ip || '0.0.0.0',
                service: getServiceName(port)
            }
        }).filter(p => p.port !== 'unknown')

        return c.json({ ports })
    } catch (error) {
        return c.json({ ports: [] })
    }
})

// GET /api/security/stats - Get security statistics
app.get('/stats', async (c) => {
    try {
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
            securityEvents = content.trim().split('\n').filter(l => l).length
        } catch { }

        return c.json({
            failedLogins,
            bannedIPs,
            securityEvents,
            openPorts: 0 // Will be counted separately
        })
    } catch (error) {
        return c.json({ failedLogins: 0, bannedIPs: 0, securityEvents: 0, openPorts: 0 })
    }
})

function getServiceName(port: string): string {
    const services: Record<string, string> = {
        '22': 'SSH',
        '80': 'HTTP (UI)',
        '443': 'HTTPS',
        '3000': 'OpenClaw Gateway',
        '3001': 'Kamino API',
        '18789': 'Unknown Service'
    }
    return services[port] || `Port ${port}`
}

export const securityRoutes = app
