/**
 * Error Memory Hook
 * Coder agent learning loop - remembers error solutions.
 * Stores atomic facts for fast error resolution.
 */

import * as fs from "fs";
import * as path from "path";

interface ErrorEntry {
    id: string;
    error_pattern: string;
    solution: string;
    occurrences: number;
    last_seen: number;
}

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        workspaceDir?: string;
        error?: {
            message: string;
            stack?: string;
            code?: string;
        };
    };
}

/**
 * Get error log directory
 */
function getErrorLogDir(workspaceDir: string): string {
    return path.join(workspaceDir, "memory", "error_log");
}

/**
 * Load error index
 */
function loadErrorIndex(workspaceDir: string): ErrorEntry[] {
    const indexPath = path.join(getErrorLogDir(workspaceDir), "index.json");

    if (!fs.existsSync(indexPath)) {
        return [];
    }

    try {
        const content = fs.readFileSync(indexPath, "utf8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

/**
 * Save error index
 */
function saveErrorIndex(workspaceDir: string, entries: ErrorEntry[]): void {
    const errorLogDir = getErrorLogDir(workspaceDir);

    if (!fs.existsSync(errorLogDir)) {
        fs.mkdirSync(errorLogDir, { recursive: true });
    }

    const indexPath = path.join(errorLogDir, "index.json");
    fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2), "utf8");
}

/**
 * Search for similar error
 */
function searchErrorSolution(workspaceDir: string, errorMessage: string): ErrorEntry | null {
    const entries = loadErrorIndex(workspaceDir);

    for (const entry of entries) {
        const regex = new RegExp(entry.error_pattern, "i");
        if (regex.test(errorMessage)) {
            console.log(`[error-memory] 💡 Found solution: ${entry.id}`);
            return entry;
        }
    }

    return null;
}

/**
 * Store new error solution
 */
function storeErrorSolution(
    workspaceDir: string,
    errorMessage: string,
    solution: string
): void {
    const entries = loadErrorIndex(workspaceDir);

    // Generate ID
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Create entry
    const newEntry: ErrorEntry = {
        id,
        error_pattern: errorMessage.slice(0, 100), // First 100 chars as pattern
        solution,
        occurrences: 1,
        last_seen: Date.now()
    };

    entries.push(newEntry);

    // Save index
    saveErrorIndex(workspaceDir, entries);

    // Save detailed solution as markdown
    const solutionPath = path.join(getErrorLogDir(workspaceDir), `${id}.md`);
    const markdown = `# ${id}

## Error
\`\`\`
${errorMessage}
\`\`\`

## Solution
${solution}

## Metadata
- First seen: ${new Date().toISOString()}
- Occurrences: 1
`;

    fs.writeFileSync(solutionPath, markdown, "utf8");

    console.log(`[error-memory] 📝 Stored solution: ${id}`);
}

/**
 * Update error occurrence
 */
function updateErrorOccurrence(workspaceDir: string, entry: ErrorEntry): void {
    const entries = loadErrorIndex(workspaceDir);

    const index = entries.findIndex(e => e.id === entry.id);
    if (index !== -1) {
        entries[index].occurrences++;
        entries[index].last_seen = Date.now();
        saveErrorIndex(workspaceDir, entries);
    }
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:error events
    if (event.type !== "agent" || event.action !== "error") return;

    const workspaceDir = event.context?.workspaceDir;
    const errorMsg = event.context?.error?.message;

    if (!workspaceDir || !errorMsg) return;

    console.log(`[error-memory] Error encountered: ${errorMsg.slice(0, 50)}...`);

    // Search for existing solution
    const existingSolution = searchErrorSolution(workspaceDir, errorMsg);

    if (existingSolution) {
        // Apply stored solution
        updateErrorOccurrence(workspaceDir, existingSolution);
        event.messages.push(`💡 Known error. Solution: ${existingSolution.solution}`);
        console.log(`[error-memory] Applied stored solution (${existingSolution.occurrences} occurrences)`);

    } else {
        // New error - would research online and store
        console.log("[error-memory] New error, would research and store solution");
        event.messages.push("🔍 New error detected. Researching solution...");

        // Mock: Store a solution immediately for testing
        const mockSolution = "Mock solution: Check documentation and retry";
        storeErrorSolution(workspaceDir, errorMsg, mockSolution);
    }
};

export default handler;
