/**
 * Rate Limiter Hook
 * Enforces daily token limits per user to control costs.
 * Blocks requests when user exceeds their daily quota.
 */

import * as fs from "fs";
import * as path from "path";

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
        bootstrapFiles?: any[];
    };
}

interface ContactLimits {
    [userId: string]: {
        max_tokens_per_day?: number;
    };
}

interface TokenUsage {
    user_id: string;
    input_tokens: number;
    output_tokens: number;
    timestamp: number;
}

// Default limits
const DEFAULT_ADMIN_LIMIT = 500000;
const DEFAULT_USER_LIMIT = 20000;
const DEFAULT_GUEST_LIMIT = 5000;

/**
 * Get billing log path
 */
function getBillingLogPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "";
    return path.join(homeDir, ".openclaw", "data", "billing.jsonl");
}

/**
 * Parse contacts.yaml for token limits
 */
function loadTokenLimits(workspaceDir: string): ContactLimits {
    const contactsPath = path.join(workspaceDir, "memory", "contacts.yaml");
    const limits: ContactLimits = {};

    try {
        if (!fs.existsSync(contactsPath)) return limits;

        const content = fs.readFileSync(contactsPath, "utf8");
        const lines = content.split("\n");

        let currentUser = "";
        for (const line of lines) {
            // Match user phone number
            const userMatch = line.match(/^\s*["']?(\+\d+)["']?:/);
            if (userMatch) {
                currentUser = userMatch[1];
                limits[currentUser] = {};
            }

            // Match max_tokens_per_day
            if (currentUser && line.includes("max_tokens_per_day")) {
                const limitMatch = line.match(/max_tokens_per_day:\s*(\d+)/);
                if (limitMatch) {
                    limits[currentUser].max_tokens_per_day = parseInt(limitMatch[1]);
                }
            }
        }
    } catch (err) {
        console.error("[rate-limiter] Failed to load contacts:", err);
    }

    return limits;
}

/**
 * Get today's token usage for a user
 */
function getDailyTokenUsage(userId: string): number {
    const logPath = getBillingLogPath();

    if (!fs.existsSync(logPath)) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const lines = fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean);
    let totalTokens = 0;

    for (const line of lines) {
        try {
            const usage: TokenUsage = JSON.parse(line);
            if (usage.user_id === userId && usage.timestamp >= todayTimestamp) {
                totalTokens += usage.input_tokens + usage.output_tokens;
            }
        } catch {
            // Skip invalid lines
        }
    }

    return totalTokens;
}

/**
 * Get token limit for user
 */
function getUserLimit(userId: string, limits: ContactLimits, isAdmin: boolean): number {
    // Check explicit limit from contacts.yaml
    if (limits[userId]?.max_tokens_per_day) {
        return limits[userId].max_tokens_per_day!;
    }

    // Default by role
    if (isAdmin) return DEFAULT_ADMIN_LIMIT;
    if (userId.startsWith("+90")) return DEFAULT_USER_LIMIT;
    return DEFAULT_GUEST_LIMIT;
}

/**
 * Check if user is admin
 */
function isAdmin(userId: string, workspaceDir: string): boolean {
    const contactsPath = path.join(workspaceDir, "memory", "contacts.yaml");

    try {
        if (!fs.existsSync(contactsPath)) return false;

        const content = fs.readFileSync(contactsPath, "utf8");
        const lines = content.split("\n");

        let inAdminSection = false;
        for (const line of lines) {
            if (line.match(/^admin:/)) {
                inAdminSection = true;
            } else if (line.match(/^(trusted|blocked):/)) {
                inAdminSection = false;
            } else if (inAdminSection && line.includes(userId)) {
                return true;
            }
        }
    } catch {
        // Ignore errors
    }

    return false;
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:bootstrap
    if (event.type !== "agent" || event.action !== "bootstrap") return;

    const senderId = event.context?.senderId;
    const workspaceDir = event.context?.workspaceDir;

    if (!senderId || !workspaceDir) return;

    // Admin bypasses rate limiting
    if (isAdmin(senderId, workspaceDir)) {
        console.log(`[rate-limiter] Admin bypasses limit: ${senderId}`);
        return;
    }

    // Load limits and check usage
    const limits = loadTokenLimits(workspaceDir);
    const dailyUsage = getDailyTokenUsage(senderId);
    const userLimit = getUserLimit(senderId, limits, false);

    if (dailyUsage >= userLimit) {
        // Exceeded limit - block request
        console.log(`[rate-limiter] 🚫 LIMIT EXCEEDED: ${senderId} (${dailyUsage}/${userLimit} tokens)`);

        // Clear bootstrap files to abort request
        if (event.context.bootstrapFiles) {
            event.context.bootstrapFiles.length = 0;
        }

        // Send notification
        event.messages.push(
            `⚠️ Günlük token limitine ulaştın (${userLimit.toLocaleString()} token). Yarın tekrar dene.`
        );

        return;
    }

    // Log usage percentage
    const percentage = ((dailyUsage / userLimit) * 100).toFixed(1);
    console.log(`[rate-limiter] Usage: ${senderId} ${percentage}% (${dailyUsage}/${userLimit})`);
};

export default handler;
