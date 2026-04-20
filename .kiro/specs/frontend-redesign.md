# Frontend Redesign Spec - Nöbetçi

## Genel Amaç
Nöbetçi sisteminin frontend'ini modern, profesyonel ve hikayeye uygun hale getirmek. Tasarım sistemini güçlendirmek, dashboard eklemek, doktor profilleri oluşturmak ve raporlama özelliklerini geliştirmek.

## Faz 1: Design System Güçlendirme

### 1.1 Renk Paleti Modernizasyonu
**Dosya:** `src/app/globals.css`

**Hedef:**
- Mavi/gri yerine teal/indigo kullan
- Medikal profesyonellik hissi ver
- Dark mode desteği ekle
- Erişilebilirlik (WCAG AA) sağla

**Renkler:**
- Primary: Teal-600 (Güven, profesyonellik)
- Secondary: Indigo-500 (Vurgu)
- Success: Emerald-500 (Başarı)
- Warning: Amber-500 (Uyarı)
- Danger: Rose-500 (Hata)

### 1.2 Typography Hiyerarşisi
**Dosya:** `src/app/globals.css`

**Hedef:**
- H1: 3xl, font-black, tracking-tight
- H2: 2xl, font-bold, tracking-tight
- H3: xl, font-bold
- Body: base, font-medium
- Caption: xs, font-semibold

### 1.3 Spacing & Padding Standardizasyonu
**Dosya:** `tailwind.config.js` (yeni)

**Hedef:**
- Tutarlı spacing scale
- Consistent padding/margin
- Grid system (12 column)

---

## Faz 2: Dashboard & Analytics

### 2.1 Ana Dashboard Sayfası
**Dosya:** `src/app/admin/dashboard/page.tsx` (yeni)

**Bileşenler:**
- KPI Cards (4 adet)
  - Toplam Doktor
  - Bu Ay Nöbetler
  - Ortalama Adalet Skoru
  - Beklemede İzin
- Grafik: Aylık Nöbet Dağılımı (Recharts)
- Grafik: Doktor Yük Dağılımı (Pie Chart)
- Son Aktiviteler (Activity Feed)
- Yaklaşan İzinler (Mini List)

### 2.2 KPI Bileşeni
**Dosya:** `src/components/kpi-card.tsx` (yeni)

**Props:**
- title: string
- value: number | string
- icon: React.ReactNode
- trend?: number (%)
- color?: 'primary' | 'success' | 'warning' | 'danger'

### 2.3 Analytics Sayfası
**Dosya:** `src/app/admin/analytics/page.tsx` (yeni)

**Bileşenler:**
- Aylık trend grafiği
- Doktor başına nöbet sayısı
- Gün dağılımı analizi
- İzin istatistikleri
- Export to PDF butonu

---

## Faz 3: Doktor Profilleri

### 3.1 Doktor Detay Sayfası
**Dosya:** `src/app/admin/doctors/[id]/page.tsx` (yeni)

**Bileşenler:**
- Doktor bilgileri (ad, grup, eküri)
- Kişisel istatistikler
  - Toplam nöbet sayısı
  - Gece nöbeti borcu
  - Gün dağılımı
  - Tatil nöbeti sayısı
- Nöbet geçmişi (tablo)
- İzin geçmişi (tablo)
- Eküri partner bilgisi
- Düzenle / Sil butonları

### 3.2 Doktor İstatistik Kartı
**Dosya:** `src/components/doctor-stats-card.tsx` (yeni)

**Props:**
- doctor: Doctor
- stats: YearlyFairness & NightDebt

**Gösterilecekler:**
- Profil resmi (avatar)
- Grup tipi badge
- Eküri durumu
- Hızlı istatistikler

### 3.3 Doktor Nöbet Geçmişi
**Dosya:** `src/components/doctor-shift-history.tsx` (yeni)

**Özellikler:**
- Filtreleme (ay, nöbet tipi)
- Sıralama
- Pagination

---

## Faz 4: Görsel Takvim

### 4.1 Takvim Bileşeni Geliştirme
**Dosya:** `src/components/shift-calendar.tsx` (yeni)

**Özellikler:**
- Aylık takvim görünümü
- Drag-drop nöbet değişimi
- Renkli shift gösterimi
- Tooltip ile detay
- Responsive (mobil uyumlu)

### 4.2 Shift Kartı
**Dosya:** `src/components/shift-card.tsx` (yeni)

**Props:**
- shift: ShiftAssignment
- doctor: Doctor
- onClick?: () => void
- draggable?: boolean

### 4.3 Takvim Aksiyon Menüsü
**Dosya:** `src/components/calendar-actions.tsx` (yeni)

**Özellikler:**
- Nöbeti değiştir
- Nöbeti sil
- Doktor değiştir
- Notlar ekle

---

## Faz 5: Raporlama

### 5.1 Grafik Bileşenleri
**Dosya:** `src/components/charts/` (yeni klasör)

