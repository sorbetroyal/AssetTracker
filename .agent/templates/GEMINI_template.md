# [PROJE ADI] — Proje Anayasası

> Bu dosya projenin "anayasasıdır". Antigravity her oturumda bu dosyayı okur
> ve tüm kararlarını buradaki kurallara göre verir.

---

## 🎯 Proje Amacı
<!-- 1-2 cümle. Teknik değil, kullanıcı odaklı yaz. -->
[BURAYA YAZ]

> **Antigravity'ye Talimat (Proje Başlangıcı):**
> Proje amacı belirlenirken Antigravity, projenin kapsamına ve vizyonuna yönelik **en az 5 adet numaralandırılmış stratejik öneri** (Örn: ölçeklenebilirlik, yerel depolama odağı, kullanıcı gizliliği vb.) sunmak zorundadır. Kullanıcı bu önerilerden birini seçebilir veya kendi amacını karma bir yapıya dönüştürebilir.

## 👤 Hedef Kullanıcı
[BURAYA YAZ]

## ✅ MVP Kapsamı (Bitmeden bitmedi sayılmaz)
- [ ] Özellik 1
- [ ] Özellik 2
- [ ] Özellik 3

## 🏗️ Teknoloji Yığını
| Katman | Teknoloji | Neden |
| :--- | :--- | :--- |
| Frontend | | |
| Backend | | |
| Veritabanı | | |
| Test | | |
| Paket Yöneticisi | | |

## 📁 Klasör Yapısı ve Sorumluluklar
```
/src
  /domain      → Saf iş mantığı ve TypeScript tipleri (Framework/DB bağımsız)
  /services    → Tüm dış API / DB çağrıları buradan yapılır
  /components  → UI bileşenleri / Framework spesifik kodlar
  /hooks       → React custom hooks
  /utils       → Yardımcı fonksiyonlar (saf, side-effect yok)
/tests         → Tüm testler

> [!IMPORTANT]
> **Domain Katmanı Kuralı:** Domain katmanı sadece TypeScript tiplerini ve saf iş mantığını içerir. Framework (React/Next.js) spesifik kodlar (örn: `useRouter`, `useEffect`) burada yer alamaz.
```

## ⚙️ Build & Test Komutları
```bash
# Geliştirme sunucusu
npm run dev

# Testleri çalıştır
npm run test

# Lint kontrolü
npm run lint

# Production build
npm run build
```

## 📏 Mimari Kurallar (Kesinlikle uyulacak)
1. Her özellik kendi bağımsız modülünde yaşar.
2. `domain/` klasörü dışarıya asla bağımlı olamaz.
3. Tüm yorumlar **Türkçe** yazılır.
4. Fonksiyon başına maksimum 30 satır — daha uzunsa böl.
5. Her yeni özellik için önce **başarısız bir test** yazılır, sonra kod.

## 📦 Bağımsız Modül Kuralı

**"Her özellik kendi bağımsız modülünde yaşar"** kuralının ne anlama geldiği:

### Modül nedir?
Bir modül, tek bir sorumluluğu olan ve **kendi içinde tamamlanmış** bir klasördür.
İçinde genellikle şunlar bulunur:

```
/src/features/kullanici-auth/
  index.ts          → Dışarıya açılan tek kapı (public API)
  auth.service.ts   → İş mantığı
  auth.types.ts     → Tip tanımları
  auth.test.ts      → Testler
```

### ✅ Doğru — Modüller arası iletişim
Modüller birbirini yalnızca `index.ts` üzerinden çağırır:
```typescript
// ✅ Doğru: auth modülünün dışa açtığı fonksiyonu kullan
import { girisYap } from "@/features/kullanici-auth";
```

### ❌ Yanlış — Modülün içine dalmak
```typescript
// ❌ Yanlış: Başka modülün iç dosyasına doğrudan erişim
import { sifreyiHashle } from "@/features/kullanici-auth/auth.service";
```

