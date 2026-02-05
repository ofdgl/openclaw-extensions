/**
 * Heartbeat Scheduler Hook
 * Executes automated tasks on cron schedules.
 * Supports AI prompts and shell commands.
 */

import * as fs from "fs";
import * as path from "path";

interface HeartbeatTask {
    name: string;
    agent: string;
    schedule: string;  // Cron format
    handler: "ai" | "command";
    model?: string;
    prompt?: string;
    command?: string;
    night_mode?: "skip" | "allow";
}

interface HeartbeatConfig {
    active_hours?: string;  // "08:00-23:00"
    timezone?: string;
    stagger_offset?: number;
}

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        workspaceDir?: string;
        cronTask?: string;
    };
}

/**
 * Load heartbeat.yaml config
 */
function loadHeartbeatConfig(workspaceDir: string): { config: HeartbeatConfig; tasks: HeartbeatTask[] } {
    const configPath = path.join(workspaceDir, "heartbeat.yaml");

    if (!fs.existsSync(configPath)) {
        console.log("[heartbeat-scheduler] No heartbeat.yaml found");
        return { config: {}, tasks: [] };
    }

    try {
        const content = fs.readFileSync(configPath, "utf8");

        // Simple YAML parsing (in production, use js-yaml)
        const lines = content.split("\n");
        const config: HeartbeatConfig = {};
        const tasks: HeartbeatTask[] = [];

        let currentTask: Partial<HeartbeatTask> | null = null;
        let inTasks = false;

        for (const line of lines) {
            if (line.includes("active_hours:")) {
                config.active_hours = line.split(":")[1].trim().replace(/"/g, "");
            } else if (line.includes("timezone:")) {
                config.timezone = line.split(":")[1].trim().replace(/"/g, "");
            } else if (line.match(/^tasks:/)) {
                inTasks = true;
            } else if (inTasks && line.match(/^\s+- name:/)) {
                if (currentTask && currentTask.name) {
                    tasks.push(currentTask as HeartbeatTask);
                }
                currentTask = { name: line.split(":")[1].trim() };
            } else if (currentTask && line.includes("agent:")) {
                currentTask.agent = line.split(":")[1].trim();
            } else if (currentTask && line.includes("schedule:")) {
                currentTask.schedule = line.split(":")[1].trim().replace(/"/g, "");
            } else if (currentTask && line.includes("handler:")) {
                currentTask.handler = line.split(":")[1].trim() as "ai" | "command";
            } else if (currentTask && line.includes("model:")) {
                currentTask.model = line.split(":")[1].trim();
            } else if (currentTask && line.includes("prompt:")) {
                currentTask.prompt = line.split(":")[1].trim().replace(/"/g, "");
            } else if (currentTask && line.includes("command:")) {
                currentTask.command = line.split(":")[1].trim().replace(/"/g, "");
            } else if (currentTask && line.includes("night_mode:")) {
                currentTask.night_mode = line.split(":")[1].trim() as "skip" | "allow";
            }
        }

        // Add last task
        if (currentTask && currentTask.name) {
            tasks.push(currentTask as HeartbeatTask);
        }

        return { config, tasks };
    } catch (err: any) {
        console.error("[heartbeat-scheduler] Failed to load config:", err.message);
        return { config: {}, tasks: [] };
    }
}

/**
 * Check if current time is within active hours
 */
function isWithinActiveHours(activeHours?: string): boolean {
    if (!activeHours) return true;

    const [start, end] = activeHours.split("-");
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Execute heartbeat task
 */
async function executeTask(task: HeartbeatTask, config: HeartbeatConfig): Promise<void> {
    // Check night mode
    if (task.night_mode === "skip" && !isWithinActiveHours(config.active_hours)) {
        console.log(`[heartbeat-scheduler] Skipping ${task.name} (outside active hours)`);
        return;
    }

    console.log(`[heartbeat-scheduler] Executing: ${task.name} (${task.handler})`);

    if (task.handler === "ai") {
        // In production, send prompt to AI model
        console.log(`[heartbeat-scheduler] AI task: ${task.prompt} (model: ${task.model || "haiku"})`);
        // await sendToModel(task.model || "haiku", task.prompt);

    } else if (task.handler === "command") {
        // In production, execute shell command
        console.log(`[heartbeat-scheduler] Command: ${task.command}`);
        // const { exec } = require("child_process");
        // exec(task.command, (error, stdout, stderr) => { ... });
    }
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle system:cron events
    if (event.type !== "system" || event.action !== "cron") return;

    const workspaceDir = event.context?.workspaceDir;
    if (!workspaceDir) return;

    const { config, tasks } = loadHeartbeatConfig(workspaceDir);

    console.log(`[heartbeat-scheduler] Loaded ${tasks.length} task(s)`);

    // Execute all tasks (in production, check cron schedule)
    for (const task of tasks) {
        await executeTask(task, config);
    }
};

export default handler;
