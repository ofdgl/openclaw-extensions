/**
 * Secret Guard Hook
 * Redacts API keys and secrets from AI responses.
 * Prevents accidental exposure of sensitive credentials.
 */

import * as fs from "fs";
import * as path from "path";

// Secret detection patterns
const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
    {
        name: "Anthropic API Key",
        pattern: /sk-ant-[a-zA-Z0-9-]{40,}/g
    },
    {
        name: "OpenAI API Key",
        pattern: /sk-(?:proj-)?[a-zA-Z0-9]{32,}/g
    },
    {
        name: "Google API Key",
        pattern: /AIza[a-zA-Z0-9_-]{35}/g
    },
    {
        name: "GitHub PAT",
        pattern: /ghp_[a-zA-Z0-9]{36}/g
    },
    {
        name: "GitHub OAuth",
        pattern: /gho_[a-zA-Z0-9]{36}/g
    },
    {
        name: "Slack Bot Token",
        pattern: /xoxb-[0-9]{10,13}-[a-zA-Z0-9]{24}/g
    },
    {
        name: "Slack User Token",
        pattern: /xoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g
    },
    {
        name: "AWS Access Key",
        pattern: /AKIA[0-9A-Z]{16}/g
    },
    {
        name: "Telegram Bot Token",
        pattern: /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/g
    }
];

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        senderId?: string;
        workspaceDir?: string;
        response?: {
            content: string;
        };
    };
}

interface SecurityLog {
    timestamp: number;
    type: string;
    pattern_name: string;
    session_key: string;
    user_id: string;
    redacted_count: number;
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
function logSecurityEvent(event: SecurityLog): void {
    const logPath = getSecurityLogPath();
    const logDir = path.dirname(logPath);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const line = JSON.stringify(event) + "\n";
    fs.appendFileSync(logPath, line, "utf8");
}

/**
 * Detect secrets in text
 */
function detectSecrets(text: string): { name: string; count: number }[] {
    const detected: { name: string; count: number }[] = [];

    for (const { name, pattern } of SECRET_PATTERNS) {
        // Reset regex state
        pattern.lastIndex = 0;
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            detected.push({ name, count: matches.length });
        }
    }

    return detected;
}

/**
 * Redact secrets from text
 */
function redactSecrets(text: string): string {
    let redacted = text;

    for (const { pattern } of SECRET_PATTERNS) {
        // Reset regex state
        pattern.lastIndex = 0;
        redacted = redacted.replace(pattern, "[REDACTED]");
    }

    return redacted;
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:response events
    if (event.type !== "agent") return;
    if (event.action !== "response" && event.action !== "complete") return;

    const response = event.context?.response;
    if (!response?.content) return;

    // Detect secrets
    const detected = detectSecrets(response.content);

    if (detected.length === 0) return;

    // Log security event
    const totalRedacted = detected.reduce((sum, d) => sum + d.count, 0);

    console.log(`[secret-guard] 🔒 SECRETS DETECTED: ${detected.map(d => `${d.name}(${d.count})`).join(", ")}`);

    logSecurityEvent({
        timestamp: Date.now(),
        type: "secret_detected",
        pattern_name: detected.map(d => d.name).join(", "),
        session_key: event.sessionKey,
        user_id: event.context?.senderId || "unknown",
        redacted_count: totalRedacted
    });

    // Redact secrets from response
    response.content = redactSecrets(response.content);

    // Notify user (optional)
    event.messages.push(`🔒 ${totalRedacted} hassas bilgi redakte edildi.`);
};

export default handler;
