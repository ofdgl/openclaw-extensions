/**
 * Intent Classifier Hook
 * Classifies message intent for context window optimization.
 * Uses zero-token heuristics + model self-report fallback.
 */

import * as fs from "fs";
import * as path from "path";

type Intent = "command" | "greeting" | "question" | "task" | "coding" | "research";

interface HookEvent {
    type: string;
    action: string;
    sessionKey: string;
    timestamp: Date;
    messages: string[];
    context: {
        senderId?: string;
        commandSource?: string;
        workspaceDir?: string;
        bootstrapFiles?: any[];
        messageText?: string;
        sessionMetadata?: Record<string, any>;
    };
}

// Coding keywords (Turkish + English) - use word boundaries
const CODING_KEYWORDS = [
    "\\bkod\\b", "\\bkodu\\b", "\\bscript\\b", "\\bfunction\\b", "\\bclass\\b", "\\bdef\\b", "\\bimport\\b",
    "\\bconst\\b", "\\blet\\b", "\\bvar\\b", "\\basync\\b", "\\bawait\\b", "\\breturn\\b", "\\bexport\\b",
    "\\bfonksiyon\\b", "\\bsınıf\\b", "\\bmodül\\b", "\\bpaket\\b", "\\balgorithm\\b", "\\bal algoritma\\b"
];

// Greeting patterns (Turkish)
const GREETING_PATTERNS = [
    "merhaba", "selam", "günaydın", "iyi akşamlar",
    "nasılsın", "naber", "selamün aleyküm", "hello", "hi"
];

/**
 * Get session metadata storage path
 */
function getSessionMetadataPath(workspaceDir: string, sessionKey: string): string {
    return path.join(workspaceDir, "memory", "sessions", `${sessionKey.replace(/:/g, "_")}.json`);
}

/**
 * Load previous intent from session
 */
function loadPreviousIntent(workspaceDir: string, sessionKey: string): Intent | null {
    const metadataPath = getSessionMetadataPath(workspaceDir, sessionKey);

    try {
        if (fs.existsSync(metadataPath)) {
            const content = fs.readFileSync(metadataPath, "utf8");
            const metadata = JSON.parse(content);
            return metadata.intent || null;
        }
    } catch {
        // Ignore errors
    }

    return null;
}

/**
 * Save intent to session
 */
function saveIntent(workspaceDir: string, sessionKey: string, intent: Intent): void {
    const metadataPath = getSessionMetadataPath(workspaceDir, sessionKey);
    const metadataDir = path.dirname(metadataPath);

    try {
        if (!fs.existsSync(metadataDir)) {
            fs.mkdirSync(metadataDir, { recursive: true });
        }

        let metadata: any = {};
        if (fs.existsSync(metadataPath)) {
            const content = fs.readFileSync(metadataPath, "utf8");
            metadata = JSON.parse(content);
        }

        metadata.intent = intent;
        metadata.lastUpdated = Date.now();

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
    } catch (err) {
        console.error("[intent-classifier] Failed to save intent:", err);
    }
}

/**
 * Classify intent using heuristics
 */
function classifyIntent(message: string, previousIntent: Intent | null): Intent | "ask_model" {
    // 1. Command detection
    if (message.startsWith("/")) {
        return "command";
    }

    // 2. Short message → reuse previous intent
    if (message.length < 20 && previousIntent) {
        return previousIntent;
    }

    // 3. Greeting detection (BEFORE coding to avoid false positives)
    const lowerMessage = message.toLowerCase();
    if (GREETING_PATTERNS.some(pattern => lowerMessage.includes(pattern))) {
        return "greeting";
    }

    // 4. Coding keyword detection (use word boundaries)
    if (CODING_KEYWORDS.some(pattern => new RegExp(pattern, "i").test(lowerMessage))) {
        return "coding";
    }

    // 5. Long message without clear intent → task
    if (message.length > 500) {
        return "task";
    }

    // 6. Default: ask model
    return "ask_model";
}

/**
 * Add intent prompt to bootstrap files
 */
function addIntentPrompt(event: HookEvent): void {
    if (!event.context.bootstrapFiles) {
        event.context.bootstrapFiles = [];
    }

    const intentPromptFile = {
        path: "INTENT_PROMPT.md",
        content: `# Intent Classification

At the end of your response, add one of these tags:
- [intent: greeting] - for greetings and small talk
- [intent: question] - for simple questions
- [intent: task] - for normal tasks
- [intent: coding] - for code generation or debugging
- [intent: research] - for complex research tasks

Example:
"Here's your code... [intent: coding]"
`
    };

    event.context.bootstrapFiles.push(intentPromptFile);
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:bootstrap
    if (event.type !== "agent" || event.action !== "bootstrap") return;

    const workspaceDir = event.context?.workspaceDir;
    if (!workspaceDir) return;

    // Get message text (might be in different places depending on OpenClaw version)
    const messageText = event.context?.messageText || "";
    if (!messageText) return;

    // Load previous intent
    const previousIntent = loadPreviousIntent(workspaceDir, event.sessionKey);

    // Classify intent
    const intent = classifyIntent(messageText, previousIntent);

    if (intent === "ask_model") {
        // Add intent prompt for model self-report
        addIntentPrompt(event);
        console.log(`[intent-classifier] Cannot determine → asking model`);
    } else {
        // Save determined intent
        saveIntent(workspaceDir, event.sessionKey, intent);
        console.log(`[intent-classifier] Classified as: ${intent}`);

        // Store in context for other hooks
        if (!event.context.sessionMetadata) {
            event.context.sessionMetadata = {};
        }
        event.context.sessionMetadata.intent = intent;
    }
};

export default handler;
