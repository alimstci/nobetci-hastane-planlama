# Nöbetçi - Kod Yapısı Hikayesi

Bir hastanede 73 doktorun nöbetini yönetmek hiç de kolay değil. Yöneticiler her ay saatlerce Excel'de boğuşuyordu. Ta ki **Nöbetçi** sistemi devreye girene kadar…

Şimdi bu sistemin iç yapısını, nasıl organize edildiğini ve neden bu şekilde tasarlandığını bir hikaye gibi anlatayım.

## Projenin Genel Hikayesi

**Nöbetçi**, Next.js 16 ile inşa edilmiş modern, hızlı ve TypeScript'li bir web uygulamasıdır. Frontend ile backend aynı çatı altında (Next.js App Router) çalışıyor. Backend işlerini **Server Actions** ile yapıyor, ayrı bir REST API'ye ihtiyaç duymuyor. Veritabanı olarak ise **Supabase** (PostgreSQL) kullanıyor.

Tasarım felsefesi basit: **"Karmaşık algoritmayı temiz tut, kullanıcı arayüzünü ise mümkün olduğunca kolay ve anlaşılır yap."**

## Klasör Yapısı (Projenin İskeleti)

Proje şu şekilde organize edilmiş:

```
src/
├── app/
│   ├── actions/                 ← Tüm Server Actions burada (kalp gibi)
│   │   ├── doctor-actions.ts    ← Doktor ekle/sil, eküri eşleştir
│   │   ├── plan-actions.ts      ← Otomatik plan oluştur, plan getir
│   │   ├── leave-actions.ts     ← İzin işlemleri
│   │   └── fairness-actions.ts  ← Adalet raporları
│   │
│   ├── admin/                   ← Admin panelinin tüm sayfaları
│   │   ├── dashboard/           ← Kontrol paneli (KPI, grafikler, aktiviteler)
│   │   ├── doctors/             ← Doktor yönetimi sayfası
│   │   │   └── [id]/            ← Doktor profil sayfası (detaylı istatistikler)
│   │   ├── plans/[year-month]/  ← Aylık nöbet takvimi (en önemli sayfa)
│   │   ├── leaves/              ← İzin yönetim sayfası
│   │   ├── fairness/            ← Yıllık adalet raporu
│   │   └── analytics/           ← Detaylı analitik raporlar (grafikler)
│   │
│   └── layout.tsx, globals.css  ← Genel layout ve stiller
│
├── components/
│   ├── ui/                      ← shadcn/ui bileşenleri (Button, Calendar, Table vs.)
│   ├── add-doctor-dialog.tsx    ← Modal pencereleri
│   ├── pair-doctor-dialog.tsx
│   ├── manage-leaves-dialog.tsx
│   ├── month-navigator.tsx      ← Ay seçici bileşeni
│   └── navbar.tsx               ← Üst menü
│
└── lib/
    ├── scheduler.ts             ← ★ Projenin beyni (nöbet algoritması)
    ├── supabase.ts              ← Supabase client ve tip tanımları
    └── utils.ts                 ← Tarih, format gibi yardımcı fonksiyonlar
```

## Yeni Özellikler: Modern Frontend

### Dashboard (`/admin/dashboard`)
- **KPI Cards:** Toplam doktor, bu ay nöbetler, adalet skoru, beklemede izin
- **Aylık Trend Grafiği:** Nöbet sayılarının aylık değişimi
- **Doktor Yük Dağılımı:** En yüklü doktorlar
- **Son Aktiviteler:** Yapılan son işlemler
- **Yaklaşan İzinler:** Gelecek 30 gün içindeki izinler

### Doktor Profilleri (`/admin/doctors/[id]`)
- **Kişisel İstatistikler:** Gece borcu, gündüz nöbeti, tatil nöbeti
- **Gün Dağılımı:** Pazartesi'den Pazar'a nöbet dağılımı (bar chart)
- **Nöbet Geçmişi:** Son 20 nöbetin detaylı listesi
- **İzin Geçmişi:** Tüm izin talepleri
- **Eküri Partner:** Eşli nöbet yapan doktor bilgisi

### Analitik Raporlar (`/admin/analytics`)
- **Aylık Trend:** Tüm yıl boyunca nöbet sayılarının trendi
- **Gün Dağılımı Radar:** Haftanın her günü nöbet dağılımı
- **Doktor Yük Dağılımı:** Top 15 doktor
- **Gece Nöbeti Dağılımı:** Top 15 doktor
- **Tatil Nöbeti Dağılımı:** Pie chart ile görselleştirme

