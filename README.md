# StreamChapter

Microsoft Stream videolarına otomatik bölüm ekleyen Chrome uzantısı.

![Chrome](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Özellikler

- JSON formatında toplu bölüm ekleme
- Ayarlanabilir hız seçenekleri (Hızlı/Normal/Yavaş)
- Arka planda çalışma desteği
- Gerçek zamanlı ilerleme takibi
- Türkçe ve İngilizce arayüz desteği

## Kurulum

1. Bu repoyu klonlayın veya ZIP olarak indirin
2. Chrome'da `chrome://extensions` adresine gidin
3. Sağ üstten **Geliştirici modu**'nu açın
4. **Paketlenmemiş öğe yükle** butonuna tıklayın
5. İndirdiğiniz klasörü seçin

## Kullanım

1. Microsoft Stream'de düzenlemek istediğiniz videoyu açın
2. Uzantı ikonuna tıklayın
3. Bölüm listesini JSON formatında girin:

```json
[
  { "time": "00:00:00", "title": "Giriş" },
  { "time": "00:05:30", "title": "Ana Konu" },
  { "time": "00:15:00", "title": "Özet" }
]
```

4. Hız ayarlarını ihtiyacınıza göre düzenleyin
5. **Bölümlendirmeyi Başlat** butonuna tıklayın

## Hız Ayarları

| Preset | Video Sarma | Buton Tıklama | Kaydetme |
|--------|-------------|---------------|----------|
| Hızlı  | 1500ms      | 1000ms        | 1500ms   |
| Normal | 2500ms      | 1500ms        | 2000ms   |
| Yavaş  | 4000ms      | 2500ms        | 3000ms   |

> **Not:** Yavaş internet bağlantısında "Yavaş" preset önerilir.

## Ekran Görüntüsü

```
┌─────────────────────────────────┐
│  📹 Stream Bölümleyici          │
│  Microsoft Stream Video Bölüm   │
│  Ekleme Aracı                   │
├─────────────────────────────────┤
│  Bölüm Listesi (JSON):          │
│  ┌───────────────────────────┐  │
│  │ [                         │  │
│  │   { "time": "00:00:00",   │  │
│  │     "title": "Giriş" }    │  │
│  │ ]                         │  │
│  └───────────────────────────┘  │
│  [✓ Doğrula] [🗑 Temizle]       │
├─────────────────────────────────┤
│  [▶️ Bölümlendirmeyi Başlat]    │
└─────────────────────────────────┘
```

## Gereksinimler

- Google Chrome (veya Chromium tabanlı tarayıcı)
- Microsoft Stream erişimi (SharePoint üzerinden)

## Lisans

MIT License

---

**Aif Bilişim** tarafından geliştirilmiştir.
