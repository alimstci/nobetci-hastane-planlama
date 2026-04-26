alter table doctors drop constraint if exists doctors_group_type_check;
alter table doctors add constraint doctors_group_type_check check (group_type in ('normal', 'weekend', 'night_only'));

create or replace function recalculate_plan_stats(p_year int)
returns void as $$
begin
    delete from yearly_fairness
    where year = p_year;

    insert into yearly_fairness (doctor_id, year, monday, tuesday, wednesday, thursday, friday, saturday, sunday, holiday_count, total_day_shifts)
    select
        sa.doctor_id,
        p_year,
        count(case when extract(dow from sa.date) = 1 then 1 end),
        count(case when extract(dow from sa.date) = 2 then 1 end),
        count(case when extract(dow from sa.date) = 3 then 1 end),
        count(case when extract(dow from sa.date) = 4 then 1 end),
        count(case when extract(dow from sa.date) = 5 then 1 end),
        count(case when extract(dow from sa.date) = 6 then 1 end),
        count(case when extract(dow from sa.date) = 0 then 1 end),
        count(case when extract(dow from sa.date) in (0, 6) then 1 end),
        count(*)
    from shift_assignments sa
    where sa.shift_type = 'gunduz'
    and extract(year from sa.date)::int = p_year
    group by sa.doctor_id
    on conflict (doctor_id, year) do update set
        monday = excluded.monday,
        tuesday = excluded.tuesday,
        wednesday = excluded.wednesday,
        thursday = excluded.thursday,
        friday = excluded.friday,
        saturday = excluded.saturday,
        sunday = excluded.sunday,
        holiday_count = excluded.holiday_count,
        total_day_shifts = excluded.total_day_shifts;

    insert into yearly_fairness (doctor_id, year)
    select id, p_year
    from doctors
    on conflict (doctor_id, year) do nothing;

    update night_debt nd
    set total_night_shifts_year = coalesce(ns.total_count, 0),
        last_night_month = ns.last_month,
        debt_points = -coalesce(ns.total_count, 0)
    from (
        select
            d.id as doctor_id,
            count(sa.id)::int as total_count,
            max(to_char(sa.date, 'YYYY-MM')) as last_month
        from doctors d
        left join shift_assignments sa on sa.doctor_id = d.id
          and sa.shift_type = 'gece'
          and extract(year from sa.date)::int = p_year
        group by d.id
    ) ns
    where nd.doctor_id = ns.doctor_id;
end;
$$ language plpgsql;
