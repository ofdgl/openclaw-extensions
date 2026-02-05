/**
 * Mention Notifier Hook
 * Agent-to-agent @mention notification system.
 * Creates notifications in Mission Control DB.
 */

import * as fs from "fs";
import * as path from "path";

interface Notification {
    id: string;
    from_agent: string;
    to_agent: string;
    message: string;
    delivered: boolean;
    created_at: number;
}

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        senderId?: string;
        agentId?: string;
        messageText?: string;
        workspaceDir?: string;
    };
}

/**
 * Extract @mentions from message
 */
function extractMentions(message: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];

    let match;
    while ((match = mentionPattern.exec(message)) !== null) {
        mentions.push(match[1]);
    }

    return mentions;
}

/**
 * Get notifications DB path (JSONL for testing)
 */
function getNotificationsPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "";
    return path.join(homeDir, ".openclaw", "data", "notifications.jsonl");
}

/**
 * Create notification record
 */
function createNotification(fromAgent: string, toAgent: string, message: string): Notification {
    return {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from_agent: fromAgent,
        to_agent: toAgent,
        message,
        delivered: false,
        created_at: Date.now()
    };
}

/**
 * Save notification to DB
 */
function saveNotification(notification: Notification): void {
    const dbPath = getNotificationsPath();
    const dbDir = path.dirname(dbPath);

    try {
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        const line = JSON.stringify(notification) + "\n";
        fs.appendFileSync(dbPath, line, "utf8");

        console.log(`[mention-notifier] Notification created: ${notification.from_agent} → ${notification.to_agent}`);
    } catch (err: any) {
        console.error("[mention-notifier] Failed to save notification:", err.message);
    }
}

/**
 * Attempt immediate delivery (mock)
 */
async function attemptDelivery(notification: Notification): Promise<boolean> {
    // In production, check if agent is online and send via Mission Control
    // For now, always return false (agent offline)
    console.log(`[mention-notifier] Attempting delivery to @${notification.to_agent}...`);

    // Mock: Agent is offline
    return false;
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:message
    if (event.type !== "agent" || event.action !== "message") return;

    const messageText = event.context?.messageText || "";
    if (!messageText) return;

    // Extract mentions
    const mentions = extractMentions(messageText);
    if (mentions.length === 0) return;

    const fromAgent = event.context?.agentId || event.context?.senderId || "unknown";

    console.log(`[mention-notifier] Found ${mentions.length} mention(s): ${mentions.join(", ")}`);

    // Create notifications for each mention
    for (const toAgent of mentions) {
        const notification = createNotification(fromAgent, toAgent, messageText);
        saveNotification(notification);

        // Attempt immediate delivery
        const delivered = await attemptDelivery(notification);

        if (delivered) {
            console.log(`[mention-notifier] ✅ Delivered to @${toAgent}`);
        } else {
            console.log(`[mention-notifier] 📬 Queued for @${toAgent} (agent offline)`);
        }
    }
};

export default handler;
