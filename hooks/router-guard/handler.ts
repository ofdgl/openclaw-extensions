/**
 * Router Guard Hook
 * Filters messages based on country code (+90 only) and contact list.
 * Routes unknown +90 numbers to guest workspace with limited access.
 */

import * as fs from "fs";
import * as path from "path";

interface ContactList {
    admin?: string[];
    trusted?: string[];
    blocked?: string[];
}

interface BootstrapFile {
    path: string;
    content: string;
}

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
        bootstrapFiles?: BootstrapFile[];
        cfg?: any;
    };
}

const TURKEY_PREFIX = "+90";

// Guest agent limited SOUL
const GUEST_SOUL = `# Guest Mode

You are Kowalski's assistant in limited guest mode.

## Rules
- Be helpful but brief
- Do not access files outside sandbox
- Do not send messages to other contacts
- Max 5 messages per conversation
- If user needs more help, suggest they contact the admin

## Personality
Professional, helpful, concise.
`;

/**
 * Parse contacts.yaml with simple regex (no yaml dependency)
 */
function parseContacts(content: string): ContactList {
    const contacts: ContactList = { admin: [], trusted: [], blocked: [] };
    const lines = content.split("\n");
    let currentKey: keyof ContactList | null = null;

    for (const line of lines) {
        if (line.match(/^admin:/)) currentKey = "admin";
        else if (line.match(/^trusted:/)) currentKey = "trusted";
        else if (line.match(/^blocked:/)) currentKey = "blocked";
        else if (line.match(/^\s+-\s*["']?\+\d+/) && currentKey) {
            const num = line.match(/\+\d+/)?.[0];
            if (num) {
                contacts[currentKey]!.push(num);
            }
        }
    }
    return contacts;
}

/**
 * Load contacts from workspace
 */
function loadContacts(workspaceDir: string): ContactList {
    const contactsPath = path.join(workspaceDir, "memory", "contacts.yaml");

    try {
        if (fs.existsSync(contactsPath)) {
            const content = fs.readFileSync(contactsPath, "utf8");
            return parseContacts(content);
        }
    } catch (err) {
        console.error("[router-guard] Failed to load contacts:", err);
    }

    return { admin: [], trusted: [], blocked: [] };
}

/**
 * Inject guest bootstrap files for unknown +90 users
 */
function injectGuestBootstrap(event: HookEvent): void {
    if (!event.context.bootstrapFiles) {
        event.context.bootstrapFiles = [];
    }

    // Replace or add SOUL.md with guest version
    const soulIndex = event.context.bootstrapFiles.findIndex(
        f => f.path.endsWith("SOUL.md")
    );

    const guestSoulFile: BootstrapFile = {
        path: "SOUL.md",
        content: GUEST_SOUL
    };

    if (soulIndex >= 0) {
        event.context.bootstrapFiles[soulIndex] = guestSoulFile;
    } else {
        event.context.bootstrapFiles.push(guestSoulFile);
    }

    // Add guest mode marker
    event.context.bootstrapFiles.push({
        path: "GUEST_MODE.md",
        content: "# Guest Mode Active\nLimited tools and context."
    });
}

/**
 * Block sender by clearing bootstrap files
 */
function blockSender(event: HookEvent, reason: string): void {
    console.log(`[router-guard] BLOCKED: ${event.context.senderId} (${reason})`);

    if (event.context.bootstrapFiles) {
        event.context.bootstrapFiles.length = 0;
    }
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:bootstrap events
    if (event.type !== "agent" || event.action !== "bootstrap") return;

    const senderId = event.context?.senderId;
    const channel = event.context?.commandSource;

    // Only filter WhatsApp messages
    if (channel !== "whatsapp" || !senderId) return;

    // Check country code - block non-Turkey numbers
    if (!senderId.startsWith(TURKEY_PREFIX)) {
        blockSender(event, "not +90");
        return;
    }

    // Load contacts from workspace
    const workspaceDir = event.context?.workspaceDir;
    if (!workspaceDir) return;

    const contacts = loadContacts(workspaceDir);

    const isAdmin = contacts.admin?.includes(senderId);
    const isTrusted = contacts.trusted?.includes(senderId);
    const isBlocked = contacts.blocked?.includes(senderId);

    // Block explicitly blocked numbers
    if (isBlocked) {
        blockSender(event, "in blocklist");
        return;
    }

    // Route based on contact category
    if (isAdmin) {
        console.log(`[router-guard] ADMIN: ${senderId} → full access`);
        // Admin gets full access, no modification needed

    } else if (isTrusted) {
        console.log(`[router-guard] TRUSTED: ${senderId} → main workspace`);
        // Trusted gets main agent, tool filtering handled by context builder

    } else {
        console.log(`[router-guard] GUEST: ${senderId} → guest workspace`);
        // Unknown +90 → inject guest bootstrap
        injectGuestBootstrap(event);
    }
};

export default handler;
