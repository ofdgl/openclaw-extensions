import fs from 'fs/promises'
import path from 'path'

export interface BillingEntry {
    timestamp: string
    user: string
    phone: string
    model: string
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheCreationTokens: number
    totalTokens: number
    cost: number
    session: string
    role: string
    content: string
    channel: string
    agentId: string
}

// ============================================================
// MODEL PRICING — Last updated: February 2026
// All prices in USD per 1M tokens
// Cache multipliers: Anthropic 0.10x, OpenAI 0.50x, Gemini 0.10x
// ============================================================
const MODEL_PRICING: Record<string, { input: number; output: number; cacheReadMultiplier?: number }> = {

    // ── ANTHROPIC CLAUDE ──────────────────────────────────────
    // Claude 4.5 Series (current, best value)
    'claude-opus-4-5': { input: 5.00, output: 25.00, cacheReadMultiplier: 0.10 },
    'claude-sonnet-4-5': { input: 3.00, output: 15.00, cacheReadMultiplier: 0.10 },
    'claude-haiku-4-5': { input: 1.00, output: 5.00, cacheReadMultiplier: 0.10 },

    // Claude 4 / 4.1 Series (legacy — expensive)
    'claude-opus-4-1': { input: 15.00, output: 75.00, cacheReadMultiplier: 0.10 },
    'claude-opus-4': { input: 15.00, output: 75.00, cacheReadMultiplier: 0.10 },
    'claude-sonnet-4': { input: 3.00, output: 15.00, cacheReadMultiplier: 0.10 },

    // Claude 3.x Series (legacy)
    'claude-3-5-sonnet': { input: 3.00, output: 15.00, cacheReadMultiplier: 0.10 },
    'claude-3-5-haiku': { input: 0.80, output: 4.00, cacheReadMultiplier: 0.10 },
    'claude-3-haiku': { input: 0.25, output: 1.25, cacheReadMultiplier: 0.10 },
    'claude-3-opus': { input: 15.00, output: 75.00, cacheReadMultiplier: 0.10 },
    'claude-3-sonnet': { input: 3.00, output: 15.00, cacheReadMultiplier: 0.10 },

    // ── GOOGLE GEMINI ─────────────────────────────────────────
    // Gemini 2.5 Series
    'gemini-2.5-pro': { input: 1.25, output: 10.00, cacheReadMultiplier: 0.10 },
    // Note: >200K tokens → 2x price ($2.50/$15.00)
    'gemini-2.5-flash': { input: 0.30, output: 2.50, cacheReadMultiplier: 0.10 },
    'gemini-2.5-flash-lite': { input: 0.10, output: 0.40, cacheReadMultiplier: 0.10 },

    // Gemini 2.0 Series
    'gemini-2.0-flash': { input: 0.10, output: 0.40, cacheReadMultiplier: 0.10 },
    'gemini-2.0-flash-lite': { input: 0.075, output: 0.30, cacheReadMultiplier: 0.10 },

    // Gemini 1.5 Series (legacy)
    'gemini-1.5-pro': { input: 1.25, output: 5.00, cacheReadMultiplier: 0.10 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30, cacheReadMultiplier: 0.10 },

    // ── OPENAI ────────────────────────────────────────────────
    // GPT-4.1 Series (2025 flagship)
    'gpt-4.1': { input: 2.00, output: 8.00, cacheReadMultiplier: 0.50 },
    'gpt-4.1-mini': { input: 0.40, output: 1.60, cacheReadMultiplier: 0.50 },
    'gpt-4.1-nano': { input: 0.10, output: 0.40, cacheReadMultiplier: 0.50 },

    // GPT-4o Series
    'gpt-4o': { input: 2.50, output: 10.00, cacheReadMultiplier: 0.50 },
    'gpt-4o-mini': { input: 0.15, output: 0.60, cacheReadMultiplier: 0.50 },

    // o-Series (Reasoning)
    'o4-mini': { input: 1.10, output: 4.40, cacheReadMultiplier: 0.50 },
    'o3': { input: 10.00, output: 40.00, cacheReadMultiplier: 0.50 },
    'o3-mini': { input: 1.10, output: 4.40, cacheReadMultiplier: 0.50 },
}

function getModelPricing(modelId: string) {
    const id = modelId.toLowerCase()

    // OpenRouter free models: "model-name:free" format → zero cost
    if (id.includes(':free') || (id.startsWith('openrouter/') && id.includes('free'))) {
        return { input: 0, output: 0, cacheReadMultiplier: 1 }
    }

    // Exact match first
    for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
        if (id === key) return pricing
    }

    // Partial match (for versioned model names like claude-sonnet-4-20250514)
    for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
        if (id.includes(key) || key.includes(id)) return pricing
    }

    // Unknown model — safe fallback
    console.warn(`[billing] Unknown model: ${modelId} — using default pricing`)
    return { input: 1.00, output: 3.00, cacheReadMultiplier: 0.10 }
}

function calculateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    cacheRead: number,
    cacheCreation = 0
): number {
    const pricing = getModelPricing(modelId)
    const cacheMultiplier = pricing.cacheReadMultiplier ?? 0.10

    // Gemini 2.5 Pro: >200K input tokens → 2x pricing
    let effectiveInputPrice = pricing.input
    let effectiveOutputPrice = pricing.output
    if (modelId.includes('gemini-2.5-pro') && inputTokens > 200_000) {
        effectiveInputPrice = 2.50
        effectiveOutputPrice = 15.00
    }

    // Net input = non-cached portion
    const netInput = Math.max(0, inputTokens - cacheRead - cacheCreation)

    const inputCost = (netInput / 1_000_000) * effectiveInputPrice
    const cacheReadCost = (cacheRead / 1_000_000) * effectiveInputPrice * cacheMultiplier
    // Cache write: Anthropic charges 1.25x input, others include it in input cost
    const cacheWriteCost = modelId.includes('claude')
        ? (cacheCreation / 1_000_000) * effectiveInputPrice * 1.25
        : 0
    const outputCost = (outputTokens / 1_000_000) * effectiveOutputPrice

    return Math.max(0, inputCost + cacheReadCost + cacheWriteCost + outputCost)
}

/**
 * Parse billing data from ALL agent session JSONL files
 * Scans all agent session directories under ~/.openclaw/agents/
 */
export async function parseBillingLogs(limit = 1000): Promise<BillingEntry[]> {
    try {
        const agentsBase = path.join(process.env.HOME || '/root', '.openclaw/agents')
        const entries: BillingEntry[] = []

        let agentDirs: string[] = []
        try {
            agentDirs = await fs.readdir(agentsBase)
        } catch { return [] }

        for (const agentId of agentDirs) {
            const sessionsDir = path.join(agentsBase, agentId, 'sessions')
            let sessionFiles: string[] = []
            try {
                sessionFiles = (await fs.readdir(sessionsDir)).filter(f => f.endsWith('.jsonl'))
            } catch { continue }

            for (const file of sessionFiles) {
                try {
                    const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8')
                    const lines = content.trim().split('\n').filter(l => l.trim())
                    const sessionId = file.replace('.jsonl', '')

                    // Find the model used in this session
                    let sessionModel = 'unknown'
                    for (const line of lines) {
                        try {
                            const d = JSON.parse(line)
                            if (d.type === 'summary') {
                                sessionModel = d.model || d.modelId || sessionModel
                            } else if (d.type === 'model_change') {
                                sessionModel = d.modelId || d.provider || sessionModel
                            }
                        } catch { }
                    }

                    // Find senderId from first user message
                    let senderId = ''
                    let senderName = 'User'
                    for (const line of lines) {
                        try {
                            const d = JSON.parse(line)
                            if (d.type === 'message' && d.message?.role === 'user') {
                                senderId = d.senderId || d.jid || ''
                                senderName = d.senderName || d.pushName || d.from || 'User'
                                break
                            }
                        } catch { }
                    }

                    // Extract all messages with usage info
                    for (const line of lines) {
                        try {
                            const d = JSON.parse(line)
                            if (d.type !== 'message') continue

                            const role = d.message?.role || ''
                            const usage = d.usage || d.message?.usage || d.costTracker || d.tokenUsage || d.metadata?.usage || {}

                            const inputTokens = usage.input_tokens || usage.prompt_tokens || usage.inputTokens || 0
                            const outputTokens = usage.output_tokens || usage.completion_tokens || usage.outputTokens || 0
                            const cacheRead = usage.cache_read_input_tokens || usage.cachedTokens || usage.cacheReadTokens || 0
                            const cacheCreation = usage.cache_creation_input_tokens || usage.cacheCreationTokens || 0
                            const totalTokens = inputTokens + outputTokens

                            const cost = (role === 'assistant' && totalTokens > 0) ? calculateCost(sessionModel, inputTokens, outputTokens, cacheRead, cacheCreation) : 0

                            // Extract message text content
                            const msgContent = d.message?.content
                            let textContent = ''
                            if (Array.isArray(msgContent)) {
                                textContent = msgContent
                                    .filter((p: any) => p.type === 'text')
                                    .map((p: any) => p.text)
                                    .join('\n')
                            } else if (typeof msgContent === 'string') {
                                textContent = msgContent
                            }

                            entries.push({
                                timestamp: d.timestamp || new Date().toISOString(),
                                user: senderName,
                                phone: senderId,
                                model: sessionModel,
                                inputTokens,
                                outputTokens,
                                cacheReadTokens: cacheRead,
                                cacheCreationTokens: cacheCreation,
                                totalTokens,
                                cost,
                                session: sessionId.slice(0, 8),
                                role,
                                content: textContent.slice(0, 500),
                                channel: d.commandSource || d.channel || '',
                                agentId: agentId
                            })
                        } catch { }
                    }
                } catch { }
            }
        }

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
