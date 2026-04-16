# Antigravity Kit Mimarisi

> Kapsamlı AI Ajanı Yetenek Genişletme Araç Seti

---

## 📋 Genel Bakış

Antigravity Kit, aşağıdakilerden oluşan modüler bir sistemdir:

- **20 Uzman Ajan** - Rol tabanlı AI personalları
- **36 Yetenek (Skills)** - Alana özgü bilgi modülleri
- **11 İş Akışı (Workflows)** - Slash komut prosedürleri

---

## 🏗️ Dizin Yapısı

```plaintext
.agent/
├── ARCHITECTURE.md          # Bu dosya
├── agents/                  # 20 Uzman Ajan
├── skills/                  # 36 Yetenek (Skills)
├── workflows/               # 11 Slash Komutu
├── rules/                   # Küresel Kurallar
└── scripts/                 # Ana Doğrulama Scriptleri
```

---

## 🤖 Ajanlar (20)

Farklı alanlar için uzmanlaşmış AI personalları.

| Ajan                  | Odak Noktası               | Kullanılan Yetenekler                                     |
| --------------------- | -------------------------- | --------------------------------------------------------- |
| `orchestrator`        | Çoklu ajan koordinasyonu   | parallel-agents, behavioral-modes                         |
| `project-planner`     | Keşif, görev planlama      | brainstorming, plan-writing, architecture                 |
| `frontend-specialist` | Web UI/UX                  | frontend-design, react-best-practices, tailwind-patterns  |
| `backend-specialist`  | API, iş mantığı            | api-patterns, nodejs-best-practices, database-design      |
| `database-architect`  | Şema, SQL                  | database-design, prisma-expert                            |
| `mobile-developer`    | iOS, Android, RN           | mobile-design                                             |
| `game-developer`      | Oyun mantığı, mekanikler   | game-development                                          |
| `devops-engineer`     | CI/CD, Docker              | deployment-procedures, docker-expert                      |
| `security-auditor`    | Güvenlik uyumluluğu        | vulnerability-scanner, red-team-tactics                   |
| `penetration-tester`  | Ofansif güvenlik           | red-team-tactics                                          |
| `test-engineer`       | Test stratejileri          | testing-patterns, tdd-workflow, webapp-testing            |
| `debugger`            | Kök neden analizi          | systematic-debugging                                      |
| `performance-optimizer` | Hız, Web Vitals          | performance-profiling                                     |
| `seo-specialist`      | Sıralama, görünürlük       | seo-fundamentals, geo-fundamentals                        |
| `documentation-writer` | Kılavuzlar, belgeler       | documentation-templates                                   |
| `product-manager`     | Gereksinimler, user stories | plan-writing, brainstorming                               |
| `product-owner`       | Strateji, backlog, MVP     | plan-writing, brainstorming                               |
| `qa-automation-engineer` | E2E testi, CI pipeline  | webapp-testing, testing-patterns                          |
| `code-archaeologist`  | Eski kod, refaktör         | clean-code, code-review-checklist                         |
| `explorer-agent`      | Kod tabanı analizi         | -                                                         |

---

## 🧩 Yetenekler (36)

Ajanların görev bağlamına göre isteğe bağlı olarak yükleyebileceği modüler bilgi alanları.

### Frontend & UI

| Yetenek (Skill)         | Açıklama                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| `react-best-practices`  | React & Next.js performans optimizasyonu (Vercel - 57 kural)            |
| `web-design-guidelines` | Web UI denetimi - Erişilebilirlik, UX, performans için 100+ kural (Vercel) |
| `tailwind-patterns`     | Tailwind CSS v4 yardımcı programları                                    |
| `frontend-design`       | UI/UX desenleri, tasarım sistemleri                                      |
| `ui-ux-pro-max`         | 50 stil, 21 palet, 50 yazı tipi                                         |

### Backend & API

| Yetenek (Skill)         | Açıklama                       |
| ----------------------- | ------------------------------ |
| `api-patterns`          | REST, GraphQL, tRPC            |
| `nestjs-expert`         | NestJS modülleri, DI, dekoratörler |
| `nodejs-best-practices` | Node.js asenkron, modüller     |
| `python-patterns`       | Python standartları, FastAPI   |

### Veritabanı (Database)

| Yetenek (Skill)   | Açıklama                      |
| ----------------- | ----------------------------- |
| `database-design` | Şema tasarımı, optimizasyon    |
| `prisma-expert`   | Prisma ORM, migrasyonlar       |

### TypeScript/JavaScript

| Yetenek (Skill)     | Açıklama                           |
| ------------------- | ---------------------------------- |
| `typescript-expert` | Tip düzeyinde programlama, performans |

### Bulut & Altyapı (Cloud & Infrastructure)

| Yetenek (Skill)         | Açıklama                  |
| ----------------------- | ------------------------- |
| `docker-expert`         | Konteynerizasyon, Compose |
| `deployment-procedures` | CI/CD, dağıtım akışları   |
| `server-management`     | Altyapı yönetimi          |

### Test & Kalite

