import { format, getDay } from 'date-fns';

const RELIGIOUS_AND_HALF_DAY_HOLIDAYS: Record<number, string[]> = {
  2026: [
    '2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22',
    '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30',
  ],
  2027: [
    '2027-03-09', '2027-03-10', '2027-03-11', '2027-03-12',
    '2027-05-15', '2027-05-16', '2027-05-17', '2027-05-18', '2027-05-19',
  ],
  2028: [
    '2028-02-26', '2028-02-27', '2028-02-28', '2028-02-29',
    '2028-05-04', '2028-05-05', '2028-05-06', '2028-05-07', '2028-05-08',
  ],
};

export function getTurkishOfficialHolidays(year: number) {
  return [
    `${year}-01-01`,
    `${year}-04-23`,
    `${year}-05-01`,
    `${year}-05-19`,
    `${year}-07-15`,
    `${year}-08-30`,
    `${year}-10-28`,
    `${year}-10-29`,
    ...(RELIGIOUS_AND_HALF_DAY_HOLIDAYS[year] || []),
  ];
}

export function isTurkishOfficialHoliday(date: Date, extraHolidays: string[] = []) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const year = date.getFullYear();
  return new Set([...getTurkishOfficialHolidays(year), ...extraHolidays]).has(dateStr);
}

export function isWeekendOrTurkishHoliday(date: Date, extraHolidays: string[] = []) {
  const day = getDay(date);
  return day === 0 || day === 6 || isTurkishOfficialHoliday(date, extraHolidays);
}
