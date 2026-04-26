-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Eküri Çiftleri (Önce bunu oluşturuyoruz çünkü doctors buna referans verecek)
create table ekuri_pairs (
  id uuid primary key default uuid_generate_v4(),
  doctor1_id uuid,
  doctor2_id uuid,
  created_at timestamptz default now(),
  constraint unique_pair unique(doctor1_id, doctor2_id)
);

-- 2. Doktorlar
create table doctors (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null unique,
  group_type text check (group_type in ('normal', 'weekend', 'night_only')),
  ekuri_pair_id uuid references ekuri_pairs(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Eküri çiftlerine foreign key ekleyelim (circular dependency çözümü)
alter table ekuri_pairs add foreign key (doctor1_id) references doctors(id) on delete cascade;
alter table ekuri_pairs add foreign key (doctor2_id) references doctors(id) on delete cascade;

-- 3. Aylık Planlar
create table monthly_plans (
  id uuid primary key default uuid_generate_v4(),
  year_month text not null unique, -- Format: "2026-05"
  status text default 'draft' check (status in ('draft', 'published', 'locked')),
  created_at timestamptz default now()
);

-- 4. Nöbet Atamaları
create table shift_assignments (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references monthly_plans(id) on delete cascade,
  date date not null,
  shift_type text check (shift_type in ('gunduz', 'gece')),
  doctor_id uuid references doctors(id) on delete cascade,
  is_ekuri boolean default false,
  partner_id uuid references doctors(id) on delete set null,
  created_at timestamptz default now()
);

-- 5. İzinler
create table doctor_leaves (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references doctors(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  description text,
  created_at timestamptz default now()
);

-- 6. Gece Nöbeti Borç Takibi
create table night_debt (
  doctor_id uuid primary key references doctors(id) on delete cascade,
  debt_points int default 0,
  last_night_month text, -- Format: "2026-03"
  total_night_shifts_year int default 0
);

-- 7. Yıllık Adalet Takibi
create table yearly_fairness (
  doctor_id uuid references doctors(id) on delete cascade,
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

-- 8. Otomatik İstatistik Güncelleme Fonksiyonu
-- Sadece INSERT işleminde çalışır (DELETE'de çalışmaz - plan oluşturma sırasında manuel hesaplama yapılır)
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

-- Trigger sadece INSERT'te çalışır
create trigger trg_update_stats
after insert on shift_assignments
for each row execute function update_doctor_stats();

-- 9. Plan Oluşturma Sonrası İstatistikleri Yeniden Hesaplama Fonksiyonu
-- Plan oluşturulduğunda çağrılır, tüm istatistikleri sıfırdan hesaplar
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
