# Asset Tracker Dashboard - Proje Planı

> **Vizyon:** BIST, US ve Kripto piyasalarını tek bir ekranda, kullanıcı tanımlı alış/satış hedefleri ve canlı ilerleme çubukları ile takip eden premium bir finansal kontrol paneli.

---

## 🏗️ Proje Mimarisi
- **Tipi:** `WEB` (Desktop-First Web Dashboard)
- **Framework:** Next.js 15+ (App Router), TypeScript
- **Styling:** Tailwind CSS v4, Lucide Icons, Framer Motion (Animasyonlar)
- **UI Components:** Radix UI / Shadcn (Fiyat çubukları ve veri tabloları için)
- **Veri Kaynağı:** Borsa MCP (BIST, US, Crypto, FX) + yfinance (Backup)

---

## 🎯 Başarı Kriterleri
1. **Index Ticker (Üst Bar):** SP500, NASDAQ, BIST100 ve diğer önemli endekslerin canlı akışı.
2. **Proximity Progress Bar:** Her varlık için `Alış (0%) --- Mevcut (X%) --- Satış (100%)` gösteren dinamik çubuk.
3. **Unified View:** Piyasalar arası geçiş yapmadan tüm varlıkları tek bir grid/list yapısında görme.
4. **Manuel Hedef Yönetimi:** Kullanıcının alış ve satış hedeflerini kolayca güncelleyebilmesi.

---

## 📁 Dosya Yapısı
```plaintext
asset-tracker/
├── src/
│   ├── components/
│   │   ├── layout/HeaderIndexBar.tsx   # En üstteki endeks çubuğu
│   │   ├── dashboard/AssetTable.tsx    # Ana ver tablosu
│   │   ├── dashboard/ProximityBar.tsx  # İlerleme çubuğu bileşeni
│   │   └── shared/PriceTag.tsx         # Fiyat kartları
│   ├── hooks/
│   │   └── usePriceData.ts             # Borsa MCP entegrasyonu
│   ├── store/
│   │   └── useAssetStore.ts            # Manuel hedefler ve varlık listesi (Zustand)
│   └── lib/
│       └── utils.ts
├── public/
└── asset-tracker.md                    # Bu plan dosyası
```

---

## 🛠️ Görev Dağılımı ve İş Akışı

### Aşama 1: Analiz ve Hazırlık
- [ ] Borsa MCP araçlarının yeteneklerinin projeye özel analizi.
- [ ] Teknik stack kurulumu (Next.js boilerplate).

### Aşama 2: Veri ve Durum Yönetimi
- [ ] **Ajan:** `backend-specialist`
- [ ] Varlık listesi ve alış/satış hedefleri için yerel state yönetimi (LocalStorage/Zustand).
- [ ] Fiyat verisi entegrasyonu (Endeksler ve kullanıcı varlıkları için).

### Aşama 3: UI/UX Geliştirme (Dashboard)
- [ ] **Ajan:** `frontend-specialist`
- [ ] Üst Endeks Barı (`HeaderIndexBar`) tasarımı.
- [ ] **Proximity Bar** tasarımı (Alış, Mevcut ve Satış noktalarının görselleştirilmesi).
- [ ] Varlık ekleme/güncelleme arayüzü.

### Aşama 4: Cila ve Doğrulama
- [ ] **Ajan:** `performance-optimizer`
- [ ] Gerçek zamanlı fiyat güncellemelerinin optimizasyonu.
- [ ] **Aşama X:** `verify_all.py` ile güvenlik ve UI denetimi.

---

## ✅ AŞAMA X: SON DOĞRULAMA (KONTROL LİSTESİ)
- [ ] Mor/Menekşe renk yasağına uyuldu mu?
- [ ] "Progress Bar" alış ve satış noktalarını net gösteriyor mu?
- [ ] Endeks barı ekranın en üstünde sabit mi?
- [ ] Veriler başarılı bir şekilde çekiliyor mu?
