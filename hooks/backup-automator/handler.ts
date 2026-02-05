/**
 * Backup Automator Hook
 * Automates GitHub backups with git commit and push.
 * Triggered by heartbeat scheduler.
 */

import { execSync } from "child_process";
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
    };
}

/**
 * Execute git backup
 */
function executeBackup(workspaceDir: string): { success: boolean; message: string } {
    try {
        // Check if git repo exists
        const gitDir = path.join(workspaceDir, ".git");
        if (!fs.existsSync(gitDir)) {
            return {
                success: false,
                message: "Not a git repository. Run: git init && git remote add origin <url>"
            };
        }

        // Check for changes
        const statusOutput = execSync("git status --porcelain", {
            cwd: workspaceDir,
            encoding: "utf8"
        });

        if (!statusOutput.trim()) {
            return {
                success: true,
                message: "No changes to backup"
            };
        }

        // Add all changes (respects .gitignore)
        execSync("git add .", { cwd: workspaceDir });

        // Commit with timestamp
        const timestamp = new Date().toISOString();
        const commitMsg = `Auto backup - ${timestamp}`;
        execSync(`git commit -m "${commitMsg}"`, { cwd: workspaceDir });

        // Push to remote
        execSync("git push", { cwd: workspaceDir });

        return {
            success: true,
            message: `Backup completed: ${statusOutput.split("\n").length} changes pushed`
        };

    } catch (err: any) {
        console.error("[backup-automator] Error:", err.message);

        // Check for specific errors
        if (err.message.includes("diverged")) {
            return {
                success: false,
                message: "⚠️ Branch diverged. Manual git pull required."
            };
        } else if (err.message.includes("no upstream")) {
            return {
                success: false,
                message: "⚠️ No upstream branch. Run: git push -u origin main"
            };
        }

        return {
            success: false,
            message: `Backup failed: ${err.message.split("\n")[0]}`
        };
    }
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle heartbeat:github_backup
    if (event.type !== "heartbeat" || event.action !== "github_backup") return;

    const workspaceDir = event.context?.workspaceDir;
    if (!workspaceDir) {
        console.log("[backup-automator] No workspace directory");
        return;
    }

    console.log("[backup-automator] Starting backup...");

    const result = executeBackup(workspaceDir);

    if (result.success) {
        console.log(`[backup-automator] ✅ ${result.message}`);
    } else {
        console.log(`[backup-automator] ❌ ${result.message}`);
        event.messages.push(result.message);
    }
};

export default handler;
