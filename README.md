# OpenClaw Extensions (Kamino)

**Complete OpenClaw hooks collection: 20 production-ready hooks + VPS mode switching**

Enterprise-grade AI orchestration system built on OpenClaw, featuring intelligent routing, multi-agent coordination, security monitoring, and automated task management.

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/ofdgl/openclaw-extensions.git
cd openclaw-extensions

# Option 1: Interactive wizard (recommended)
./wizard.sh

# Option 2: Manual install
npm install
cp -r hooks/* ~/.openclaw/hooks/
openclaw gateway restart
```

---

## 📦 What's Included

### 🎯 20 Production Hooks

| Category | Hooks | Purpose |
|----------|-------|---------|
| **Security** | router-guard, secret-guard, rate-limiter | Access control, API key redaction, token limits |
| **Analytics** | billing-tracker, intent-classifier, context-optimizer | Cost tracking, intent detection, history optimization |
| **Safety** | loop-detector, emergency-bypass, handoff-manager | Timeout protection, admin override, model escalation |
| **Automation** | heartbeat-scheduler, backup-automator, error-memory | Cron tasks, git backup, learning loop |
| **Intelligence** | image-processor, model-fallback | Gemini vision, OpenRouter free tier |
| **Coordination** | mention-notifier, task-lock-manager, contact-enricher | Agent @mentions, distributed locks, profile extraction |
| **Monitoring** | security-reporter | Daily audit reports |
| **VPS** | vps-mode-switch | Original ↔ Kamino mode switching |

### 🤖 4 Specialized Agents

- **Admin** - Full access, all tools (Claude Sonnet 4)
- **Security** - Audit & monitoring (Claude Haiku)
- **Demo** - Sandbox for new users (Claude Haiku)
- **Intern** - Minimal permissions (Claude Haiku)

### ⚙️ Config Templates

- `routing.yaml` - Contact-based routing rules
- `contacts.yaml` - Admin/trusted/blocked lists
- `heartbeat.yaml` - Scheduled task automation
- `openclaw.json` - Multi-agent configuration

---

## 📖 Documentation

- [**Architecture**](docs/ARCHITECTURE.md) - System design & data flow
- [**Hooks Reference**](docs/HOOKS-REFERENCE.md) - All 20 hooks explained
- [**Wizard Guide**](docs/WIZARD-GUIDE.md) - Setup wizard & toolkit
- [**Deployment Guide**](docs/DEPLOYMENT-GUIDE.md) - VPS setup & testing
- [**Config Reference**](docs/CONFIG-REFERENCE.md) - YAML/JSON configuration
- [**Multi-Agent Guide**](docs/MULTI-AGENT-GUIDE.md) - 4-agent system
- [**VPS Mode Switch**](docs/VPS-MODE-SWITCH.md) - Original ↔ Kamino switching

---

## 🎯 Use Cases

### 1. Personal AI Assistant
- Route family messages to demo agent (sandbox)
- Full access for admin
- Automated daily reports

### 2. Team Collaboration
- Separate agents for different team members
- @mention system for agent-to-agent communication
- Shared task locking

### 3. Production SaaS
- Rate limiting per user
- Security audit logs
- Model cost optimization (OpenRouter → Haiku → Sonnet → Opus)

---

## 🔒 Security Features

- ✅ **Contact-based routing** - Admin/trusted/blocked lists
- ✅ **API key redaction** - 9 patterns (OpenAI, Anthropic, etc.)
- ✅ **Rate limiting** - Daily token quotas per user
- ✅ **Security logging** - All events in `security.jsonl`
- ✅ **Sandbox mode** - Restricted tools for untrusted users

---

## 📊 Statistics

```
Hooks:         20/20 ✅
Config:        6 files
SOUL:          4 agents
Tests:         53/54 (98%)
Version:       1.2.0
License:       MIT
```

---

## 🛠️ Development

```bash
# Run tests
npm test

# Test individual phases
npx tsx test-hooks.ts          # Phase 1
npx tsx test-phase2-hooks.ts   # Phase 2
npx tsx test-phase3-hooks.ts   # Phase 3
npx tsx test-phase4-hooks.ts   # Phase 4

# View hook list
openclaw hooks list
```

---

## 🤝 Contributing

Contributions welcome! See individual hook `HOOK.md` files for implementation details.

---

## 📝 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

Built on [OpenClaw](https://github.com/openclaw/openclaw) - The open-source AI assistant framework.

---

## 📋 Changelog

| Version | Date | Changes |
|---------|------|---------|
| **1.2.0** | 2026-02-09 | Unified setup wizard, toolkit modules (SearXNG, Playwright, devtools, converters), enhanced mode switching |
| **1.1.0** | 2026-02-05 | VPS mode switching, contact-based routing, security enhancements |
| **1.0.0** | 2026-02-01 | Initial release: 20 hooks, 4 agents, multi-agent coordination |
