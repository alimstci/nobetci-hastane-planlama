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
        count(case when extract(dow from sa.date) in (0, 6)
          or to_char(sa.date, 'MM-DD') in ('01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-28', '10-29')
          or sa.date::text in (
            '2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22',
            '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30',
            '2027-03-09', '2027-03-10', '2027-03-11', '2027-03-12',
            '2027-05-15', '2027-05-16', '2027-05-17', '2027-05-18', '2027-05-19',
            '2028-02-26', '2028-02-27', '2028-02-28', '2028-02-29',
            '2028-05-04', '2028-05-05', '2028-05-06', '2028-05-07', '2028-05-08'
          )
        then 1 end),
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