### Tasarım Sistemi Güncellemeleri
- **Renk Paleti:** Teal-600 (Primary), Indigo-500 (Secondary), Emerald-500 (Success), Amber-500 (Warning), Rose-500 (Danger)
- **Dark Mode:** Tam dark mode desteği
- **Typography:** Profesyonel hiyerarşi
- **Spacing:** Tutarlı padding ve margin

## Projenin Kalbi: Scheduler Algoritması (`lib/scheduler.ts`)

Burası sistemin en akıllı kısmı.

Algoritma şu sırayla çalışıyor:

1. **Hazırlık** → İzinli ve kapatılmış doktorları listeden çıkarıyor.
2. **Gece Nöbetleri** → En çok borcu olan doktorlardan başlayarak dağıtıyor (herkese ayda maksimum 1 gece).
3. **Hafta Sonu / Tatil Gündüz** → Sadece Hafta Sonu Grubu'ndan 2 kişi atıyor, mümkünse eküri çiftlerini birlikte yazıyor.
4. **Hafta İçi Gündüz** → Normal doktorlardan 3 kişi seçiyor, borç ve yıllık gün dengesini dikkate alıyor.
5. **Son Kontrol** → Peş peşe nöbet yasağını kontrol ediyor. İhlal varsa uyarı veriyor.

Eküri burada "zorunlu" değil, sadece **tercih** olarak kullanılıyor. Ekürisi müsait değilse sistem tek başına atama yapıyor.

### Algoritmanın Kısıtlamaları (Hard Constraints)

- ❌ **Peş peşe nöbet yasağı**: Bir doktor ardışık iki gün nöbet tutamaz
- ❌ **İzin döneminde atama**: İzinli doktor o dönemde atanmaz
- ✅ **Eküri çiftleri**: Mümkünse birlikte atanır, ama zorunlu değil

### Algoritmanın Tercihler (Soft Constraints)

- 🎯 **Borç dengesi**: En çok borcu olan doktor önce atanır
- 🎯 **Gün dağılımı**: Pazartesi nöbeti az olan doktor Pazartesi'ye atanır
- 🎯 **Tatil dengesi**: Tatil nöbeti az olan doktor tatile atanır

## Veritabanı Hikayesi (8 Tablo)

Supabase'de 8 tablo var ve hepsi bir amaca hizmet ediyor:

### Temel Tablolar

| Tablo | Amaç | Örnek |
|-------|------|-------|
| `doctors` | Doktorların temel bilgileri | Dr. Ahmet (Normal Grup, Eküri: Dr. Fatma) |
| `ekuri_pairs` | Hangi iki doktor eküri olmuş? | Dr. Ahmet ↔ Dr. Fatma |
| `monthly_plans` | Her ayın plan kaydı | 2026-05 (draft/published) |
| `shift_assignments` | Asıl nöbet atamaları | 2026-05-15: Dr. Ahmet (Gece) |
| `doctor_leaves` | İzinler | Dr. Ahmet: 2026-05-01 → 2026-05-10 |

### İstatistik Tablolar

| Tablo | Amaç | Güncelleme |
|-------|------|-----------|
| `night_debt` | Gece nöbeti borç takibi | Trigger ile otomatik |
| `yearly_fairness` | Yıllık adalet istatistikleri | Trigger ile otomatik |

### Otomatik Güncelleme Mekanizması

**PostgreSQL Trigger** (`update_doctor_stats`):
- **Sadece INSERT işleminde** çalışır
- Her nöbet atandığında istatistikleri günceller
- Gece nöbeti borç puanlarını günceller
- Gün dağılımı istatistiklerini günceller

**Plan Oluşturma Sonrası Yeniden Hesaplama** (`recalculate_plan_stats`):
- Plan oluşturulduktan sonra çağrılır
- Tüm istatistikleri sıfırdan hesaplar
- Çift sayılma sorunu olmaz
- Veritabanı her zaman tutarlı kalır

**Akış:**
1. Eski nöbetler silinir (trigger çalışmaz)
2. Yeni nöbetler eklenir (trigger çalışır)
3. İstatistikler yeniden hesaplanır (manuel fonksiyon)

Bu sayede **en sağlıklı ve tutarlı** sistem elde edilir.

## Veri Akışı Nasıl İşliyor?

