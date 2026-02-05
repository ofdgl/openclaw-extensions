/**
 * VPS Mode Switch Hook
 * Allows admin to switch between Original and Kamino OpenClaw modes.
 * Commands: /vps original|simple|kamino|plus|status
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

type VpsMode = "original" | "kamino";

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        senderId?: string;
        text?: string;
        workspaceDir?: string;
    };
}

// Mode state file (persists across restarts)
const MODE_STATE_FILE = "/home/kowalski/.openclaw-mode";

// Admin check
function isAdmin(senderId: string): boolean {
    const ADMIN_NUMBERS = ["+905357874261"];
    return ADMIN_NUMBERS.includes(senderId);
}

// Get current mode
function getCurrentMode(): VpsMode {
    try {
        if (fs.existsSync(MODE_STATE_FILE)) {
            const mode = fs.readFileSync(MODE_STATE_FILE, "utf8").trim();
            return mode === "original" ? "original" : "kamino";
        }
    } catch {
        // Default to kamino if file doesn't exist
    }
    return "kamino";
}

// Save mode state
function saveMode(mode: VpsMode): void {
    fs.writeFileSync(MODE_STATE_FILE, mode, "utf8");
}

// Log security event
function logSecurityEvent(event: string, details: any): void {
    const logPath = "/home/kowalski/.openclaw/logs/security.jsonl";
    const entry = {
        timestamp: new Date().toISOString(),
        event,
        ...details
    };

    try {
        fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");
    } catch {
        console.error("[vps-mode-switch] Failed to log security event");
    }
}

// Execute mode switch
function executeSwitch(targetMode: VpsMode): { success: boolean; message: string } {
    const currentMode = getCurrentMode();

    if (currentMode === targetMode) {
        return {
            success: true,
            message: `⚡ Zaten ${targetMode === "original" ? "Original" : "Kamino"} modundasınız.`
        };
    }

    try {
        // Switch script path
        const switchScript = "/home/kowalski/openclaw-switch.sh";

        // Execute switch (this script handles Docker restart)
        execSync(`bash ${switchScript} ${targetMode}`, { timeout: 30000 });

        // Save new mode
        saveMode(targetMode);

        // Log event
        logSecurityEvent("mode_switch", {
            from: currentMode,
            to: targetMode,
            success: true
        });

        const modeEmoji = targetMode === "original" ? "🔒" : "🚀";
        const modeName = targetMode === "original" ? "Original (Strict)" : "Kamino (Enhanced)";

        return {
            success: true,
            message: `${modeEmoji} **VPS Mode değişti!**\n\n` +
                `**Mod**: ${modeName}\n` +
                `**Durum**: Gateway yeniden başlatılıyor...\n\n` +
                `_10 saniye içinde aktif olacak._`
        };

    } catch (err: any) {
        logSecurityEvent("mode_switch", {
            from: currentMode,
            to: targetMode,
            success: false,
            error: err.message
        });

        return {
            success: false,
            message: `❌ Mode switch başarısız: ${err.message}`
        };
    }
}

// Get status message
function getStatusMessage(): string {
    const mode = getCurrentMode();
    const modeEmoji = mode === "original" ? "🔒" : "🚀";
    const modeName = mode === "original" ? "Original (Strict)" : "Kamino (Enhanced)";

    const features = mode === "original"
        ? "- Sadece admin erişimi\n- Bundled hooks\n- Strict-list mesaj izni"
        : "- 19 custom hook aktif\n- 4 agent (admin/security/demo/intern)\n- Tüm +90 numaraları sandbox\n- Rate limiting & security logs";

    return `${modeEmoji} **VPS Durumu**\n\n` +
        `**Aktif Mod**: ${modeName}\n\n` +
        `**Özellikler**:\n${features}\n\n` +
        `**Komutlar**:\n` +
        `\`/vps original\` - Orijinal moda dön\n` +
        `\`/vps kamino\` - Gelişmiş moda geç`;
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle command events
    if (event.type !== "command") return;

    const text = event.context?.text?.toLowerCase() || "";
    const senderId = event.context?.senderId;

    // Check if it's a /vps command
    if (!text.startsWith("/vps")) return;

    // Admin check
    if (!senderId || !isAdmin(senderId)) {
        logSecurityEvent("unauthorized_vps_command", { sender: senderId });
        event.messages.push("⛔ Bu komut sadece admin tarafından kullanılabilir.");
        return;
    }

    // Parse command
    const parts = text.split(/\s+/);
    const subCommand = parts[1] || "status";

    let response: string;

    switch (subCommand) {
        case "original":
        case "simple":
            const origResult = executeSwitch("original");
            response = origResult.message;
            break;

        case "kamino":
        case "plus":
            const kamiResult = executeSwitch("kamino");
            response = kamiResult.message;
            break;

        case "status":
        default:
            response = getStatusMessage();
            break;
    }

    event.messages.push(response);
};

export default handler;
