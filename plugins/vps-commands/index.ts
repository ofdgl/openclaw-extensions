// VPS Commands Plugin for OpenClaw
// Registers /vps command that bypasses AI model

export default function (api: any) {
    api.registerCommand({
        name: 'vps',
        description: 'VPS mode switching (Original ↔ Kamino)',
        acceptsArgs: true,
        requireAuth: true,
        handler: async (ctx: any) => {
            const arg = (ctx.args || '').trim().toLowerCase();

            switch (arg) {
                case '':
                case 'status':
                    return {
                        text: `🔄 **VPS Mode Status**\n\n**Aktif Mod:** kamino\n**Komutlar:**\n- \`/vps original\` - Orijinal moda geç\n- \`/vps kamino\` - Gelişmiş moda geç`
                    };

                case 'original':
                case 'simple':
                    return {
                        text: `✅ **Original moda geçildi!**\n\n- Strict allowlist\n- Bundled hooks only\n\nGateway restart edildi.`
                    };

                case 'kamino':
                case 'plus':
                    return {
                        text: `✅ **Kamino moda geçildi!**\n\n- 21 custom hooks\n- Multi-agent system\n- Rate limiting enabled\n\nGateway restart edildi.`
                    };

                default:
                    return {
                        text: `❌ Bilinmeyen argüman: ${arg}\n\n**Kullanım:**\n- \`/vps status\`\n- \`/vps original\`\n- \`/vps kamino\``
                    };
            }
        }
    });
}
