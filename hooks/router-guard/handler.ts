/**
 * Router Guard Hook — Security Layer
 * 
 * Now that multi-agent routing is handled natively by OpenClaw bindings[],
 * this hook focuses ONLY on security:
 * 
 * 1. Country filter — block non-+90 DMs (WhatsApp only)
 * 2. Contact classification — admin/trusted/blocked
 * 3. Blocked sender rejection
 * 4. Logging
 * 
 * Agent routing is done by openclaw.json bindings:
 *   - Coder group → coder agent (peer binding)
 *   - Everything else → main agent (default)
 *   - Unregistered groups → dropped by groupPolicy: allowlist
 */

import * as fs from "fs";

// ── Interfaces ──

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
        [key: string]: any;
    };
}

// ── Constants ──

const TURKEY_PREFIX = "+90";
const CONTACTS_PATH = "/root/.openclaw/workspace/memory/contacts.yaml";

// ── Contact Loading ──

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
            if (num) contacts[currentKey]!.push(num);
        }
    }
    return contacts;
}

function loadContacts(): ContactList {
    try {
        if (fs.existsSync(CONTACTS_PATH)) {
            return parseContacts(fs.readFileSync(CONTACTS_PATH, "utf8"));
        }
    } catch (err) {
        console.error("[router-guard] Failed to load contacts:", err);
    }
    return { admin: [], trusted: [], blocked: [] };
}

/**
 * Block by clearing bootstrap files and messages — prevents any AI processing
 */
function blockSender(event: HookEvent, reason: string): void {
    console.log(`[router-guard] BLOCKED: ${event.context.senderId || "unknown"} (${reason})`);
    if (event.context.bootstrapFiles) event.context.bootstrapFiles.length = 0;
    if (event.messages) event.messages.length = 0;
}

// ── Main Handler ──

const handler = async (event: HookEvent): Promise<void> => {
    // Only handle agent:bootstrap events
    if (event.type !== "agent" || event.action !== "bootstrap") return;

    const senderId = event.context?.senderId;
    const channel = event.context?.commandSource;

    // Only filter WhatsApp messages
    if (channel !== "whatsapp") return;

    // Groups are handled by native bindings + groupPolicy allowlist
    // No need to filter here — unregistered groups never reach this hook
    const isGroup = event.sessionKey.includes(":group:") || event.sessionKey.includes("@g.us");
    if (isGroup) {
        console.log(`[router-guard] GROUP: ${event.sessionKey} — routed by native binding`);
        return;
    }

    // ── DM Security ──
    if (!senderId) return;

    // Country filter — only +90 (Turkey) allowed
    if (!senderId.startsWith(TURKEY_PREFIX)) {
        blockSender(event, `country filter: ${senderId.slice(0, 4)}...`);
        return;
    }

    const contacts = loadContacts();

    // Blocked contacts
    if (contacts.blocked?.includes(senderId)) {
        blockSender(event, "blocklist");
        return;
    }

    // Classification logging
    if (contacts.admin?.includes(senderId)) {
        console.log(`[router-guard] ADMIN: ${senderId}`);
    } else if (contacts.trusted?.includes(senderId)) {
        console.log(`[router-guard] TRUSTED: ${senderId}`);
    } else {
        console.log(`[router-guard] GUEST: ${senderId} (unknown +90)`);
    }
};

export default handler;
