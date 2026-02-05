/**
 * Daily Standup Hook
 * 
 * Generates and sends a comprehensive daily summary of all agent activity
 * to the admin via WhatsApp.
 * 
 * Event: heartbeat:daily_standup
 * Schedule: Daily at 23:30 IST
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface HookEvent {
    type: string;
    context: any;
}

interface BillingEntry {
    timestamp: string;
    sender_id: string;
    agent: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
}

interface SecurityEvent {
    timestamp: string;
    event: string;
    level: 'critical' | 'warning' | 'info';
    details: string;
}

interface AgentStatus {
    name: string;
    status: 'active' | 'idle' | 'blocked';
    lastSeen: string;
    currentTask?: string;
}

const OPENCLAW_DIR = join(homedir(), '.openclaw-kamino');
const BILLING_LOG = join(OPENCLAW_DIR, 'logs', 'billing.jsonl');
const SECURITY_LOG = join(OPENCLAW_DIR, 'logs', 'security.jsonl');
const WORKSPACES_DIR = join(OPENCLAW_DIR, 'workspaces');

const handler = async (event: HookEvent): Promise<void> => {
    // Only process daily_standup heartbeat event
    if (event.type !== 'heartbeat:daily_standup') {
        return;
    }

    try {
        const summary = await generateDailySummary();

        // Send to admin via WhatsApp
        await sendToAdmin(summary);

        console.log('[daily-standup] Daily summary sent');
    } catch (error) {
        console.error('[daily-standup] Error generating summary:', error);
    }
};

async function generateDailySummary(): Promise<string> {
    const today = new Date().toISOString().split('T')[0];

    // Get data
    const tokenStats = getTokenUsage(today);
    const securityEvents = getSecurityEvents(today);
    const agentStatus = getAgentStatus();
    const tasks = getTasks();

    // Format summary
    const date = new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    let summary = `📊 DAILY STANDUP — ${date}\n\n`;

    // Completed tasks
    const completed = tasks.filter((t) => t.status === 'done');
    if (completed.length > 0) {
        summary += '✅ COMPLETED TODAY\n';
        for (const task of completed) {
            summary += `• ${task.agent}: ${task.description}\n`;
        }
        summary += '\n';
    }

    // In progress
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    if (inProgress.length > 0) {
        summary += '🔄 IN PROGRESS\n';
        for (const task of inProgress) {
            summary += `• ${task.agent}: ${task.description}\n`;
        }
        summary += '\n';
    }

    // Blocked
    const blocked = tasks.filter((t) => t.status === 'blocked');
    if (blocked.length > 0) {
        summary += '🚫 BLOCKED\n';
        for (const task of blocked) {
            summary += `• ${task.agent}: ${task.description}\n`;
        }
        summary += '\n';
    } else {
        summary += '🚫 BLOCKED\n• None\n\n';
    }

    // Token usage
    summary += '💰 TOKEN USAGE\n';
    for (const [agent, stats] of Object.entries(tokenStats)) {
        const totalTokens = stats.input + stats.output;
        const cost = stats.cost.toFixed(2);
        summary += `• ${capitalize(agent)}: ${totalTokens.toLocaleString()} tokens ($${cost})\n`;
    }
    const totalCost = Object.values(tokenStats).reduce((sum, s) => sum + s.cost, 0);
    const totalTokens = Object.values(tokenStats).reduce(
        (sum, s) => sum + s.input + s.output,
        0
    );
    summary += `• Total: ${totalTokens.toLocaleString()} tokens ($${totalCost.toFixed(2)})\n\n`;

    // Security summary
    const critical = securityEvents.filter((e) => e.level === 'critical').length;
    const warnings = securityEvents.filter((e) => e.level === 'warning').length;
    const info = securityEvents.filter((e) => e.level === 'info').length;

    summary += '🔒 SECURITY\n';
    summary += `• ${critical} critical events\n`;
    summary += `• ${warnings} warnings\n`;
    summary += `• ${info} info events\n\n`;

    // Agent health
    summary += '👥 AGENT HEALTH\n';
    for (const agent of agentStatus) {
        const emoji = agent.status === 'active' ? '✅' : '💤';
        const status = capitalize(agent.status);
        summary += `${emoji} ${agent.name} - ${status} (last seen: ${agent.lastSeen})\n`;
    }

    return summary;
}

function getTokenUsage(date: string): Record<string, { input: number; output: number; cost: number }> {
    const stats: Record<string, { input: number; output: number; cost: number }> = {};

    if (!existsSync(BILLING_LOG)) {
        return stats;
    }

    const lines = readFileSync(BILLING_LOG, 'utf-8').trim().split('\n');

    for (const line of lines) {
        if (!line) continue;

        try {
            const entry: BillingEntry = JSON.parse(line);

            // Filter by today's date
            if (!entry.timestamp.startsWith(date)) continue;

            const agent = entry.agent || 'unknown';

            if (!stats[agent]) {
                stats[agent] = { input: 0, output: 0, cost: 0 };
            }

            stats[agent].input += entry.input_tokens || 0;
            stats[agent].output += entry.output_tokens || 0;
            stats[agent].cost += entry.cost_usd || 0;
        } catch (e) {
            // Skip malformed lines
        }
    }

    return stats;
}

function getSecurityEvents(date: string): SecurityEvent[] {
    const events: SecurityEvent[] = [];

    if (!existsSync(SECURITY_LOG)) {
        return events;
    }

    const lines = readFileSync(SECURITY_LOG, 'utf-8').trim().split('\n');

    for (const line of lines) {
        if (!line) continue;

        try {
            const event: SecurityEvent = JSON.parse(line);

            // Filter by today's date
            if (event.timestamp.startsWith(date)) {
                events.push(event);
            }
        } catch (e) {
            // Skip malformed lines
        }
    }

    return events;
}

function getAgentStatus(): AgentStatus[] {
    const agents = ['admin', 'security', 'demo', 'intern'];
    const status: AgentStatus[] = [];

    for (const agent of agents) {
        const workingFile = join(WORKSPACES_DIR, agent, 'memory', 'WORKING.md');

        let lastSeen = 'Never';
        let currentTask: string | undefined;
        let agentStatus: 'active' | 'idle' | 'blocked' = 'idle';

        if (existsSync(workingFile)) {
            const content = readFileSync(workingFile, 'utf-8');
            const lines = content.split('\n');

            // Extract current task
            for (const line of lines) {
                if (line.startsWith('## Current Task')) {
                    const taskLine = lines[lines.indexOf(line) + 1];
                    if (taskLine) {
                        currentTask = taskLine.trim();
                        agentStatus = 'active';
                    }
                }
                if (line.startsWith('## Status') && line.includes('blocked')) {
                    agentStatus = 'blocked';
                }
            }

            // Get last modified time
            const fs = require('fs');
            const stats = fs.statSync(workingFile);
            const lastModified = new Date(stats.mtime);
            lastSeen = lastModified.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        status.push({
            name: capitalize(agent),
            status: agentStatus,
            lastSeen,
            currentTask,
        });
    }

    return status;
}

function getTasks(): Array<{ agent: string; description: string; status: string }> {
    // This is a simplified version
    // In a full implementation, this would read from a task database or JSONL file

    const tasks: Array<{ agent: string; description: string; status: string }> = [];

    // Check each agent's WORKING.md for tasks
    const agents = ['admin', 'security', 'demo', 'intern'];

    for (const agent of agents) {
        const workingFile = join(WORKSPACES_DIR, agent, 'memory', 'WORKING.md');

        if (existsSync(workingFile)) {
            const content = readFileSync(workingFile, 'utf-8');
            const lines = content.split('\n');

            let currentTask = '';
            let status = 'unknown';

            for (const line of lines) {
                if (line.startsWith('## Current Task')) {
                    const taskLine = lines[lines.indexOf(line) + 1];
                    if (taskLine) {
                        currentTask = taskLine.trim();
                    }
                }
                if (line.startsWith('## Status')) {
                    const statusLine = lines[lines.indexOf(line) + 1];
                    if (statusLine) {
                        status = statusLine.toLowerCase().includes('done')
                            ? 'done'
                            : statusLine.toLowerCase().includes('blocked')
                                ? 'blocked'
                                : 'in_progress';
                    }
                }
            }

            if (currentTask) {
                tasks.push({
                    agent: capitalize(agent),
                    description: currentTask,
                    status,
                });
            }
        }
    }

    return tasks;
}

async function sendToAdmin(summary: string): Promise<void> {
    // In a real implementation, this would send via OpenClaw's messaging system
    // For now, we log it and expect the Gateway to pick it up

    console.log('[daily-standup] Summary:', summary);

    // Write to a file that the Gateway can monitor
    const summaryFile = join(OPENCLAW_DIR, 'data', 'daily-standup.txt');
    const fs = require('fs');
    fs.writeFileSync(summaryFile, summary, 'utf-8');
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default handler;
