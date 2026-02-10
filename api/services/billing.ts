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
 * Parse billing data from session JSONL files
 * Since billing-tracker.log doesn't exist, we extract usage data from session messages
 * Session files are in ~/.openclaw/agents/main/sessions/*.jsonl
 * Each message entry has: type:'message', message:{role}, and optionally usage info
 */
export async function parseBillingLogs(limit = 1000): Promise<BillingEntry[]> {
    try {
        const sessionsDir = path.join(process.env.HOME || '/root', '.openclaw/agents/main/sessions')
        const entries: BillingEntry[] = []

        let files: string[] = []
        try {
            files = (await fs.readdir(sessionsDir)).filter(f => f.endsWith('.jsonl') || f.endsWith('.json'))
        } catch {
            return []
        }

        for (const file of files) {
            try {
                const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8')
                const lines = content.trim().split('\n').filter(l => l.trim())
                const sessionId = file.replace('.jsonl', '').replace('.json', '')

                // Get model from model_change entry
                let sessionModel = 'unknown'
                for (const line of lines) {
                    try {
                        const d = JSON.parse(line)
                        if (d.type === 'model_change') {
                            sessionModel = d.modelId || d.provider || 'unknown'
                            break
                        }
                    } catch { }
                }

                // Extract assistant messages (they have token usage)
                for (const line of lines) {
                    try {
                        const d = JSON.parse(line)
                        if (d.type !== 'message') continue

                        const role = d.message?.role || ''
                        if (role !== 'assistant') continue

                        // Extract usage info
                        const usage = d.usage || d.message?.usage || {}
                        const inputTokens = usage.input_tokens || usage.prompt_tokens || 0
                        const outputTokens = usage.output_tokens || usage.completion_tokens || 0
                        const cacheRead = usage.cache_read_input_tokens || 0
                        const cacheCreation = usage.cache_creation_input_tokens || 0
                        const totalTokens = inputTokens + outputTokens + cacheRead + cacheCreation

                        // Estimate cost (rough pricing)
                        let costPer1k = 0.003 // Default
                        if (sessionModel.includes('sonnet-4-5')) costPer1k = 0.015
                        else if (sessionModel.includes('sonnet-4')) costPer1k = 0.003
                        else if (sessionModel.includes('haiku')) costPer1k = 0.001
                        else if (sessionModel.includes('opus')) costPer1k = 0.075
                        else if (sessionModel.includes('gemini')) costPer1k = 0.001
                        else if (sessionModel.includes('gpt-4o')) costPer1k = 0.005

                        const cost = (totalTokens / 1000) * costPer1k

                        entries.push({
                            timestamp: d.timestamp || new Date().toISOString(),
                            user: 'User',
                            phone: '',
                            model: sessionModel,
                            inputTokens,
                            outputTokens,
                            toolTokens: 0,
                            totalTokens,
                            cost,
                            session: sessionId.slice(0, 8)
                        })
                    } catch { }
                }
            } catch { }
        }

        // Sort by timestamp descending
        entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        return entries.slice(0, limit)
    } catch (error) {
        console.error('Error parsing session data for billing:', error)
        return []
    }
}

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
        entries: filtered.slice(0, 100)
    }
}

export async function getActivityHeatmap(days = 7) {
    const entries = await parseBillingLogs()

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const filtered = entries.filter(e => new Date(e.timestamp) >= cutoff)

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
