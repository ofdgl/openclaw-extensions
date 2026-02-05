/**
 * Loop Detector Hook
 * Implements dynamic timeouts based on message intent.
 * Prevents runaway tasks from consuming resources.
 */

import * as fs from "fs";
import * as path from "path";

type Intent = "greeting" | "question" | "task" | "coding" | "research";

// Timeout configuration (in milliseconds)
const LOOP_TIMEOUTS: Record<Intent, number> = {
    greeting: 30 * 1000,      // 30 seconds
    question: 2 * 60 * 1000,   // 2 minutes
    task: 5 * 60 * 1000,       // 5 minutes
    coding: 10 * 60 * 1000,    // 10 minutes
    research: 15 * 60 * 1000   // 15 minutes
};

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        senderId?: string;
        messageId?: string;
        sessionMetadata?: Record<string, any>;
        workspaceDir?: string;
    };
}

interface TaskTimer {
    taskId: string;
    sessionKey: string;
    intent: Intent;
    startTime: number;
    timeoutHandle: NodeJS.Timeout;
}

// Global task timers (in-memory)
const activeTimers = new Map<string, TaskTimer>();

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
        console.error("[loop-detector] Failed to log event:", err);
    }
}

/**
 * Handle timeout - task exceeded allowed duration
 */
function handleTimeout(timer: TaskTimer): void {
    console.log(`[loop-detector] 🚨 LOOP DETECTED: ${timer.taskId} (${timer.intent}, ${(Date.now() - timer.startTime) / 1000}s)`);

    // Log security event
    logSecurityEvent({
        timestamp: Date.now(),
        type: "loop_detected",
        task_id: timer.taskId,
        session_key: timer.sessionKey,
        intent: timer.intent,
        duration_ms: Date.now() - timer.startTime,
        timeout_ms: LOOP_TIMEOUTS[timer.intent]
    });

    // Clean up timer
    activeTimers.delete(timer.taskId);

    // TODO: In production, this would notify security agent and terminate task
    // For now, we just log the event
}

/**
 * Start task timer
 */
function startTimer(event: HookEvent): void {
    const messageId = event.context?.messageId || `${Date.now()}`;
    const taskId = `task_${messageId}`;

    // Get intent from session metadata (set by intent-classifier)
    const intent: Intent = event.context?.sessionMetadata?.intent || "task";
    const timeout = LOOP_TIMEOUTS[intent] || LOOP_TIMEOUTS.task;

    // Clear existing timer if any
    const existing = activeTimers.get(taskId);
    if (existing) {
        clearTimeout(existing.timeoutHandle);
    }

    // Create timer
    const timer: TaskTimer = {
        taskId,
        sessionKey: event.sessionKey,
        intent,
        startTime: Date.now(),
        timeoutHandle: setTimeout(() => handleTimeout(timer), timeout)
    };

    activeTimers.set(taskId, timer);

    console.log(`[loop-detector] Started timer: ${taskId} (${intent}, ${timeout / 1000}s)`);
}

/**
 * Cancel task timer
 */
function cancelTimer(event: HookEvent): void {
    const messageId = event.context?.messageId || `${Date.now()}`;
    const taskId = `task_${messageId}`;

    const timer = activeTimers.get(taskId);
    if (timer) {
        clearTimeout(timer.timeoutHandle);
        activeTimers.delete(taskId);

        const duration = Date.now() - timer.startTime;
        console.log(`[loop-detector] Task completed: ${taskId} (${duration}ms)`);
    }
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    if (event.type !== "agent") return;

    if (event.action === "bootstrap") {
        // Start timer when task begins
        startTimer(event);

    } else if (event.action === "response" || event.action === "complete") {
        // Cancel timer when task completes
        cancelTimer(event);
    }
};

export default handler;
