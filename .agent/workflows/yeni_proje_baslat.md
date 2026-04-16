---
description: Antigravity Nihai Proje Başlatma Protokolü (TDD & Modular Focus)
---

Bu iş akışı, Antigravity için hazırlanan profesyonel şablonları kullanarak yeni bir projeyi hatasız ve yüksek kalitede başlatır.

// turbo-all

---

## 🚀 Başlangıç Adımları

1. Kullanıcıdan `$PROJE_ADI` ve `$PROJE_AMACI` bilgilerini al.

2. Proje dizinini oluştur:
   ```powershell
   New-Item -ItemType Directory -Path "C:\Users\yilma\.gemini\antigravity\scratch\$PROJE_ADI" -Force
   ```

3. Şablonları oku ve proje dosyalarını oluştur:
   - `C:\Users\yilma\.gemini\antigravity\scratch\.agent\templates\GEMINI_template.md` dosyasını oku.
   - İçeriği `$PROJE_ADI` ve `$PROJE_AMACI` ile doldurarak `C:\Users\yilma\.gemini\antigravity\scratch\$PROJE_ADI\GEMINI.md` olarak kaydet.
   - `C:\Users\yilma\.gemini\antigravity\scratch\.agent\templates\backlog_template.md` dosyasını oku ve `C:\Users\yilma\.gemini\antigravity\scratch\$PROJE_ADI\backlog.md` olarak kaydet.

---

## 🛡️ Aşama 1: Mimari Kurulum (Asistan ile Konuşma)

Bu aşamada asla kod yazılmaz, sadece planlama yapılır:

4. **Klasör Yapısını Çiz:** `GEMINI.md` içindeki modüler yapıya uygun dizinleri oluştur.
5. **Teknoloji Yığınını Doldur:** Kullanılacak framework ve kütüphaneleri `GEMINI.md` dosyasına işle.
6. **Onay Kapılarını Ayarla:** `GEMINI.md` içindeki "Onay Kapıları" maddelerini gözden geçir, varsa projeye özel ekle.

---

## 🧪 Aşama 2: TDD Temeli (İlk Test)

7. **RED (Başarısız Test):** Uygulamanın en temel fonksiyonu için bir test dosyası oluştur (örn: `tests/app.test.js`).
8. **Testi Çalıştır:** Testin başarısız olduğunu kullanıcıya raporla.
9. **GREEN (Kodu Yaz):** Testi geçirecek minimum kodu yaz ve testi geçirdiğini göster.

---

## 📦 Aşama 3: Organizasyon ve Backlog

10. **Backlog'u Doldur:** MVP özelliklerini atomik parçalara böl ve `backlog.md` dosyasına yaz.
11. **Git Init:** 
    ```powershell
    cd "C:\Users\yilma\.gemini\antigravity\scratch\$PROJE_ADI"
    git init
    git add .
    git commit -m "chore: initial project skeleton with GEMINI constitution and TDD setup"
    ```

---

## 🏁 Sonuç

Artık Antigravity şu modda devam edecektir:
- Her adımda **TDD** döngüsü (Önce test, sonra kod).
- Her modül kendi içinde **bağımsız**.
- Kritik adımlarda **Onay Kapıları** devrede.
- Tüm hata yönetimi ve loglama **stratejiye** uygun.

Kullanıcıya sor: "Proje iskeleti hazır! Backlog'daki ilk görevden başlayalım mı?"
