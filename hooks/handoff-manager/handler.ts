/**
 * Handoff Manager Hook
 * Manages model escalation: Haiku → Sonnet → Opus.
 * Optimizes cost by starting cheap and escalating only when needed.
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
        workspaceDir?: string;
        toolName?: string;
        toolArgs?: any;
        model?: string;
    };
}

interface Handoff {
    from_model: string;
    to_model: string;
    refined_prompt?: string;
    context?: any;
    created_at: number;
}

// Stale threshold: 1 hour
const STALE_THRESHOLD = 60 * 60 * 1000;

/**
 * Get handoff file path
 */
function getHandoffPath(workspaceDir: string): string {
    return path.join(workspaceDir, "memory", "handoff", "active.json");
}

/**
 * Create handoff
 */
function createHandoff(workspaceDir: string, handoff: Handoff): void {
    const handoffPath = getHandoffPath(workspaceDir);
    const handoffDir = path.dirname(handoffPath);

    try {
        if (!fs.existsSync(handoffDir)) {
            fs.mkdirSync(handoffDir, { recursive: true });
        }

        fs.writeFileSync(handoffPath, JSON.stringify(handoff, null, 2), "utf8");
        console.log(`[handoff-manager] Created handoff: ${handoff.from_model} → ${handoff.to_model}`);
    } catch (err) {
        console.error("[handoff-manager] Failed to create handoff:", err);
    }
}

/**
 * Consume handoff
 */
function consumeHandoff(workspaceDir: string): Handoff | null {
    const handoffPath = getHandoffPath(workspaceDir);

    try {
        if (!fs.existsSync(handoffPath)) return null;

        const content = fs.readFileSync(handoffPath, "utf8");
        const handoff: Handoff = JSON.parse(content);

        // Check if stale
        const age = Date.now() - handoff.created_at;
        if (age > STALE_THRESHOLD) {
            console.log(`[handoff-manager] Discarding stale handoff (${age}ms old)`);
            fs.unlinkSync(handoffPath);
            return null;
        }

        // Delete handoff file
        fs.unlinkSync(handoffPath);
        console.log(`[handoff-manager] Consumed handoff: ${handoff.from_model} → ${handoff.to_model}`);

        return handoff;
    } catch (err) {
        console.error("[handoff-manager] Failed to consume handoff:", err);
        return null;
    }
}

/**
 * Handle request_upgrade tool (Haiku → Sonnet)
 */
function handleRequestUpgrade(event: HookEvent): void {
    const workspaceDir = event.context?.workspaceDir;
    if (!workspaceDir) return;

    const toolArgs = event.context?.toolArgs || {};
    const reason = toolArgs.reason || "Task complexity requires upgrade";

    console.log(`[handoff-manager] 🔄 Haiku → Sonnet: ${reason}`);

    // Create handoff
    createHandoff(workspaceDir, {
        from_model: "haiku",
        to_model: "sonnet",
        refined_prompt: toolArgs.refined_prompt || "",
        context: toolArgs.context || {},
        created_at: Date.now()
    });

    // Update model
    event.context.model = "claude-3-5-sonnet";

    // Send notification (optional)
    event.messages.push("🔄 Upgrading: Haiku → Sonnet");
}

/**
 * Handle escalate_to_opus tool (Sonnet → Opus)
 */
function handleEscalateToOpus(event: HookEvent): void {
    const workspaceDir = event.context?.workspaceDir;
    if (!workspaceDir) return;

    const toolArgs = event.context?.toolArgs || {};
    const reason = toolArgs.reason || "Task requires highest reasoning";

    console.log(`[handoff-manager] 🔄 Sonnet → Opus: ${reason}`);

    // Create handoff
    createHandoff(workspaceDir, {
        from_model: "sonnet",
        to_model: "opus",
        refined_prompt: toolArgs.refined_prompt || "",
        context: toolArgs.context || {},
        created_at: Date.now()
    });

    // Update model
    event.context.model = "claude-opus-4";

    // Send notification (optional)
    event.messages.push("🔄 Escalating: Sonnet → Opus");
}

/**
 * Check for pending handoff and downgrade after completion
 */
function checkDowngrade(event: HookEvent): void {
    const workspaceDir = event.context?.workspaceDir;
    if (!workspaceDir) return;

    const currentModel = event.context?.model || "";

    // Only downgrade if we're on Sonnet or Opus
    if (!currentModel.includes("sonnet") && !currentModel.includes("opus")) return;

    // Check if there's a pending handoff
    const handoffPath = getHandoffPath(workspaceDir);
    if (fs.existsSync(handoffPath)) {
        // Still in handoff, don't downgrade yet
        return;
    }

    // Downgrade to Haiku
    console.log(`[handoff-manager] ✅ Downgrading: ${currentModel} → Haiku`);
    event.context.model = "claude-3-5-haiku";
    event.messages.push("✅ Task complete, returning to Haiku");
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    const toolName = event.context?.toolName;

    if (event.type === "tool") {
        // Handle tool-based handoffs
        if (toolName === "request_upgrade") {
            handleRequestUpgrade(event);
        } else if (toolName === "escalate_to_opus") {
            handleEscalateToOpus(event);
        }

    } else if (event.type === "agent" && event.action === "response") {
        // Check for downgrade after task completion
        checkDowngrade(event);
    }
};

export default handler;
