Hacım, **çok iyi bir draft** yazmışsın. Genel yapı sağlam ama bazı yerlerde **çelişkiler** ve **net olmayan** kısımlar var.  

Claude 3.5 Sonnet’in hiçbir şeyi kaçırmadan, tutarlı ve temiz kodlaması için aşağıda **düzeltilmiş, daha net ve akıcı** versiyonu veriyorum.

### ✅ Güncellenmiş ve İyileştirilmiş Nihai .md Dosyası

```markdown
# Nöbet Dağıtım Sistemi - Teknik Şartname (Nihai Versiyon)
**Proje Adı:** Hastane Nöbet Planlama Sistemi  
**Teknoloji Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase + Vercel  
**Versiyon:** 1.1.0  
**Tarih:** Nisan 2026

## 1. Temel İş Kuralları ve Kapasite Yönetimi

Sistemde **73 doktor** vardır ve günlük nöbet kontenjanı doktor sayısından azdır. Bu yüzden **"Havuz + Borç"** mantığı ile uzun vadeli adalet sağlanacaktır.

### Doktor Grupları
- **Normal Doktorlar** (~55-57 kişi)
- **Hafta Sonu Grubu** (16-18 kişi) → Sadece hafta sonu ve resmi tatil gündüz nöbetlerinden sorumludur.

### Nöbet Türleri ve Günlük Kontenjan
- **Gündüz Nöbeti (08:00 - 16:00)**
  - Hafta içi (Pzt–Cum): **3 kişi**
  - Hafta sonu & Resmi Tatil: **2 kişi** (Sadece Hafta Sonu Grubu’ndan)
- **Gece Nöbeti (16:00 - 08:00)**: Her gün **1 kişi** (Ayda yaklaşık 30 kontenjan)

### Gece Nöbeti Havuz Sistemi (En Kritik Kural)
- Her doktor bir ayda **en fazla 1 gece nöbeti** tutabilir.
- 30 günlük ayda sadece **30 doktor** gece nöbeti tutar, kalan ~43 doktor o ay gece nöbeti tutmaz.
- **Borç Sistemi Sadece Gece Nöbetleri İçin** geçerlidir:
  - Bir ay gece nöbeti tutmayan doktor, bir sonraki ay **yüksek öncelik** kazanır (`debt_points` artar).
  - Mart’ta gece nöbeti tutan doktorlar Nisan’da gece nöbeti tutmaz (döngüsel adalet).
- Eküri ile ilgili hiçbir borç veya öncelik mekanizması yoktur.

### Gündüz Nöbeti Dağılımı
- Her ay tüm doktorların gündüz nöbeti tutma zorunluluğu **yoktur**.
- Dağıtım **debt_points** (nöbet borcu) yüksek olan doktorlara öncelik verilerek yapılır.

### Eküri Sistemi (Opsiyonel)
- Eküri eşleşmesi **zorunlu değildir**.
- Ekürisi olan doktorlar, mümkün olduğunca **birlikte** gündüz nöbetine atanır.
- Ekürisi izinli veya nöbet dışı ise, doktor tek başına veya başka biriyle atanır. Eküri için ekstra telafi yapılmaz.

### Peş Peşe Nöbet Yasağı (Hard Constraint)
- Bir doktorun **gündüz nöbetinden sonraki gün** gece nöbeti yazılmayacak.
- Bir doktorun **gece nöbetinden sonraki gün** gündüz nöbeti yazılmayacak.
- En az **1 tam gün** dinlenme zorunludur.

### Resmi Tatiller
- Resmi tatillerde **sadece gündüz nöbeti** tutulur (2 kişi, Hafta Sonu Grubu’ndan).
- Resmi tatil nöbetleri **yıllık bazda adil** dağıtılacaktır.

### İzin ve Manuel Müdahale
- İzinli doktor o ay **hiçbir nöbete** yazılmaz.
- Admin herhangi bir doktoru herhangi bir ay için **nöbet dışı** bırakabilir.
- Nöbet dışı bırakılan doktorun gece nöbet hakkı bir sonraki aya borç olarak geçer.

## 2. Supabase Veritabanı Şeması

```sql
-- Doktorlar
create table doctors (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null unique,
  group_type text check (group_type in ('normal', 'weekend')),
  ekuri_pair_id uuid references ekuri_pairs(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Eküri Çiftleri
create table ekuri_pairs (
  id uuid primary key default uuid_generate_v4(),
  doctor1_id uuid references doctors(id),
  doctor2_id uuid references doctors(id),
  constraint unique_pair unique(doctor1_id, doctor2_id)
);

-- Aylık Planlar
create table monthly_plans (
  id uuid primary key default uuid_generate_v4(),
  year_month text not null, -- "2026-05"
  status text default 'draft' check (status in ('draft', 'published', 'locked'))
);

-- Nöbet Atamaları
create table shift_assignments (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references monthly_plans(id) on delete cascade,
  date date not null,
  shift_type text check (shift_type in ('gunduz', 'gece')),
  doctor_id uuid references doctors(id),
  is_ekuri boolean default false,
  partner_id uuid references doctors(id),
  created_at timestamptz default now()
);

-- İzinler
create table doctor_leaves (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references doctors(id),
  start_date date not null,
  end_date date not null
);

-- Gece Nöbeti Borç Takibi (Önemli)
create table night_debt (
  doctor_id uuid primary key references doctors(id),
  debt_points int default 0,
  last_night_month text, -- "2026-03"
  total_night_shifts_year int default 0
);

-- Yıllık Adalet Takibi
create table yearly_fairness (
  doctor_id uuid references doctors(id),
  year int not null,
  monday int default 0,
  tuesday int default 0,
  wednesday int default 0,
  thursday int default 0,
  friday int default 0,
  saturday int default 0,
  sunday int default 0,
  holiday_count int default 0,
  total_day_shifts int default 0,
  primary key (doctor_id, year)
);
```

## 3. Nöbet Atama Algoritması (Sıra Önemli)

1. **Hazırlık**: İzinli ve manuel nöbet dışı doktorları listeden çıkar.
2. **Gece Nöbetleri Dağıtımı** (En öncelikli):
   - `night_debt.debt_points` en yüksek olanlardan başla.
   - Peş peşe yasağını kontrol et.
   - Her doktora **en fazla 1** gece nöbeti ata.
3. **Hafta Sonu + Resmi Tatil Gündüz Nöbetleri**:
   - Sadece Hafta Sonu Grubu’ndan, mümkünse eküri ikilisi olarak ata.
4. **Hafta İçi Gündüz Nöbetleri**:
   - `debt_points` yüksek olan Normal doktorlardan 3 kişi seç.
   - Eküri müsaitse birlikte ata.
5. **Son Dengeleme**:
   - Peş peşe nöbet kontrolü yap.
   - Gerekirse swap ile düzelt.
   - Admin’e çakışma raporu göster.

## 4. Teknik ve UI Gereksinimler
- Admin panelinde **“Otomatik Plan Oluştur”** butonu net çalışmalı.
- Otomatik dağıtımdan sonra **manuel düzenleme** (sürükle-bırak veya seçim) desteklenmeli.
- Borç puanları her değişiklikte otomatik güncellenmeli.
- Takvim görünümünde renkli göstergeler (eküri aynı renk, borç yüksek = öncelikli vs.) olmalı.
- Yıllık adalet raporu sayfası zorunludur.

---

**Claude 3.5 Sonnet Talimatı:**

Bu şartnameye **tamamen uyarak** Next.js 15 + Supabase kullanarak sistemi geliştir.  
Önce veritabanı migration’larını ve tabloları oluştur.  
Sonra gece borç sistemi ve atama algoritmasını implement et.  
En son kullanıcı arayüzünü yap. Hiçbir kuralı esnetme.

---

Hacım, bu versiyon **daha temiz, tutarlı ve Claude’un rahat okuyacağı** seviyede.

### Ne yapmak istersin?

- Bu haliyle yeterli mi? → Direkt Claude’a ver.
- Daha da kısaltayım mı?
- Seed script (73 doktor + örnek eküri) ekleyeyim mi?
- Algoritma kısmını daha kod odaklı detaylandırayım mı?

Söyle, hemen son halini vereyim. 🔥