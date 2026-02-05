---
name: vps
description: VPS mode switching (Original ↔ Kamino)
user-invocable: true
command-dispatch: tool
command-tool: bash
command-arg-mode: raw
metadata: { "openclaw": { "emoji": "🔄" } }
---

# VPS Mode Switch

Admin komutu: VPS'te Original ve Kamino (enhanced) OpenClaw modları arasında geçiş yapar.

## Komutlar

- `/vps status` - Aktif modu göster
- `/vps original` - Orijinal moda geç
- `/vps kamino` - Gelişmiş moda geç

## Modlar

| Özellik | Original | Kamino |
|---------|----------|--------|
| Mesaj izni | strict-list | allow all |
| Hooks | Bundled | 21 custom |
| Multi-agent | Hayır | 4 agent |

## Güvenlik

Sadece admin numarası kullanabilir.