### ❌ Yanlış — Her şeyi tek dosyaya yazmak
```typescript
// ❌ Yanlış: Kullanıcı işlemleri, ödeme ve bildirim aynı dosyada
// user.service.ts içinde hem auth, hem ödeme, hem email gönderme
```

### Antigravity'ye Talimat
> Antigravity yeni bir özellik yazarken önce sorar:
> *"Bu özellik hangi modüle ait? Yeni bir modül mü oluşturalım?"*
> Kullanıcı onaylamadan mevcut modüllere ekstra sorumluluk yüklemez.

### Modül Bağımsızlık Kontrol Listesi
Yeni bir modül yazılırken şu sorular sorulur:
- [ ] Bu modülü silsem proje başka bir yerde patlıyor mu? → Patlarsa bağımlılık var, düzelt.
- [ ] Bu modülü başka bir projeye kopyalayabilir miyim? → Hayırsa fazla bağımlılık var.
- [ ] Modülün dışarıya açtığı tek bir `index.ts` var mı? → Yoksa ekle.

### 🔄 Durum Yönetimi (State Management) Kuralı
Modüller arası veri paylaşımı sadece belirlenmiş yollarla yapılır:
- **Doğrudan İletişim:** Sadece `props` üzerinden (üstten alta).
- **Global İletişim:** Merkezi `store` (Zustand/Redux) üzerinden.
- **Yasak:** Bir modül, diğer bir modülün iç `state`'ine (iç değişkenlerine) asla doğrudan müdahale edemez. Her modül kendi verisinden tam sorumludur.

## 🧪 Test-First Kuralı (TDD)

**Bu kural her yeni özellik veya fonksiyon için zorunludur.**

Antigravity şu sırayı asla bozmaz:

1. **🔴 RED:** Kullanıcı bir özellik istediğinde, Antigravity önce o özelliğin **başarısız testini** yazar.
   - Test çalıştırılır ve ❌ hata aldığı gösterilir.
   - Kullanıcı onayı beklenir: *"Test doğru mu? Devam edeyim mi?"*

2. **🟢 GREEN:** Onay geldikten sonra, testi geçirecek **en basit kod** yazılır.
   - Test tekrar çalıştırılır ve ✅ geçtiği gösterilir.

3. **🔵 REFACTOR:** Kod çalışıyorsa temizlenir, okunabilir hale getirilir.
   - Testler yeniden çalıştırılır, hâlâ geçtiği doğrulanır.

> **Antigravity bu sırayı kullanıcı açıkça "atla" demeden kesinlikle değiştirmez.**

## 🚫 Yasak Listesi (Antigravity asla yapmamalı)
- `config` veya `.env` dosyalarını değiştirme
- Test dosyalarını silme veya devre dışı bırakma
- `domain/` içine dış API çağrısı yazma
- `console.log` ile debug bırakma (production kodu için)
- Kullanıcı onayı olmadan `git push` yapma

## 🔍 Kod İnceleme (Review) Kriterleri

Antigravity her görevi tamamlayıp kullanıcıya teslim etmeden önce kendi kendine şu 3 kritik soruyu sormak ve yanıtlarını doğrulamak zorundadır:

1. **Mimarlık Kontrolü:** Yazılan kod `domain/` klasörü kurallarını (bağımsızlık, framework-free) ihlal ediyor mu?
2. **Test Kontrolü:** Koda karşılık gelen test dosyası `tests/` klasöründe yerini aldı mı ve testler yeşil (pass) mi?
3. **Standart Kontrolü:** Tüm dokümantasyon ve yorum satırları **Türkçe** mi?

---

## 🚦 Onay Kapıları (Human-in-the-Loop)

Antigravity aşağıdaki işlemleri yapmadan önce **mutlaka durur ve onay alır.**
Kullanıcı "evet" veya "devam" demeden bir sonraki adıma geçemez.

