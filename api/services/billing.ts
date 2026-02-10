import fs from 'fs/promises'
import path from 'path'

export interface BillingEntry {
    timestamp: string
    user: string
    phone: string
    model: string
    inputTokens: number
    outputTokens: number
    toolTokens: number
    totalTokens: number
    cost: number
    session: string
}

/**
 * Parse billing tracker logs
 * Assumes logs are in ~/.openclaw/logs/billing-tracker.log
 * Format: [timestamp] user:phone model:model_name input:N output:N tool:N cost:N session:session_id
 */
export async function parseBillingLogs(limit = 1000): Promise<BillingEntry[]> {
    try {
        const logPath = path.join(process.env.HOME || '/root', '.openclaw/logs/billing-tracker.log')

        // Check if file exists first
        try {
            await fs.access(logPath)
        } catch {
            // File doesn't exist yet - return empty array
            console.log('Billing log not found, returning empty array')
            return []
        }

        const content = await fs.readFile(logPath, 'utf-8')

        const lines = content.trim().split('\n').slice(-limit)
        const entries: BillingEntry[] = []

        for (const line of lines) {
            const match = line.match(/\[(.*?)\] user:(.*?) phone:(.*?) model:(.*?) input:(\d+) output:(\d+) tool:(\d+) cost:([\d.]+) session:(.*?)$/)

            if (match) {
                entries.push({
                    timestamp: match[1],
                    user: match[2],
                    phone: match[3],
                    model: match[4],
                    inputTokens: parseInt(match[5]),
                    outputTokens: parseInt(match[6]),
                    toolTokens: parseInt(match[7]),
                    totalTokens: parseInt(match[5]) + parseInt(match[6]) + parseInt(match[7]),
                    cost: parseFloat(match[8]),
                    session: match[9],
                })
            }
        }

        return entries.reverse() // Most recent first
    } catch (error) {
        console.error('Error parsing billing logs:', error)
        return []
    }
}

/**
 * Get cost summary for a time period
 */
export async function getCostSummary(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const entries = await parseBillingLogs()

    const now = new Date()
    const cutoff = new Date()

    if (period === 'daily') cutoff.setHours(0, 0, 0, 0)
    else if (period === 'weekly') cutoff.setDate(now.getDate() - 7)
    else cutoff.setDate(now.getDate() - 30)

    const filtered = entries.filter(e => new Date(e.timestamp) >= cutoff)

    const totalTokens = filtered.reduce((sum, e) => sum + e.totalTokens, 0)
    const totalCost = filtered.reduce((sum, e) => sum + e.cost, 0)

    // Model breakdown
    const byModel: Record<string, { tokens: number; cost: number; count: number }> = {}
    filtered.forEach(e => {
        if (!byModel[e.model]) byModel[e.model] = { tokens: 0, cost: 0, count: 0 }
        byModel[e.model].tokens += e.totalTokens
        byModel[e.model].cost += e.cost
        byModel[e.model].count++
    })

    return {
        period,
        totalTokens,
        totalCost,
        requestCount: filtered.length,
        byModel,
        entries: filtered.slice(0, 100) // Last 100 for display
    }
}

/**
 * Get activity heatmap (hour x day)
 */
export async function getActivityHeatmap(days = 7) {
    const entries = await parseBillingLogs()

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const filtered = entries.filter(e => new Date(e.timestamp) >= cutoff)

    // Initialize 7 days x 24 hours grid
    const heatmap = Array.from({ length: days }, () => Array(24).fill(0))

    filtered.forEach(e => {
        const date = new Date(e.timestamp)
        const dayOffset = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
        const hour = date.getHours()

        if (dayOffset < days) {
            heatmap[days - 1 - dayOffset][hour] += e.totalTokens
        }
    })

    return heatmap
}