### Senaryo 1: Yeni Doktor Ekleme

```
Admin: "Yeni doktor ekle" → 
  addDoctor() çalışır →
    doctors tablosuna yeni kayıt →
    night_debt tablosuna otomatik kayıt (borç = 0) →
    yearly_fairness tablosuna otomatik kayıt (tüm sayılar = 0)
```

### Senaryo 2: Otomatik Plan Oluşturma

```
Admin: "Otomatik Plan Oluştur" (Mayıs 2026) →
  generateAutoPlan() çalışır →
    Scheduler algoritması başlar →
      1. Gece nöbetleri dağıt
      2. Hafta sonu gündüz dağıt
      3. Hafta içi gündüz dağıt
    Tüm atamalar shift_assignments'a yazılır →
    Trigger otomatik olarak istatistikleri günceller
```

### Senaryo 3: İzin Talepleri

```
Doktor: "15-20 Mayıs izin istiyorum" →
  doctor_leaves tablosuna kayıt →
  Sonraki plan oluşturulurken Scheduler bu doktoru o günlerde atlamaz
```

### Senaryo 4: Manuel Değişiklik

```
Admin: "Dr. Ahmet'i 15 Mayıs'tan 16 Mayıs'a taşı" →
  shift_assignments güncellenir →
  Trigger otomatik olarak istatistikleri yeniden hesaplar
```

## Öne Çıkan Özellikler

✅ **Tamamen Türkçe** arayüz  
✅ **Responsive** tasarım (telefon ve bilgisayarda güzel görünür)  
✅ **Gerçek zamanlı** istatistik güncellemeleri (PostgreSQL trigger sayesinde)  
✅ **Güvenli** Server Actions kullanımı (API route'a gerek yok)  
✅ **Kolay bakım** → Kod temiz ve modüler ayrılmış  
✅ **Type-safe** → TypeScript ile tüm veri tipleri kontrol edilir  
✅ **Hızlı** → Next.js caching ve revalidation sayesinde  

## Teknoloji Stack'i Neden Bu Şekilde?

### Next.js 16 (App Router)
- Server Actions ile backend ve frontend aynı dosyada
- Otomatik caching ve revalidation
- TypeScript desteği
- Hızlı geliştirme

### Supabase (PostgreSQL)
- Açık kaynak, güvenilir
- PostgreSQL'in gücü (trigger, function vs.)
- Gerçek zamanlı subscriptions
- Kolay authentication

### Tailwind CSS
- Hızlı UI geliştirme
- Responsive tasarım
- Minimal CSS boyutu

### shadcn/ui
- Erişilebilir bileşenler
- Özelleştirilebilir
- Tailwind ile uyumlu

## Geliştirici Rehberi

### Yeni Bir Özellik Eklemek İstersen

1. **Veritabanı değişikliği gerekirse** → `supabase/migrations/` klasörüne yeni migration ekle
2. **Server Action gerekirse** → `src/app/actions/` klasörüne yeni dosya ekle
3. **UI bileşeni gerekirse** → `src/components/` klasörüne ekle
4. **Yeni sayfa gerekirse** → `src/app/admin/` klasörüne ekle

### Scheduler Algoritmasını Değiştirmek İstersen

`src/lib/scheduler.ts` dosyasını aç. Algoritmanın mantığı açıkça yazılı:

```typescript
// 1. Gece Nöbetleri Dağıtımı (En Öncelikli)
this.assignNightShifts(days, planId);

// 2. Gündüz Nöbetleri Dağıtımı (Hafta Sonu + Tatil)
this.assignWeekendDayShifts(days, planId);

// 3. Gündüz Nöbetleri Dağıtımı (Hafta İçi)
this.assignWeekdayDayShifts(days, planId);
```

Her metodu ayrı ayrı değiştirebilirsin.

## Kısacası

**Nöbetçi**, sadece bir nöbet programı değil. 73 doktorun adaletini, dinlenmesini ve hastanenin ihtiyaçlarını aynı anda düşünen, akıllı bir sistemdir.

- Projenin **beyni** `scheduler.ts`'te atıyor
- Projenin **kalbi** Server Actions'lerde çarpıyor
- Projenin **gözü** admin panelinde her şeyi izliyor

Kullanıcı ise admin panelinde takvim üzerinde her şeyi kolayca yönetiyor.

---

**Sorularınız varsa, bu dosyayı güncelleyelim!** 🚀
