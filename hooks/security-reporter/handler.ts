/**
 * Security Reporter Hook
 * Generates daily security reports and critical alerts.
 * Triggered by heartbeat scheduler.
 */

import * as fs from "fs";
import * as path from "path";

interface SecurityEvent {
    timestamp: number;
    type: string;
    user_id?: string;
    severity?: string;
}

interface TokenUsage {
    user_id: string;
    input_tokens: number;
    output_tokens: number;
    cost: number;
    timestamp: number;
}

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        workspaceDir?: string;
    };
}

/**
 * Get security log path
 */
function getSecurityLogPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "";
    return path.join(homeDir, ".openclaw", "logs", "security.jsonl");
}

/**
 * Get billing log path
 */
function getBillingLogPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "";
    return path.join(homeDir, ".openclaw", "data", "billing.jsonl");
}

/**
 * Count security events by type
 */
function getSecurityStats(): Record<string, number> {
    const logPath = getSecurityLogPath();
    const stats: Record<string, number> = {};

    if (!fs.existsSync(logPath)) return stats;

    try {
        const lines = fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean);

        // Get today's events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        for (const line of lines) {
            const event: SecurityEvent = JSON.parse(line);
            if (event.timestamp >= todayTimestamp) {
                stats[event.type] = (stats[event.type] || 0) + 1;
            }
        }
    } catch (err: any) {
        console.error("[security-reporter] Failed to read security log:", err.message);
    }

    return stats;
}

/**
 * Get daily token usage
 */
function getDailyTokenUsage(): { totalCost: number; totalTokens: number } {
    const logPath = getBillingLogPath();

    if (!fs.existsSync(logPath)) {
        return { totalCost: 0, totalTokens: 0 };
    }

    try {
        const lines = fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        let totalCost = 0;
        let totalTokens = 0;

        for (const line of lines) {
            const usage: TokenUsage = JSON.parse(line);
            if (usage.timestamp >= todayTimestamp) {
                totalCost += usage.cost || 0;
                totalTokens += usage.input_tokens + usage.output_tokens;
            }
        }

        return { totalCost, totalTokens };
    } catch (err: any) {
        console.error("[security-reporter] Failed to read billing log:", err.message);
        return { totalCost: 0, totalTokens: 0 };
    }
}

/**
 * Generate security report
 */
function generateReport(): string {
    const securityStats = getSecurityStats();
    const { totalCost, totalTokens } = getDailyTokenUsage();

    const date = new Date().toLocaleDateString("tr-TR");

    let report = `🔒 **Güvenlik Raporu** - ${date}\n\n`;

    // Security events
    report += `**Güvenlik Olayları:**\n`;
    if (Object.keys(securityStats).length === 0) {
        report += `- Olay yok ✅\n`;
    } else {
        for (const [type, count] of Object.entries(securityStats)) {
            report += `- ${type}: ${count}\n`;
        }
    }
    report += `\n`;

    // Token usage
    report += `**Token Kullanımı:**\n`;
    report += `- Toplam: ${totalTokens.toLocaleString()} token\n`;
    report += `- Maliyet: $${totalCost.toFixed(4)}\n`;
    report += `\n`;

    // Agent health (mock)
    report += `**Agent Durumu:**\n`;
    report += `- Tüm agentlar çalışıyor ✅\n`;

    return report;
}

/**
 * Check for critical alerts
 */
function checkCriticalAlerts(securityStats: Record<string, number>): string[] {
    const alerts: string[] = [];

    // Multiple unauthorized bypass attempts
    if (securityStats["unauthorized_emergency_bypass"] >= 3) {
        alerts.push(`🚨 CRITICAL: ${securityStats["unauthorized_emergency_bypass"]} unauthorized /o attempts!`);
    }

    // Multiple loop detections
    if (securityStats["loop_detected"] >= 5) {
        alerts.push(`⚠️ WARNING: ${securityStats["loop_detected"]} runaway tasks detected!`);
    }

    return alerts;
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle heartbeat:security_audit
    if (event.type !== "heartbeat" || event.action !== "security_audit") return;

    console.log("[security-reporter] Generating daily security report...");

    // Generate report
    const report = generateReport();

    // Check for critical alerts
    const securityStats = getSecurityStats();
    const alerts = checkCriticalAlerts(securityStats);

    // Send report
    event.messages.push(report);

    // Send critical alerts
    if (alerts.length > 0) {
        event.messages.push(...alerts);
    }

    console.log("[security-reporter] Report generated");
    console.log(report);
};

export default handler;
