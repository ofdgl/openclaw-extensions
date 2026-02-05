/**
 * Task Lock Manager Hook
 * Distributed task locking using Cloudflare KV with local fallback.
 * Prevents concurrent work on same task.
 */

import * as fs from "fs";
import * as path from "path";

interface TaskLock {
    task_id: string;
    agent_id: string;
    locked_at: number;
    expires_at: number;
}

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        workspaceDir?: string;
        agentId?: string;
        taskId?: string;
    };
}

// Lock expiry: 10 minutes
const LOCK_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Get local locks directory (fallback)
 */
function getLocksDir(workspaceDir: string): string {
    return path.join(workspaceDir, ".locks");
}

/**
 * Set lock (local fallback)
 */
function setLockLocal(workspaceDir: string, lock: TaskLock): boolean {
    const locksDir = getLocksDir(workspaceDir);

    if (!fs.existsSync(locksDir)) {
        fs.mkdirSync(locksDir, { recursive: true });
    }

    const lockPath = path.join(locksDir, `${lock.task_id}.json`);

    // Check if already locked
    if (fs.existsSync(lockPath)) {
        const existing: TaskLock = JSON.parse(fs.readFileSync(lockPath, "utf8"));

        // Check if expired
        if (Date.now() < existing.expires_at) {
            console.log(`[task-lock] Task ${lock.task_id} locked by ${existing.agent_id}`);
            return false;
        }

        // Expired, remove old lock
        console.log(`[task-lock] Lock expired, acquiring...`);
    }

    // Set lock
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), "utf8");
    console.log(`[task-lock] ✅ Lock acquired: ${lock.task_id} by ${lock.agent_id}`);

    return true;
}

/**
 * Release lock (local fallback)
 */
function releaseLockLocal(workspaceDir: string, taskId: string): void {
    const lockPath = path.join(getLocksDir(workspaceDir), `${taskId}.json`);

    if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
        console.log(`[task-lock] ✅ Lock released: ${taskId}`);
    }
}

/**
 * Set lock in Cloudflare KV (mock)
 */
async function setLockCloudflare(lock: TaskLock): Promise<boolean> {
    // Mock implementation
    // In production:
    // const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${lock.task_id}`, {
    //     method: 'PUT',
    //     headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    //     body: JSON.stringify(lock)
    // });

    console.log("[task-lock] Cloudflare KV not configured, using local fallback");
    return false;
}

/**
 * Release lock in Cloudflare KV (mock)
 */
async function releaseLockCloudflare(taskId: string): Promise<void> {
    // Mock: Always use local fallback
    console.log("[task-lock] Cloudflare KV not configured, using local fallback");
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    const taskId = event.context?.taskId;
    const agentId = event.context?.agentId || "unknown";
    const workspaceDir = event.context?.workspaceDir;

    if (!taskId || !workspaceDir) return;

    if (event.action === "start") {
        // Acquire lock
        const lock: TaskLock = {
            task_id: taskId,
            agent_id: agentId,
            locked_at: Date.now(),
            expires_at: Date.now() + LOCK_EXPIRY_MS
        };

        // Try Cloudflare first
        let success = await setLockCloudflare(lock);

        // Fallback to local
        if (!success) {
            success = setLockLocal(workspaceDir, lock);
        }

        if (!success) {
            event.messages.push(`⚠️ Task ${taskId} is locked by another agent`);
        }

    } else if (event.action === "complete") {
        // Release lock
        await releaseLockCloudflare(taskId);
        releaseLockLocal(workspaceDir, taskId);
    }
};

export default handler;
