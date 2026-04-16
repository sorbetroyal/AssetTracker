# Asset Tracker Dashboard - Codebase Map

## 📋 Genel Bakış
Tek bir ekran üzerinden farklı piyasalardaki varlıkların hedeflere olan uzaklığını takip eden finansal dashboard.

## 🛠️ Teknik Yığın
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Data:** Borsa MCP

## 📁 Dosya Yapısı ve Sorumluluklar
- `src/store/useAssetStore.ts`: Varlıkların ve hedeflerin tutulduğu ana depo.
- `src/hooks/usePriceData.ts`: Canlı fiyat verilerini çeken servis.
- `src/components/layout/HeaderIndexBar.tsx`: Üst endeks akış paneli.
- `src/components/dashboard/AssetTable.tsx`: Ana takip listesi.

## 🤖 Ajanlar ve Yetki Alanları
- **@frontend-specialist:** UI, Bileşenler, Tailwind Stilleri.
- **@backend-specialist:** Zustand Store, API entegrasyonu, Veri işleme.
- **@orchestrator:** Çoklu ajan koordinasyonu ve genel yapı.

## 🚦 Proje Durumu
- [x] Proje İskeleti (Next.js Setup)
- [ ] Zustand Store Kurulumu
- [ ] Canlı Veri Hook'u
- [ ] Dashbord UI Geliştirme