**Bileşenler:**
- `bar-chart.tsx` - Nöbet dağılımı
- `pie-chart.tsx` - Doktor yük dağılımı
- `line-chart.tsx` - Aylık trend
- `heatmap.tsx` - Gün dağılımı ısı haritası

### 5.2 Rapor Sayfası
**Dosya:** `src/app/admin/reports/page.tsx` (yeni)

**Özellikler:**
- Tarih aralığı seçimi
- Filtreleme (doktor, grup, nöbet tipi)
- Grafik gösterimi
- Tablo export
- PDF download

### 5.3 PDF Export Fonksiyonu
**Dosya:** `src/lib/pdf-export.ts` (yeni)

**Özellikler:**
- Rapor PDF'e çevir
- Grafikleri embed et
- Başlık ve footer ekle

---

## Faz 6: Notifikasyonlar & UX

### 6.1 Gerçek Zamanlı Notifikasyonlar
**Dosya:** `src/components/notifications.tsx` (yeni)

**Özellikler:**
- Plan oluşturuldu
- Nöbet değişti
- İzin onaylandı
- Sistem uyarıları

### 6.2 Onboarding
**Dosya:** `src/app/onboarding/page.tsx` (yeni)

**Adımlar:**
1. Hoş geldiniz
2. Doktor ekleme
3. Eküri eşleştirme
4. İlk plan oluşturma
5. Tamamlandı

---

## Teknik Detaylar

### Yeni Bağımlılıklar
```json
{
  "recharts": "^2.10.0",
  "react-big-calendar": "^1.8.5",
  "react-dnd": "^16.0.1",
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1"
}
```

### Yeni Server Actions
- `src/app/actions/dashboard-actions.ts` - Dashboard verileri
- `src/app/actions/doctor-profile-actions.ts` - Doktor detayları
- `src/app/actions/analytics-actions.ts` - Analitik verileri
- `src/app/actions/report-actions.ts` - Rapor verileri

### Yeni Sayfalar
- `/admin/dashboard` - Ana dashboard
- `/admin/analytics` - Analitik
- `/admin/doctors/[id]` - Doktor profili
- `/admin/reports` - Raporlar
- `/onboarding` - Başlangıç rehberi

---

## Başarı Kriterleri

✅ Tasarım sistemi tutarlı ve profesyonel (Teal/Indigo renk paleti)
✅ Dashboard KPI'ları gerçek verilerle doldurulmuş  
✅ Doktor profilleri detaylı ve kullanışlı  
✅ Analytics sayfası grafik ve tablo içeriyor  
✅ Mobil uyumlu tüm sayfalar  
✅ Dark mode çalışıyor  
✅ Erişilebilirlik (WCAG AA) sağlanmış  

## Tamamlanan Faz

### ✅ Faz 1: Design System Güçlendirme
- Renk paleti modernize edildi (Teal-600 Primary, Indigo-500 Secondary)
- Dark mode desteği eklendi
- Typography hiyerarşisi düzeltildi

### ✅ Faz 2: Dashboard & Analytics
- `src/app/admin/dashboard/page.tsx` - Ana dashboard sayfası
- `src/components/kpi-card.tsx` - KPI bileşeni
- `src/app/actions/dashboard-actions.ts` - Dashboard verileri
- Aylık trend grafiği (LineChart)
- Doktor yük dağılımı (BarChart)
- Son aktiviteler listesi
- Yaklaşan izinler listesi

### ✅ Faz 3: Doktor Profilleri
- `src/app/admin/doctors/[id]/page.tsx` - Doktor detay sayfası
- `src/app/actions/doctor-profile-actions.ts` - Doktor profil verileri
- Kişisel istatistikler (gece, gündüz, tatil)
- Gün dağılımı bar chart
- Nöbet geçmişi tablosu
- İzin geçmişi tablosu
- Eküri partner bilgisi

### ✅ Faz 5: Raporlama
- `src/app/admin/analytics/page.tsx` - Analytics sayfası
- `src/app/actions/analytics-actions.ts` - Analytics verileri
- Aylık trend (LineChart)
- Gün dağılımı (RadarChart)
- Doktor yük dağılımı (BarChart)
- Gece nöbeti dağılımı (BarChart)
- Tatil nöbeti dağılımı (PieChart)

### ✅ Navbar Güncellemeleri
- Dashboard linki eklendi
- Analytics linki eklendi
- Renk paleti güncelleştirildi (Teal)
- Doktor listesine profil linki eklendi

## Kalan Faz

### ⏳ Faz 4: Görsel Takvim (İsteğe Bağlı)
- Drag-drop nöbet değişimi
- Renkli shift gösterimi
- Tooltip ile detay

### ⏳ Faz 6: Notifikasyonlar & UX (İsteğe Bağlı)
- Gerçek zamanlı notifikasyonlar
- Onboarding rehberi
