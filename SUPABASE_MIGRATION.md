# Supabase Migration Rehberi

## 📋 Özet

Bu dokümanda Supabase veritabanına uygulanması gereken tüm değişiklikler açıklanmıştır.

---

## 🔧 Yapılacak Değişiklikler

### 1. Trigger Fonksiyonunu Güncelle

**Dosya:** `supabase/migrations/20260420_init.sql` (8. bölüm)

**Adım 1:** Eski trigger'ı sil
```sql
drop trigger if exists trg_update_stats on shift_assignments;
```

**Adım 2:** Eski fonksiyonu sil
```sql
drop function if exists update_doctor_stats();
```

**Adım 3:** Yeni fonksiyonu oluştur
```sql
create or replace function update_doctor_stats()
returns trigger as $$
declare
    v_dow int;
    v_year int;
    v_month_text text;
begin
    v_dow := extract(dow from new.date);
    v_year := extract(year from new.date);
    v_month_text := to_char(new.date, 'YYYY-MM');

    -- Sadece INSERT işleminde çalış
    if (TG_OP = 'INSERT') then
        -- Gece nöbeti borcu azalt (nöbet tuttuğu için debt düşer)
        if (new.shift_type = 'gece') then
            update night_debt 
            set debt_points = debt_points - 1, 
                last_night_month = v_month_text,
                total_night_shifts_year = total_night_shifts_year + 1
            where doctor_id = new.doctor_id;
        else
            -- Gündüz nöbeti adaleti güncelle
            update yearly_fairness set
                monday = case when v_dow = 1 then monday + 1 else monday end,
                tuesday = case when v_dow = 2 then tuesday + 1 else tuesday end,
                wednesday = case when v_dow = 3 then wednesday + 1 else wednesday end,
                thursday = case when v_dow = 4 then thursday + 1 else thursday end,
                friday = case when v_dow = 5 then friday + 1 else friday end,
                saturday = case when v_dow = 6 then saturday + 1 else saturday end,
                sunday = case when v_dow = 0 then sunday + 1 else sunday end,
                total_day_shifts = total_day_shifts + 1
            where doctor_id = new.doctor_id and year = v_year;
        end if;
    end if;
    
    return null;
end;
$$ language plpgsql;
```

**Adım 4:** Yeni trigger'ı oluştur
```sql
create trigger trg_update_stats
after insert on shift_assignments
for each row execute function update_doctor_stats();
```

---

### 2. Yeni Fonksiyon Ekle: `recalculate_plan_stats()`

**Dosya:** `supabase/migrations/20260420_init.sql` (9. bölüm)

```sql
create or replace function recalculate_plan_stats(p_plan_id uuid)
returns void as $$
declare
    v_year int;
begin
    -- Plan'ın yılını al
    select extract(year from to_date(year_month, 'YYYY-MM'))::int
    into v_year
    from monthly_plans
    where id = p_plan_id;

    -- Tüm doktorların bu plan'daki istatistiklerini sıfırla
    delete from yearly_fairness
    where doctor_id in (
        select distinct doctor_id from shift_assignments where plan_id = p_plan_id
    )
    and year = v_year;

    -- Yeniden hesapla: Her nöbet için istatistikleri güncelle
    insert into yearly_fairness (doctor_id, year, monday, tuesday, wednesday, thursday, friday, saturday, sunday, holiday_count, total_day_shifts)
    select 
        sa.doctor_id,
        v_year,
        count(case when extract(dow from sa.date) = 1 then 1 end),
        count(case when extract(dow from sa.date) = 2 then 1 end),
        count(case when extract(dow from sa.date) = 3 then 1 end),
        count(case when extract(dow from sa.date) = 4 then 1 end),
        count(case when extract(dow from sa.date) = 5 then 1 end),
        count(case when extract(dow from sa.date) = 6 then 1 end),
        count(case when extract(dow from sa.date) = 0 then 1 end),
        0, -- holiday_count (ayrı hesaplanacak)
        count(*)
    from shift_assignments sa
    where sa.plan_id = p_plan_id
    and sa.shift_type = 'gunduz'
    group by sa.doctor_id
    on conflict (doctor_id, year) do update set
        monday = excluded.monday,
        tuesday = excluded.tuesday,
        wednesday = excluded.wednesday,
        thursday = excluded.thursday,
        friday = excluded.friday,
        saturday = excluded.saturday,
        sunday = excluded.sunday,
        total_day_shifts = excluded.total_day_shifts;
end;
$$ language plpgsql;
```

---

## 🚀 Deployment Yöntemleri

### Yöntem 1: Supabase Dashboard (En Kolay)

1. **Supabase Dashboard'a git:**
   - https://app.supabase.com
   - Projenizi seçin
   - "SQL Editor" sekmesine tıklayın

2. **Yeni Query oluştur:**
   - "New Query" butonuna tıklayın
   - Yukarıdaki SQL komutlarını kopyala-yapıştır

3. **Çalıştır:**
   - "Run" butonuna tıklayın
   - Başarı mesajını bekle

---

### Yöntem 2: Supabase CLI

**Kurulum:**
```bash
npm install -g supabase
```

**Login:**
```bash
supabase login
```

**Migration Push:**
```bash
supabase db push
```

**Veya manuel:**
```bash
supabase migration up
```

---

### Yöntem 3: psql (PostgreSQL CLI)

**Bağlantı:**
```bash
psql postgresql://[user]:[password]@[host]:[port]/[database]
```

**SQL Dosyasını Çalıştır:**
```bash
psql -U [user] -h [host] -d [database] -f migration.sql
```

---

## ✅ Doğrulama

Migration başarılı olup olmadığını kontrol et:

