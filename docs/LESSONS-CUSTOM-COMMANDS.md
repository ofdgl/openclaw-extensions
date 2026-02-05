# OpenClaw Custom Slash Command - Lessons Learned

**Date:** 2026-02-05
**Status:** Failed - Parked for future research

## Goal

Create a custom `/vps` command that:
- Bypasses the AI model completely
- Responds instantly without token usage
- Allows admin to switch between "original" and "kamino" modes

## What We Learned

### 1. Hooks DON'T Work for Custom Commands

**Tried:** Creating a hook with `events: ["command"]`

**Problem:** The `command` event type only fires for OpenClaw's built-in commands:
- `/new` - New session
- `/reset` - Reset session
- `/stop` - Stop agent
- `/status` - Show status (built-in)

Custom `/vps` is NOT a built-in command, so the `command` event never fires. The message goes straight to the AI agent.

**Docs Quote:** "Short-Circuiting (Kısa Devre) - Slash commands are intercepted by Core before reaching the Assembler/Model"

### 2. Plugin API Has Strict Requirements

**Tried:** Using `api.registerCommand()` from the Plugin API

**Docs say:** "Plugin commands are processed before built-in commands and the AI agent"

**What we tried:**
```javascript
export default function(api) {
  api.registerCommand({
    name: 'vps',
    description: 'VPS mode switching',
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx) => {
      return { text: 'Mode: kamino' };
    }
  });
}
```

**Failures in sequence:**
1. `Error: package.json missing openclaw.extension` → Added package.json
2. `Error: missing openclaw.extensions` (plural) → Wrong field name
3. `Error: plugin manifest requires configSchema` → Added configSchema
4. Plugin loaded but command didn't register → Unknown reason
5. TypeScript version → Gateway crashed with "1006 abnormal closure"

### 3. Required Plugin Manifest Structure

Based on docs, a proper plugin needs:

```json
// openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "entry": "./index.ts",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "someConfig": { "type": "string" }
    }
  }
}
```

### 4. Plugin Discovery Locations

- `~/.openclaw/extensions/*.ts` - Single file plugins
- `~/.openclaw/extensions/*/index.ts` - Folder plugins
- `plugins.load.paths` in config - Custom paths

### 5. Skills with `command-tool: bash` Don't Work

**Tried:** Creating a skill that uses bash tool

**Result:** "Tool not available: bash"

**Reason:** The bash tool is not exposed to the agent by default. Need to enable it in config.

## Future Approaches to Try

1. **Study official plugins** - Clone @openclaw/voice-call and see exact manifest structure
2. **Enable bash tool** - Add `commands.bash = true` to config, then use skill
3. **Cloudflare Worker webhook** - Intercept messages before they reach OpenClaw
4. **Ask OpenClaw community** - Discord/GitHub for custom command examples

## Key Files (Deleted but Documented)

```
plugins/vps-commands/
├── index.js          # registerCommand attempt
├── index.ts          # TypeScript version
├── package.json      # ES module config
└── openclaw.plugin.json  # Plugin manifest with configSchema
```

## Commands We Ran

```bash
# Install plugin (all failed)
openclaw plugins install ./plugins/vps-commands

# Manual copy to extensions
cp -r plugins/vps-commands ~/.openclaw/extensions/

# Single file approach
cat > ~/.openclaw/extensions/vps-commands.ts << 'EOF'
export default function(api) { ... }
EOF

# Checking plugin status
openclaw plugins list
openclaw plugins info vps-commands
```

## Config Settings Tried

```json
{
  "plugins": {
    "entries": {
      "vps-commands": {
        "enabled": true,
        "config": {}
      }
    }
  }
}
```

## Conclusion

OpenClaw's plugin system requires more research. The docs show `api.registerCommand()` but getting a plugin to load correctly with all the manifest requirements is tricky. Need to study a working official plugin to understand the exact structure.

For now, custom slash commands that bypass the AI are NOT possible with our current understanding.
