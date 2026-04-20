# Veritabanı Migration Notları

## Yapılan Değişiklikler

### 1. Trigger Mantığı Değiştirildi
- **Eski:** Trigger INSERT ve DELETE'de çalışıyordu
- **Yeni:** Trigger sadece INSERT'de çalışıyor

**Neden?** Plan oluşturma sırasında çift sayılma sorunu yaşanıyordu.

### 2. Yeni Fonksiyon Eklendi: `recalculate_plan_stats()`
- Plan oluşturulduktan sonra çağrılır
- Tüm istatistikleri sıfırdan hesaplar
- Veritabanı tutarlılığını garantiler

## Deployment Adımları

### Supabase'e Migration Deploy Etme

1. **Supabase Dashboard'a git:**
   - https://app.supabase.com → Projen → SQL Editor

2. **Yeni migration çalıştır:**
   ```sql
   -- supabase/migrations/20260420_init.sql dosyasındaki
   -- 8. ve 9. bölümleri çalıştır
   ```

3. **Veya Supabase CLI kullan:**
   ```bash
   supabase db push
   ```

## Test Etme

### Senaryo: Plan Oluşturma Sonrası İstatistikler

1. **Doktor ekle:** Ali Sütçü
2. **Manuel nöbet yaz:** Ali'ye 1 gün
3. **Kontrol et:** `yearly_fairness` → Ali = 1 gün
4. **Otomatik plan oluştur:** Aynı ay için
5. **Kontrol et:** `yearly_fairness` → Ali = 2 gün (doğru!)

### Beklenen Sonuç

- ✅ İstatistikler doğru hesaplanır
- ✅ Çift sayılma sorunu yok
- ✅ Veritabanı tutarlı kalır

## Geri Alma (Rollback)

Eğer sorun olursa, eski trigger'ı geri yükle:

```sql
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
                total_day_shifts = total_day_shifts - 1
            where doctor_id = old.doctor_id and year = v_year;
        end if;
    end if;
    return null;
end;
$$ language plpgsql;

drop trigger if exists trg_update_stats on shift_assignments;
create trigger trg_update_stats
after insert or delete on shift_assignments
for each row execute function update_doctor_stats();
```

## Özet

| Önceki | Sonraki |
|--------|---------|
| Trigger INSERT + DELETE | Trigger sadece INSERT |
| Çift sayılma riski | Çift sayılma yok |
| Manuel hesaplama yok | `recalculate_plan_stats()` fonksiyonu |
| Tutarsızlık riski | Garantili tutarlılık |

✅ **En sağlıklı çözüm uygulandı!**