### 1. Trigger Kontrolü
```sql
-- Trigger'ı kontrol et
select * from pg_trigger where tgname = 'trg_update_stats';

-- Sonuç: 1 satır döndürmelidir
```

### 2. Fonksiyon Kontrolü
```sql
-- Fonksiyonları kontrol et
select * from pg_proc where proname in ('update_doctor_stats', 'recalculate_plan_stats');

-- Sonuç: 2 satır döndürmelidir
```

### 3. Trigger Tanımını Kontrol Et
```sql
-- Trigger tanımını göster
select pg_get_triggerdef(oid) from pg_trigger where tgname = 'trg_update_stats';

-- Sonuç: "after insert on shift_assignments" içermeli
```

---

## 🧪 Test Etme

### Test Senaryosu: Plan Oluşturma

**Adım 1:** Test doktoru ekle
```sql
insert into doctors (full_name, group_type, is_active)
values ('Test Doktor', 'normal', true)
returning id;
-- Dönen ID'yi not et: [doctor_id]
```

**Adım 2:** Test planı ekle
```sql
insert into monthly_plans (year_month, status)
values ('2026-05', 'draft')
returning id;
-- Dönen ID'yi not et: [plan_id]
```

**Adım 3:** Manuel nöbet ekle
```sql
insert into shift_assignments (plan_id, date, shift_type, doctor_id, is_ekuri)
values ('[plan_id]', '2026-05-12', 'gunduz', '[doctor_id]', false);
```

**Adım 4:** İstatistikleri kontrol et
```sql
select * from yearly_fairness 
where doctor_id = '[doctor_id]' and year = 2026;
-- Sonuç: monday = 1 (Pazartesi olduğu için)
```

**Adım 5:** Fonksiyonu çalıştır
```sql
select recalculate_plan_stats('[plan_id]'::uuid);
```

**Adım 6:** İstatistikleri tekrar kontrol et
```sql
select * from yearly_fairness 
where doctor_id = '[doctor_id]' and year = 2026;
-- Sonuç: monday = 1 (doğru hesaplanmış)
```

---

## 🔙 Geri Alma (Rollback)

Eğer sorun olursa, eski haline dön:

```sql
-- Yeni trigger'ı sil
drop trigger if exists trg_update_stats on shift_assignments;

-- Yeni fonksiyonları sil
drop function if exists update_doctor_stats();
drop function if exists recalculate_plan_stats(uuid);

-- Eski trigger'ı geri yükle
create or replace function update_doctor_stats()
returns trigger as $$
declare
    v_dow int;
    v_year int;
    v_month_text text;
begin
    v_dow := extract(dow from coalesce(new.date, old.date));
    v_year := extract(year from coalesce(new.date, old.date));
    v_month_text := to_char(coalesce(new.date, old.date), 'YYYY-MM');

    if (TG_OP = 'INSERT') then
        if (new.shift_type = 'gece') then
            update night_debt 
            set debt_points = debt_points - 1, 
                last_night_month = v_month_text,
                total_night_shifts_year = total_night_shifts_year + 1
            where doctor_id = new.doctor_id;
        else
            update yearly_fairness set
                monday = case when v_dow = 1 then monday + 1 else monday end,
                tuesday = case when v_dow = 2 then tuesday + 1 else tuesday end,
                wednesday = case when v_dow = 3 then wednesday + 1 else wednesday end,
                thursday = case when v_dow = 4 then thursday + 1 else thursday end,
                friday = case when v_dow = 5 then friday + 1 else friday end,
                saturday = case when v_dow = 6 then saturday + 1 else saturday end,
                sunday = case when v_dow = 0 then sunday + 1 else sunday end,
                total_day_shifts = total_day_shifts + 1
            where doctor_id = new.doctor_id and year = v_year;
        end if;
    elsif (TG_OP = 'DELETE') then
        if (old.shift_type = 'gece') then
            update night_debt 
            set debt_points = debt_points + 1,
                total_night_shifts_year = total_night_shifts_year - 1
            where doctor_id = old.doctor_id;
        else
            update yearly_fairness set
                monday = case when v_dow = 1 then monday - 1 else monday end,
                tuesday = case when v_dow = 2 then tuesday - 1 else tuesday end,
                wednesday = case when v_dow = 3 then wednesday - 1 else wednesday end,
                thursday = case when v_dow = 4 then thursday - 1 else thursday end,
                friday = case when v_dow = 5 then friday - 1 else friday end,
                saturday = case when v_dow = 6 then saturday - 1 else saturday end,
                sunday = case when v_dow = 0 then sunday - 1 else sunday end,
                total_day_shifts = total_day_shifts - 1
            where doctor_id = old.doctor_id and year = v_year;
        end if;
    end if;
    return null;
end;
$$ language plpgsql;

-- Eski trigger'ı geri yükle
create trigger trg_update_stats
after insert or delete on shift_assignments
for each row execute function update_doctor_stats();
```

---

## 📊 Değişiklik Özeti

| Öğe | Eski | Yeni | Neden |
|-----|-----|-----|-------|
| Trigger | INSERT + DELETE | Sadece INSERT | Çift sayılma sorunu |
| Fonksiyon | update_doctor_stats | update_doctor_stats + recalculate_plan_stats | Tutarlılık |
| Plan Oluşturma | 2 adım | 3 adım | Manuel hesaplama |
| Hata Riski | Yüksek | Düşük | Optimize edildi |

---

## 🎯 Sonuç

Migration başarılı olduğunda:
- ✅ Trigger sadece INSERT'de çalışıyor
- ✅ Yeni fonksiyon mevcut
- ✅ Plan oluşturma 3 adımda yapılıyor
- ✅ İstatistikler doğru hesaplanıyor
- ✅ Veritabanı tutarlı kalıyor

**Sistem production'a hazır!** 🚀