| # | Eylem | Antigravity ne gösterir? |
| :--- | :--- | :--- |
| 1 | Veritabanı şeması veya migration değişikliği | Değiştirilecek tabloları ve kolonları listeler |
| 2 | Yeni npm / pip paketi yükleme | Paketin adını, sürümünü ve neden gerektiğini açıklar |
| 3 | 3'ten fazla dosyayı etkileyen her türlü değişiklik | Etkilenecek dosyaların listesini ve değişiklik özetini sunar |
| 4 | `git commit` veya `git push` | Commit mesajını ve değişen dosyaları önce gösterir |
| 5 | `.env`, `config` veya `secret` dosyası değişikliği | Kesinlikle yapamaz, kullanıcıya haber verir |
| 6 | Mevcut bir testi silme veya devre dışı bırakma | Nedenini açıklar, alternatif önerir |
| 7 | Mimari klasör yapısını değiştirme | Yeni yapıyı çizer, onay bekler |

> **Antigravity bu kapılarda şunu söyler:**
> *"[Eylem] yapmak üzereyim. İşte plan: [detay]. Devam edeyim mi?"*

## ⚠️ Hata Yönetimi Stratejisi

Bir şeyler ters gittiğinde uygulamanın **her yerde aynı şekilde** davranması için kurallar:

### 3 Temel Soru ve Cevabı

**1. Hata olduğunda kullanıcıya ne gösterilir?**
- Teknik hata mesajı (`TypeError`, `undefined` vb.) asla gösterilmez.
- Her zaman **Türkçe, anlaşılır** bir mesaj gösterilir.
- ❌ `"Cannot read property 'data' of undefined"`
- ✅ `"Veriler yüklenemedi. Lütfen tekrar deneyin."`

**2. Hata nereye kaydedilir?**
- `console.log(hata)` yasaktır — production'da kimse görmez.
- Hatalar merkezi bir `logger` servisi üzerinden kaydedilir.
- En basit haliyle: `logger.error("[fonksiyon adı]", hata)`

**3. Hata sonrası uygulama ne yapar?**
- Devam edebildiği yerde → devam eder, kullanıcıya bilgi verir.
- Kritik hatalarda → işlemi durdurur, kullanıcıyı bir önceki güvenli adıma alır.
- Asla sessizce yutmaz (hata oldu ama hiçbir şey yapmamak).

### Antigravity'ye Talimat
> - Her async fonksiyona `try/catch` ekler.
> - `throw` kullanırken mesajı açıklayıcı yazar:
>   - ❌ `throw new Error("hata")`
>   - ✅ `throw new Error("Kullanıcı bulunamadı: id=${id}")`
> - Hata yakaladığında `console.log` değil `logger.error` kullanır.
> - Kullanıcıya gösterilen tüm hata metinleri Türkçe olur.

## 🔐 Ortam Değişkenleri Kuralı

API key, şifre, token gibi **gizli bilgilerin koda karışmaması** için kurallar:

### Temel Kural
- API key, şifre, veritabanı adresi, token → doğrudan koda **asla** yazılmaz.
- Tüm gizli bilgiler `.env` dosyasında saklanır.
- `.env` dosyası **asla** git'e eklenmez → `.gitignore`'da mutlaka olmalı.

### Doğru / Yanlış
```bash
# ❌ Yanlış — koda gizli bilgi gömüldü
const apiKey = "sk-abc123xyz...";

# ✅ Doğru — .env dosyasından okunuyor
const apiKey = process.env.OPENAI_API_KEY;
```

### `.env.example` Zorunluluğu
Projeye yeni biri katıldığında hangi değişkenlerin gerektiğini bilmesi için:
```bash
# .env.example (git'e eklenir, değerler BOŞ bırakılır)
OPENAI_API_KEY=
DATABASE_URL=
SECRET_KEY=
```

