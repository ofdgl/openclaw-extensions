# VPS Mode Switch - Deployment Guide

## Mimari

```
VPS Structure:
├── ~/.openclaw-original/     [Original Mode]
│   ├── openclaw.json         (strict-list, admin only)
│   └── workspace/
│
├── ~/.openclaw-kamino/       [Kamino Mode]
│   ├── openclaw.json         (allow-all + sandbox)
│   ├── hooks/                (20 custom hooks)
│   ├── souls/                (4 agent personalities)
│   └── workspaces/
│       ├── admin/
│       ├── security/
│       ├── demo/
│       └── intern/
│
├── ~/.openclaw-active -> symlink to active mode
├── ~/.openclaw-mode          (persistence file: "original" or "kamino")
└── openclaw-switch.sh        (mode switch script)
```

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `/vps original` | Orijinal moda dön (strict admin-only) |
| `/vps kamino` | Gelişmiş moda geç (20 hook, 4 agent) |
| `/vps status` | Aktif modu göster |

## Mode Farkları

| Özellik | Original | Kamino |
|---------|----------|--------|
| **Mesaj İzni** | Sadece admin | Tüm +90 (sandbox) |
| **Hooks** | Bundled | 20 custom hook |
| **Agents** | 1 (admin) | 4 (admin/security/demo/intern) |
| **Rate Limit** | Yok | Evet (token/gün) |
| **Security Logs** | Yok | Evet |
| **Model Handoff** | Yok | Haiku→Sonnet→Opus |

## VPS Kurulum Adımları

### 1. Dizin Yapısını Oluştur
```bash
# Original mode (mevcut backup'tan)
cp -r ~/.openclaw ~/.openclaw-original

# Kamino mode (yeni)
mkdir -p ~/.openclaw-kamino/{hooks,souls,workspaces/{admin,security,demo,intern}}
```

### 2. Dosyaları Kopyala
```bash
# GitHub'dan clone et
cd ~/.openclaw-kamino
git clone https://github.com/kowalski/openclaw-extensions.git temp
mv temp/hooks/* hooks/
mv temp/souls/* souls/
mv temp/config/openclaw-kamino.json openclaw.json
rm -rf temp
```

### 3. Switch Script'i Kur
```bash
cp openclaw-switch.sh ~/
chmod +x ~/openclaw-switch.sh
```

### 4. Systemd Service (Boot Persistence)
```bash
sudo cp openclaw-mode.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable openclaw-mode.service
```

### 5. Default Mode Ayarla
```bash
echo "kamino" > ~/.openclaw-mode
```

## Docker Entegrasyonu

Docker container `~/.openclaw-active` symlink'ini mount eder:

```yaml
# docker-compose.yml
services:
  openclaw:
    volumes:
      - ~/.openclaw-active:/home/kowalski/.openclaw:ro
      - ~/.openclaw-mode:/home/kowalski/.openclaw-mode:ro
```

## Rollback Senaryoları

### Senaryo 1: Kamino'da Bug
```bash
# WhatsApp'tan:
/vps original

# Veya SSH ile:
~/openclaw-switch.sh original
```

### Senaryo 2: VPS Restart
Systemd service otomatik olarak son modu restore eder.

### Senaryo 3: Acil Durum
```bash
# SSH ile doğrudan:
docker stop openclaw
rm ~/.openclaw-active
ln -s ~/.openclaw-original ~/.openclaw-active
docker start openclaw
```

## Güvenlik Notları

1. **Admin Check**: `/vps` komutu sadece +905357874261 tarafından kullanılabilir
2. **Logging**: Her mode switch `security.jsonl`'e loglanır
3. **Original Mode**: Strict-list, sadece bilinen numaralar erişebilir
4. **Kamino Mode**: Allow-all ama sandbox (kısıtlı yetkiler)
