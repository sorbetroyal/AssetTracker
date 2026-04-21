# Antigravity: Mobil Fiyat Senkronizasyon Rehberi (HTTP Shortcuts)

Bu rehber, Android telefonunuzu kullanarak Takasbank/TEFAS IP engellerini nasıl aşacağınızı ve fiyatları nasıl güncelleyeceğinizi adım adım açıklar.

## 1. Hazırlık
- Android telefonunuza **HTTP Shortcuts** uygulamasını indirin.
- Uygulama içinde sağ alttaki **+** butonuna basın ve **"Create New Shortcut"** seçeneğini seçin.

## 2. Temel Ayarlar (General Settings)
- **Shortcut Name:** `Fon Güncelleyici`
- **Method:** `POST`
- **URL:** `https://www.tefas.gov.tr/api/fund/DailyData`

## 3. JavaScript Kodunu Yapıştırın (Scripting)
Uygulamanın altındaki **"Scripting"** tabına gidin ve aşağıdaki kodu **"Post-Request Scripting"** bölümüne yapıştırın.

> [!TIP]
> Bu kod, telefonunuz TEFAS'tan veriyi çektiği anda çalışır, sizin fonlarınızı ayıklar ve Supabase'e gönderir.

```javascript
// 1. TEFAS Verisini Oku
const responseData = JSON.parse(response.body);

// 2. Takip Ettiğiniz 25 Fon (Otomatik Tanımlandı)
const myFunds = [
  "AHI", "BHF", "AJR", "DOH", "CHG", "AJB", "TPC", "AVR", "PPS", 
  "GFH", "GMC", "AJA", "TKM", "BPI", "AEI", "HHY", "AVB", "AJG", 
  "AE1", "AP7", "AFT", "KSA", "GEV", "VEI", "VER"
];

// 3. Veriyi Filtrele ve Hazırla
const updateData = responseData.data
    .filter(fund => myFunds.includes(fund.FundCode))
    .map(fund => ({
        symbol: fund.FundCode,
        price: fund.Price,
        daily_change: fund.DailyReturn,
        source: 'mobil_sync',
        updated_at: new Date().toISOString()
    }));

// 4. Supabase'e Gönder (Fiyatları Veritabanına Yazar)
if (updateData.length > 0) {
    enqueueRequest({
        method: 'POST',
        url: 'https://nhthamfrgstvmxbprvze.supabase.co/rest/v1/asset_prices',
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odGhhbWZyZ3N0dm14YnBydnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjA5MTgsImV4cCI6MjA5MTkzNjkxOH0.vR7GLrTGyM-x4IICaTJegYbuigcDi9fTXxlHVWplj8o',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odGhhbWZyZ3N0dm14YnBydnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjA5MTgsImV4cCI6MjA5MTkzNjkxOH0.vR7GLrTGyM-x4IICaTJegYbuigcDi9fTXxlHVWplj8o',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(updateData)
    });
    showToast("Başarıyla " + updateData.length + " fon Supabase'e gönderildi!");
} else {
    showToast("Güncellenecek fon verisi bulunamadı!");
}
```

## 4. Kullanım
- Ana ekranınıza bir widget ekleyerek veya uygulama içinden bu butona basarak tüm fonları saniyeler içinde güncelleyebilirsiniz.
- Dashboard üzerinde artık bu güncellemelerin kaynağı `mobil_sync` olarak görünecektir.

## 5. İpucu: Otomatikleştirme
- Eğer her gün uğraşmak istemiyorsanız, HTTP Shortcuts içinden **"Schedule"** özelliğini kullanarak her gün saat 10:30'da bu işlemin kendi kendine çalışmasını sağlayabilirsiniz.

---
*Not: Bu rehber tamamen sizin Supabase projenize ve fon listesine göre özelleştirilmiştir.*
