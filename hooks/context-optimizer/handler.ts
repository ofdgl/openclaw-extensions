/**
 * Context Optimizer Hook
 * Optimizes context window based on intent and enables Anthropic caching.
 */

import * as fs from "fs";
import * as path from "path";

type Intent = "greeting" | "question" | "task" | "coding" | "research";

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        senderId?: string;
        workspaceDir?: string;
        sessionMetadata?: Record<string, any>;
        bootstrapFiles?: any[];
        historyLimit?: number;
        cacheConfig?: {
            enabled: boolean;
            cacheableFiles?: string[];
        };
    };
}

// Context window sizes by intent
const CONTEXT_SIZES: Record<Intent, number> = {
    greeting: 3,
    question: 10,
    task: 20,
    coding: 50,
    research: 100
};

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:bootstrap
    if (event.type !== "agent" || event.action !== "bootstrap") return;

    // Get intent from session metadata (set by intent-classifier)
    const intent: Intent = event.context?.sessionMetadata?.intent || "task";
    const historySize = CONTEXT_SIZES[intent] || CONTEXT_SIZES.task;

    // Set history limit
    event.context.historyLimit = historySize;

    console.log(`[context-optimizer] Intent: ${intent} → ${historySize} messages`);

    // Enable Anthropic caching for static content
    const workspaceDir = event.context?.workspaceDir;
    if (workspaceDir) {
        enableAnthropicCaching(event, workspaceDir, intent);
    }
};

/**
 * Enable Anthropic prompt caching for static content
 */
function enableAnthropicCaching(event: HookEvent, workspaceDir: string, intent: Intent): void {
    if (!event.context.cacheConfig) {
        event.context.cacheConfig = { enabled: false };
    }

    // Only enable for Anthropic models
    // (In real implementation, check event.context.model)
    event.context.cacheConfig.enabled = true;
    event.context.cacheConfig.cacheableFiles = [];

    // Always cache SOUL.md
    const soulPath = path.join(workspaceDir, "SOUL.md");
    if (fs.existsSync(soulPath)) {
        event.context.cacheConfig.cacheableFiles.push(soulPath);
    }

    // For coding intent, cache workspace files
    if (intent === "coding") {
        const workingPath = path.join(workspaceDir, "WORKING.md");
        if (fs.existsSync(workingPath)) {
            event.context.cacheConfig.cacheableFiles.push(workingPath);
        }
    }

    console.log(`[context-optimizer] Cache enabled: ${event.context.cacheConfig.cacheableFiles.length} files`);
}

export default handler;
