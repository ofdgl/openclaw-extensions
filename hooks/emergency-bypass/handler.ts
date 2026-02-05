/**
 * Emergency Bypass Hook
 * Admin-only /o command for direct Opus access.
 * Bypasses all routing and grants full permissions.
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
        messageText?: string;
        bootstrapFiles?: any[];
        model?: string;
        tools?: string[];
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
 * Log security event
 */
function logSecurityEvent(event: any): void {
    const logPath = getSecurityLogPath();
    const logDir = path.dirname(logPath);

    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const line = JSON.stringify(event) + "\n";
        fs.appendFileSync(logPath, line, "utf8");
    } catch (err) {
        console.error("[emergency-bypass] Failed to log event:", err);
    }
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

    const messageText = event.context?.messageText || "";

    // Check for /o prefix
    if (!messageText.startsWith("/o ")) return;

    const senderId = event.context?.senderId;
    const workspaceDir = event.context?.workspaceDir;

    if (!senderId || !workspaceDir) return;

    // Verify admin permission
    if (!isAdmin(senderId, workspaceDir)) {
        console.log(`[emergency-bypass] 🚫 UNAUTHORIZED: ${senderId} attempted /o command`);

        // Log security event
        logSecurityEvent({
            timestamp: Date.now(),
            type: "unauthorized_emergency_bypass",
            user_id: senderId,
            severity: "high"
        });

        // Block request
        if (event.context.bootstrapFiles) {
            event.context.bootstrapFiles.length = 0;
        }

        // Send error message
        event.messages.push("🚫 Bu komut sadece admin kullanıcılar için geçerlidir.");

        return;
    }

    // Admin - execute emergency bypass
    const actualPrompt = messageText.substring(3); // Strip "/o "

    console.log(`[emergency-bypass] 🚨 OPUS DIRECT: ${senderId} (${actualPrompt.length} chars)`);

    // Log emergency event
    logSecurityEvent({
        timestamp: Date.now(),
        type: "emergency_bypass_executed",
        user_id: senderId,
        prompt_length: actualPrompt.length
    });

    // Modify context for Opus
    event.context.model = "claude-opus-4";
    event.context.tools = ["*"]; // All tools permitted

    // Update message text (remove /o prefix)
    event.context.messageText = actualPrompt;

    // Add emergency mode marker to bootstrap
    if (!event.context.bootstrapFiles) {
        event.context.bootstrapFiles = [];
    }

    event.context.bootstrapFiles.push({
        path: "EMERGENCY_MODE.md",
        content: `# Emergency Mode Active

You are operating in EMERGENCY MODE with full permissions.
Use highest reasoning capability to address critical issues.
`
    });

    // Send activation message
    event.messages.push("🚨 Opus Emergency Mode aktif");
};

export default handler;
