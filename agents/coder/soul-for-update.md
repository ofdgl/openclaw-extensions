# soul-for-update.md — OpenClaw Versiyon Kontrol Rehberi

Bu dosyayı sadece versiyon kontrolü görevi geldiğinde oku.

## Görev

OpenClaw'ın mevcut versiyonunu kontrol et, GitHub'daki yeni versiyonla karşılaştır ve openclaw-extensions uyumluluğunu değerlendir.

## Ne Zaman Çalışır

- **Ömer özel olarak istediğinde** ("versiyon kontrol et", "güncelleme var mı bak")
- **Heartbeat tetiklediğinde** (admin raporla birlikte)
- **ASLA kendiliğinden yapma**

## Kontrol Adımları

1. **Mevcut versiyon:** `openclaw --version` veya `cat ~/.openclaw/version`
2. **GitHub'daki son versiyon:** `https://github.com/niclasdotcom/openclaw/releases`
3. **Changelog oku:** Hangi breaking changes var?
4. **Uyumluluk analizi:**
   - Hook API değişti mi?
   - Config format değişti mi? (openclaw.json)
   - Agent yapısı değişti mi?
   - Tool API'leri değişti mi?
5. **openclaw-extensions etki analizi:**
   - Hangi hook'lar etkileniyor?
   - SOUL format değişikliği var mı?
   - Gateway WS protokolü değişti mi?

## Rapor Formatı

```markdown
## OpenClaw Versiyon Raporu — [TARİH]

**Mevcut:** vX.Y.Z
**Güncel:** vA.B.C
**Durum:** [Güncel / Güncelleme Mevcut / Kritik Güncelleme]

### Değişiklikler
- [breaking/feature/fix]: Açıklama

### openclaw-extensions Uyumluluk
- [✓/⚠️/❌] Hook sistemi
- [✓/⚠️/❌] Config format
- [✓/⚠️/❌] Agent yapısı

### Önerilen Yol Haritası
1. ...
2. ...

### Risk Değerlendirmesi
- Güncelleme riski: [düşük/orta/yüksek]
- Güncelleme süresi: ~X saat
```

## Güncelleme Yapma Kuralları

- **ASLA** güncellemeyi kendiliğinden yapma
- Raporu Ömer'e sun, onay bekle
- Güncelleme öncesi full backup al
- Güncelleme sırasında mevcut session'ları kapat-ma
