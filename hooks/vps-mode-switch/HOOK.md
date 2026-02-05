---
name: vps-mode-switch
description: "Admin command to switch between Original and Kamino OpenClaw modes"
metadata: { "openclaw": { "emoji": "🔄", "events": ["command"] } }
---

# VPS Mode Switch Hook

Allows admin to switch between Original and Kamino (enhanced) OpenClaw modes.

## Commands

| Command | Açıklama |
|---------|----------|
| `/vps original` | Orijinal OpenClaw'a dön |
| `/vps simple` | Orijinal OpenClaw'a dön (alias) |
| `/vps kamino` | Gelişmiş moda geç |
| `/vps plus` | Gelişmiş moda geç (alias) |
| `/vps status` | Aktif modu göster |

## Mode Karşılaştırması

| Özellik | Original | Kamino |
|---------|----------|--------|
| Mesaj izni | strict-list only | allow all (+90 sandbox) |
| Hooks | Bundled only | 19 custom hook |
| Multi-agent | Hayır | 4 agent |
| Rate limiting | Hayır | Evet |
| Security logs | Hayır | Evet |

## Teknik Detaylar

**VPS'te 2 profil**:
- `~/.openclaw/` → Original
- `~/.openclaw-kamino/` → Enhanced

**Switching mekanizması**:
1. Aktif container'ı durdur
2. Symlink güncelle: `~/.openclaw-active → <target>`
3. Docker restart
4. Durum dosyasına kaydet (reboot persistence)

## Güvenlik

- Sadece admin numarası kullanabilir
- Her switch security.jsonl'e loglanır
- Rollback her zaman mümkün
