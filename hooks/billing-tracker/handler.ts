/**
 * Billing Tracker Hook
 * Logs token usage to SQLite for cost monitoring.
 * Sends alert when user exceeds 80% of daily budget.
 */

import * as fs from "fs";
import * as path from "path";

// Model pricing per 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    "haiku": { input: 1.00, output: 5.00 },
    "claude-3-haiku": { input: 1.00, output: 5.00 },
    "claude-3-5-haiku": { input: 1.00, output: 5.00 },
    "sonnet": { input: 3.00, output: 15.00 },
    "claude-3-sonnet": { input: 3.00, output: 15.00 },
    "claude-3-5-sonnet": { input: 3.00, output: 15.00 },
    "opus": { input: 15.00, output: 75.00 },
    "claude-3-opus": { input: 15.00, output: 75.00 },
};

// Default daily budget in USD
const DEFAULT_DAILY_BUDGET = 5.00;

// Budget thresholds
const WARNING_THRESHOLD = 0.80; // 80%

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        senderId?: string;
        commandSource?: string;
        workspaceDir?: string;
        cfg?: any;
        response?: {
            content: string;
            model?: string;
            usage?: {
                input_tokens: number;
                output_tokens: number;
            };
        };
    };
}

interface TokenUsage {
    agent_id: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost: number;
    session_key: string;
    user_id: string;
    timestamp: number;
}

/**
 * Calculate cost based on model and tokens
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Normalize model name
    const normalizedModel = model.toLowerCase().replace(/[^a-z0-9-]/g, "");

    // Find matching pricing
    let pricing = MODEL_PRICING["haiku"]; // Default
    for (const [key, value] of Object.entries(MODEL_PRICING)) {
        if (normalizedModel.includes(key)) {
            pricing = value;
            break;
        }
    }

    // Calculate cost (tokens / 1M * price)
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
}

/**
 * Get database path
 */
function getDbPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "";
    return path.join(homeDir, ".openclaw", "data", "billing.db");
}

/**
 * Initialize SQLite database (creates if not exists)
 * Note: Actual SQLite operations would use better-sqlite3 in production
 * This is a simple file-based JSON log for hook testing
 */
function ensureDbExists(): void {
    const dbPath = getDbPath();
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    // Use JSON log file for simplicity (no native dependencies)
    const logPath = dbPath.replace(".db", ".jsonl");
    if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, "", "utf8");
    }
}

/**
 * Log usage to file (JSON lines format)
 */
function logUsage(usage: TokenUsage): void {
    const logPath = getDbPath().replace(".db", ".jsonl");
    ensureDbExists();

    const line = JSON.stringify(usage) + "\n";
    fs.appendFileSync(logPath, line, "utf8");

    console.log(`[billing-tracker] Logged: ${usage.model} ${usage.input_tokens}/${usage.output_tokens} tokens = $${usage.cost.toFixed(4)}`);
}

/**
 * Get today's total usage for a user
 */
function getDailyUsage(userId: string): number {
    const logPath = getDbPath().replace(".db", ".jsonl");

    if (!fs.existsSync(logPath)) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const lines = fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean);
    let totalCost = 0;

    for (const line of lines) {
        try {
            const usage: TokenUsage = JSON.parse(line);
            if (usage.user_id === userId && usage.timestamp >= todayTimestamp) {
                totalCost += usage.cost;
            }
        } catch {
            // Skip invalid lines
        }
    }

    return totalCost;
}

/**
 * Check if budget warning should be sent
 */
function checkBudgetWarning(userId: string, newCost: number): boolean {
    const dailyUsage = getDailyUsage(userId);
    const totalUsage = dailyUsage + newCost;

    if (totalUsage >= DEFAULT_DAILY_BUDGET * WARNING_THRESHOLD) {
        console.log(`[billing-tracker] ⚠️ BUDGET WARNING: ${userId} at ${((totalUsage / DEFAULT_DAILY_BUDGET) * 100).toFixed(1)}% of daily budget`);
        return true;
    }

    return false;
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:response events
    // Note: OpenClaw may use different event names - adjust as needed
    if (event.type !== "agent") return;
    if (event.action !== "response" && event.action !== "complete") return;

    const response = event.context?.response;
    if (!response?.usage) return;

    const model = response.model || "haiku";
    const inputTokens = response.usage.input_tokens || 0;
    const outputTokens = response.usage.output_tokens || 0;

    if (inputTokens === 0 && outputTokens === 0) return;

    const cost = calculateCost(model, inputTokens, outputTokens);
    const userId = event.context?.senderId || "unknown";

    const usage: TokenUsage = {
        agent_id: event.sessionKey.split(":")[1] || "main",
        model: model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost: cost,
        session_key: event.sessionKey,
        user_id: userId,
        timestamp: Date.now()
    };

    // Log usage
    logUsage(usage);

    // Check budget
    const shouldWarn = checkBudgetWarning(userId, cost);
    if (shouldWarn) {
        event.messages.push(`⚠️ Günlük bütçenin %80'ine ulaştın!`);
    }
};

export default handler;