### Antigravity'ye Talimat
> - Kod yazarken gizli bilgi gerektiren her yerde `process.env.DEGISKEN_ADI` kullanır.
> - `.env` dosyasını **okuyabilir** ama **değiştiremez** (Onay Kapısı #5).
> - Yeni bir ortam değişkeni gerekirse önce `.env.example`'a ekler, kullanıcıya bildirir.
> - `console.log` ile ortam değişkeni değerini asla ekrana basmaz.

## 🧠 Bağlam Yönetimi

Uzun oturumlarda Antigravity'nin hafızası dolmaya başlar — eski bilgileri karıştırır, maliyet artar.

| Durum | Yapılacak |
| :--- | :--- |
| Yeni bir konuya / özelliğe geçildi | `/clear` ile bağlamı sıfırla |
| Oturum 1 saatten uzun sürdü | `/compact` ile konuşmayı özetle |
| Antigravity alakasız şeyler yanıtlamaya başladı | `/clear` yap, sadece ilgili dosyaları `@` ile ver |

### 🚀 Oturum Başlangıç Teyidi
Her yeni oturum başlatıldığında Antigravity şu adımları izlemek zorundadır:
1. `GEMINI.md` dosyasını baştan sona oku.
2. Mevcut anayasanın bir özetini kullanıcıya sun.
3. Şu teyit cümlesini ver: *"Anayasayı okudum, şu an [Özellik Adı] üzerinde çalışmaya hazırım."*

> **Antigravity'ye Talimat:** Konu değiştiğinde veya yeni oturum açıldığında yukarıdaki teyidi otomatik olarak verir. Ayrıca uzun konuşmalarda bağlamın şiştiğini fark ederse `/compact` yapmayı teklif eder.

---

## 📝 Loglama Stratejisi

`console.log` geliştirme sırasında geçici kullanılabilir ama production kodunda **yasaktır**.

| Seviye | Ne zaman kullanılır | Örnek |
| :--- | :--- | :--- |
| `logger.info` | Normal akış bilgisi | `"Kullanıcı giriş yaptı: id=42"` |
| `logger.warn` | Dikkat gerektiren ama kırıcı olmayan durum | `"Rate limit yaklaşıyor"` |
| `logger.error` | Hata — her zaman stack trace ile | `"Veritabanına yazılamadı", err` |
| `console.log` | Sadece geliştirme sırasında geçici debug | **Production'da yasak** |

> **Antigravity'ye Talimat:** Yazdığı her log satırını doğru seviyeyle yazar. Commit öncesi `console.log` taraması yapar.

---

## 🛡️ Güvenlik Kontrol Listesi

Yapay zeka güvenlik açıklarını fark etmeden yazabilir. Her özellik tamamlandığında şu liste kontrol edilir:

- [ ] Kullanıcıdan gelen **tüm veriler** doğrulanır (validation) — boş bırakılmaz
- [ ] Şifreler düz metin saklanmaz — `bcrypt` veya benzeri ile hash'lenir
- [ ] Her korumalı endpoint için **yetki kontrolü** yapılır (auth middleware)
- [ ] SQL sorguları parametreli yazılır — string birleştirme ile SQL yasak
- [ ] Hata mesajlarında iç sistem detayı (stack trace, dosya yolu) kullanıcıya gösterilmez
- [ ] Yüklenen dosyalar tip ve boyut kontrolünden geçirilir

> **Antigravity'ye Talimat:** Yeni bir endpoint veya form yazarken listeyi otomatik uygular. Atlanan madde varsa uyarır.

---

## 📡 API Sözleşmesi

Backend-frontend aynı anda gelişiyorsa her endpoint farklı formatta yanıt döndürebilir. Tüm yanıtlar **aynı şablona** uymalıdır.

### Başarılı Yanıt Formatı
```json
{
  "success": true,
  "data": { }
}
```

### Hata Yanıtı Formatı
```json
{
  "success": false,
  "error": "Kullanıcı bulunamadı",
  "code": 404
}
```

> **Antigravity'ye Talimat:** Yazdığı her endpoint bu formatı kullanır. Farklı bir format görürse uyarır ve düzeltme önerir.

---

---

## 🪵 Git Commit Konvansiyonu (Conventional Commits)

Proje geçmişinin (git log) anlaşılabilir ve profesyonel kalması için tüm commit mesajları aşağıdaki standartlarda olmalıdır.

| Tip | Kullanım Alanı | Örnek |
| :--- | :--- | :--- |
| `feat:` | Yeni bir özellik eklendiğinde | `feat: giriş formu validator eklendi` |
| `fix:` | Bir hata düzeltildiğinde | `fix: login çökme sorunu giderildi` |
| `docs:` | Sadece doküman değiştiğinde | `docs: GEMINI.md güncellendi` |
| `style:` | Görsel değişiklikler yapıldığında | `style: buton renkleri düzeltildi` |
| `refactor:` | Davranışı değiştirmeyen kod iyileştirmesi | `refactor: veri çekme mantığı sadeleştirildi` |
| `test:` | Test eklendiğinde / güncellendiğinde | `test: auth servis testleri yazıldı` |
| `chore:` | Paket, build, dosya taşıma vb. | `chore: lodash kütüphanesi eklendi` |

> **Antigravity'ye Talimat:** Her commit öncesinde mesajı bu kurala göre otomatik oluşturur ve onay ister. (Onay Kapısı #4).

---

---

## ⚡ Performans ve Optimizasyon Bütçesi

Kodun hantal ve bakımı zor hale gelmesini önlemek için Antigravity şu sınırlara uyar:

| Kriter | Sınır | Aşılırsa |
| :--- | :--- | :--- |
| **Dosya Boyutu** | Maksimum 300 satır | Alt dosyalara böl (splitting) |
| **Fonksiyon Boyutu** | Maksimum 30 satır | Küçük fonksiyonlara parçala |
| **Bileşen (Component)** | Maksimum 50 satır | Alt bileşenlere ayır |
| **Yükleme Süresi** | Kritik veri çeken API'lar | Her zaman **timeout** ve **loading state** ekle |

- **Verimlilik:** Gereksiz `map/filter` döngüleri yerine tek döngüde çözüm ara.
- **Hafıza:** Global state kullanımını minimumda tut, her modül kendi state'ini yönetsin.
- **Varlıklar (Assets):** Resim ve video gibi dosyaları her zaman optimize edilmiş formatlarda kullan.

> **Antigravity'ye Talimat:** Bir dosya veya fonksiyon bu sınırları aştığında uyarı verir ve refactoring önerir.

---

---

## ♿ Erişilebilirlik (A11y) ve UX Kuralları

Frontend geliştirme süreçlerinde her kullanıcıya (ve botlara) en iyi deneyimi sunmak için:

- **Semantik HTML:** `div` ve `span` yerine `header`, `main`, `section`, `nav`, `footer`, `article` gibi anlamlı etiketler kullanılır.
- **Formlar:** Her form elemanı (`input`, `select`) ilişkilendirilmiş bir `<label>` etiketi içermelidir.
- **Butonlar:** Metin içermeyen (sadece ikon) butonlarda mutlaka `aria-label` bulunmalıdır.
- **Resimler:** Tüm `<img>` etiketleri açıklayıcı bir `alt="..."` niteliğine sahip olmalıdır.
- **Okunabilirlik:** Metinlerin arka plan ile kontrast oranı (WCAG AA standartlarına uygun) korunmalıdır.
- **Odak (Focus):** Klavye kullanıcıları için `outline` ve `tabindex` ayarları bozulmamalıdır.

---

## 📋 Backlog
→ Detaylar için bkz: [backlog.md](./backlog.md)

## 📝 Değişiklik Günlüğü (Changelog)

| Tarih | Versiyon | Değişiklik Özeti | Yazar |
| :--- | :--- | :--- | :--- |
| [TARİH] | v1.0.0 | İlk sürüm: Proje anayasası ve temel kurallar oluşturuldu. | Antigravity |

---
*Bu dosya projenin canlı belgesidir, her büyük mimari değişimde güncellenir.*
