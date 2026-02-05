import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const MODE_FILE = join(homedir(), '.openclaw-mode');
const KAMINO_DIR = join(homedir(), '.openclaw-kamino');
const ORIGINAL_DIR = join(homedir(), '.openclaw-original');
const ACTIVE_LINK = join(homedir(), '.openclaw-active');
const ADMIN_PHONE = '+905357874261';

function getCurrentMode() {
    try {
        return readFileSync(MODE_FILE, 'utf-8').trim();
    } catch {
        return 'unknown';
    }
}

function getActiveLink() {
    try {
        return execSync(`readlink ${ACTIVE_LINK}`).toString().trim();
    } catch {
        return 'not set';
    }
}

function switchMode(mode) {
    const targetDir = mode === 'original' ? ORIGINAL_DIR : KAMINO_DIR;

    try {
        execSync(`echo "${mode}" > ${MODE_FILE}`);
        execSync(`ln -sfn ${targetDir} ${ACTIVE_LINK}`);
        execSync(`systemctl restart openclaw-gateway 2>/dev/null || openclaw gateway restart`);
        return true;
    } catch (e) {
        return false;
    }
}

export default function (api) {
    api.registerCommand({
        name: 'vps',
        description: 'VPS mode switching (Original ↔ Kamino)',
        acceptsArgs: true,
        requireAuth: true,
        handler: async (ctx) => {
            // Admin check
            if (ctx.senderId !== ADMIN_PHONE && !ctx.senderId?.includes('884883550')) {
                return { text: '❌ Bu komut sadece admin tarafından kullanılabilir.' };
            }

            const arg = (ctx.args || '').trim().toLowerCase();

            switch (arg) {
                case '':
                case 'status':
                    const mode = getCurrentMode();
                    const link = getActiveLink();
                    return {
                        text: `🔄 **VPS Mode Status**\n\n**Aktif Mod:** ${mode}\n**Symlink:** ${link}\n\n**Komutlar:**\n- \`/vps original\` - Orijinal moda geç\n- \`/vps kamino\` - Gelişmiş moda geç`
                    };

                case 'original':
                case 'simple':
                    if (switchMode('original')) {
                        return {
                            text: `✅ **Original moda geçildi!**\n\n- Strict allowlist\n- Bundled hooks only\n\nGateway restart edildi.`
                        };
                    }
                    return { text: '❌ Mode switch başarısız oldu.' };

                case 'kamino':
                case 'plus':
                    if (switchMode('kamino')) {
                        return {
                            text: `✅ **Kamino moda geçildi!**\n\n- 21 custom hooks\n- Multi-agent system\n- Rate limiting enabled\n\nGateway restart edildi.`
                        };
                    }
                    return { text: '❌ Mode switch başarısız oldu.' };

                default:
                    return {
                        text: `❌ Bilinmeyen argüman: ${arg}\n\n**Kullanım:**\n- \`/vps status\`\n- \`/vps original\`\n- \`/vps kamino\``
                    };
            }
        }
    });
}
