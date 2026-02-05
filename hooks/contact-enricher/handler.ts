/**
 * Contact Enricher Hook
 * Enriches contacts with profile names from WhatsApp metadata.
 * Creates and updates contact records.
 */

import * as fs from "fs";
import * as path from "path";

interface Contact {
    id: string;
    name: string;
    category: "admin" | "trusted" | "blocked" | "unknown";
    phone: string;
    created_at: number;
    last_seen: number;
    message_count: number;
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
        channelMetadata?: {
            pushName?: string;  // WhatsApp profile name
            isGroup?: boolean;
        };
    };
}

/**
 * Get contacts storage directory
 */
function getContactsDir(workspaceDir: string): string {
    return path.join(workspaceDir, "storage", "contacts");
}

/**
 * Load contact
 */
function loadContact(workspaceDir: string, phoneNumber: string): Contact | null {
    const contactPath = path.join(getContactsDir(workspaceDir), `${phoneNumber}.json`);

    if (!fs.existsSync(contactPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(contactPath, "utf8");
        return JSON.parse(content);
    } catch {
        return null;
    }
}

/**
 * Save contact
 */
function saveContact(workspaceDir: string, contact: Contact): void {
    const contactsDir = getContactsDir(workspaceDir);

    if (!fs.existsSync(contactsDir)) {
        fs.mkdirSync(contactsDir, { recursive: true });
    }

    const contactPath = path.join(contactsDir, `${contact.phone}.json`);
    fs.writeFileSync(contactPath, JSON.stringify(contact, null, 2), "utf8");
}

/**
 * Determine contact category
 */
function determineCategory(workspaceDir: string, phoneNumber: string): Contact["category"] {
    // Check contacts.yaml for admin/trusted/blocked
    const contactsYamlPath = path.join(workspaceDir, "memory", "contacts.yaml");

    if (!fs.existsSync(contactsYamlPath)) {
        return "unknown";
    }

    try {
        const content = fs.readFileSync(contactsYamlPath, "utf8");

        if (content.includes(`admin:`) && content.includes(phoneNumber)) {
            return "admin";
        } else if (content.includes(`trusted:`) && content.includes(phoneNumber)) {
            return "trusted";
        } else if (content.includes(`blocked:`) && content.includes(phoneNumber)) {
            return "blocked";
        }
    } catch {
        // Ignore errors
    }

    return "unknown";
}

/**
 * Create or update contact
 */
function enrichContact(
    workspaceDir: string,
    phoneNumber: string,
    profileName: string
): Contact {
    let contact = loadContact(workspaceDir, phoneNumber);

    if (contact) {
        // Update existing
        contact.last_seen = Date.now();
        contact.message_count++;

        // Update name if changed
        if (contact.name !== profileName) {
            console.log(`[contact-enricher] Name updated: ${contact.name} → ${profileName}`);
            contact.name = profileName;
        }

    } else {
        // Create new
        contact = {
            id: phoneNumber,
            name: profileName,
            category: determineCategory(workspaceDir, phoneNumber),
            phone: phoneNumber,
            created_at: Date.now(),
            last_seen: Date.now(),
            message_count: 1
        };

        console.log(`[contact-enricher] New contact: ${profileName} (${phoneNumber})`);
    }

    saveContact(workspaceDir, contact);
    return contact;
}

/**
 * Main hook handler
 */
const handler = async (event: HookEvent): Promise<void> => {
    // Only handle WhatsApp messages
    if (event.context?.commandSource !== "whatsapp") return;
    if (event.type !== "agent" || event.action !== "message") return;

    const senderId = event.context?.senderId;
    const profileName = event.context?.channelMetadata?.pushName;
    const workspaceDir = event.context?.workspaceDir;

    if (!senderId || !workspaceDir) return;

    // Use profile name or default to phone number
    const displayName = profileName || senderId;

    const contact = enrichContact(workspaceDir, senderId, displayName);

    console.log(`[contact-enricher] Contact: ${contact.name} (${contact.category}, ${contact.message_count} msgs)`);
};

export default handler;