| Yetenek (Skill)         | Açıklama                 |
| ----------------------- | ------------------------ |
| `testing-patterns`      | Jest, Vitest, stratejiler |
| `webapp-testing`        | E2E, Playwright          |
| `tdd-workflow`          | Test güdümlü geliştirme  |
| `code-review-checklist` | Kod inceleme standartları |
| `lint-and-validate`     | Lint, doğrulama          |

### Güvenlik (Security)

| Yetenek (Skill)         | Açıklama                 |
| ----------------------- | ------------------------ |
| `vulnerability-scanner` | Güvenlik denetimi, OWASP |
| `red-team-tactics`      | Ofansif güvenlik         |

### Mimari & Planlama

| Yetenek (Skill) | Açıklama                        |
| --------------- | ------------------------------- |
| `app-builder`   | Full-stack uygulama iskeleti   |
| `architecture`  | Sistem tasarım desenleri        |
| `plan-writing`  | Görev planlama, kırılımı        |
| `brainstorming` | Sokratik sorgulama              |

### Mobil

| Yetenek (Skill) | Açıklama              |
| --------------- | --------------------- |
| `mobile-design` | Mobil UI/UX desenleri |

### Oyun Geliştirme

| Yetenek (Skill)    | Açıklama               |
| ------------------ | ---------------------- |
| `game-development` | Oyun mantığı, mekanikler |

### SEO & Büyüme

| Yetenek (Skill)    | Açıklama                      |
| ------------------ | ----------------------------- |
| `seo-fundamentals` | SEO, E-E-A-T, Core Web Vitals |
| `geo-fundamentals` | GenAI optimizasyonu           |

### Terminal/CLI

| Yetenek (Skill)      | Açıklama                  |
| -------------------- | ------------------------- |
| `bash-linux`         | Linux komutları, scripting |
| `powershell-windows` | Windows PowerShell        |

### Diğer

| Yetenek (Skill)           | Açıklama                  |
| ------------------------- | ------------------------- |
| `clean-code`              | Kodlama standartları (Küresel) |
| `behavioral-modes`        | Ajan personalları         |
| `parallel-agents`         | Çoklu ajan desenleri     |
| `mcp-builder`             | Model Context Protocol    |
| `documentation-templates` | Doküman formatları        |
| `i18n-localization`       | Uluslararasılaştırma      |
| `performance-profiling`   | Web Vitals, optimizasyon  |
| `systematic-debugging`    | Sorun giderme             |

---

## 🔄 İş Akışları (11 Workflows)

Slash komut prosedürleri. `/komut` ile çağrılır.

| Komut            | Açıklama                 |
| ---------------- | ------------------------ |
| `/brainstorm`    | Sokratik keşif           |
| `/create`        | Yeni özellik oluşturma   |
| `/debug`         | Hata giderme             |
| `/deploy`        | Uygulamayı yayına alma   |
| `/enhance`       | Mevcut kodu iyileştirme  |
| `/orchestrate`   | Çoklu ajan koordinasyonu |
| `/plan`          | Görev planı oluşturma    |
| `/preview`       | Değişiklikleri önizleme  |
| `/status`        | Proje durumunu kontrol et |
| `/test`          | Testleri çalıştır        |
| `/ui-ux-pro-max` | 50 stil ile tasarım      |

---

## 🎯 Yetenek Yükleme Protokolü

```plaintext
Kullanıcı İsteği → Yetenek Açıklaması Eşleşmesi → SKILL.md Yükle
                                                  ↓
                                          references/ Oku
                                                  ↓
                                          scripts/ Oku
```

### Yetenek Yapısı

```plaintext
yetenek-adi/
├── SKILL.md           # (Zorunlu) Metastat & talimatlar
├── scripts/           # (Opsiyonel) Python/Bash scriptleri
├── references/        # (Opsiyonel) Şablonlar, dokümanlar
└── assets/            # (Opsiyonel) Görseller, logolar
```

---

## 📊 İstatistikler

| Metrik                | Değer                         |
| --------------------- | ----------------------------- |
| **Toplam Ajan**       | 20                            |
| **Toplam Yetenek**    | 36                            |
| **Toplam İş Akışı**   | 11                            |
| **Toplam Script**     | 2 (ana) + 18 (yetenek seviyesi) |
| **Kapsama**           | ~90% web/mobil geliştirme     |

---

## 🔗 Hızlı Referans

| İhtiyaç     | Ajan                  | Yetenekler                             |
| ----------- | --------------------- | -------------------------------------- |
| Web Uygulaması | `frontend-specialist` | react-best-practices, frontend-design |
| API         | `backend-specialist`  | api-patterns, nodejs-best-practices   |
| Mobil       | `mobile-developer`    | mobile-design                         |
| Veritabanı  | `database-architect`  | database-design, prisma-expert        |
| Güvenlik    | `security-auditor`    | vulnerability-scanner                 |
| Test        | `test-engineer`       | testing-patterns, webapp-testing      |
| Hata Giderme | `debugger`            | systematic-debugging                  |
| Plan        | `project-planner`     | brainstorming, plan-writing           |
