// Date helpers for month keys ("YYYY-MM") and transaction dates ("YYYY-MM-DD").
//
// Everything here is pure string math on purpose. Round-tripping through
// `new Date(...).toISOString()` converts local midnight to UTC, which shifts the
// date backwards a day for anyone east of Greenwich — a day-1 recurring rule would
// land in the previous month and then be silently dropped on reload, because
// useBudget only keeps transactions whose `month` has a matching budget row.

// A Date as "YYYY-MM-DD" in the *viewer's own* timezone.
//
// Always use this instead of `.toISOString().split('T')[0]`, which renders UTC: at
// 11pm in Chicago (UTC-6) the UTC date is already tomorrow, so a transaction logged
// late at night would be filed on the wrong day.
export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Today's date, in the viewer's timezone.
export const todayKey = (): string => toDateKey(new Date());

// Number of days in a "YYYY-MM" month. Day 0 of the *next* month is the last day
// of this one, which handles leap years without a special case.
export const daysInMonth = (month: string): number => {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return 31;
  return new Date(y, m, 0).getDate();
};

// ("2026-02", 31) -> "2026-02-28"   ("2028-02", 31) -> "2028-02-29"
// ("2026-04", 31) -> "2026-04-30"   ("2026-04",  0) -> "2026-04-01"
export const monthDayToDate = (month: string, dayOfMonth: number): string => {
  const max = daysInMonth(month);
  const day = Math.min(Math.max(Math.trunc(dayOfMonth) || 1, 1), max);
  return `${month}-${String(day).padStart(2, '0')}`;
};

// 1 -> "1st", 2 -> "2nd", 11 -> "11th", 31 -> "31st"
export const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// "2026-01" -> "2025-12"
export const getPreviousMonth = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Which existing month a new one copies its subcategories from: an explicit choice
// if it exists, else the month before the target, else the most recent month there is.
// Shared so the New Month modal previews exactly what createNewMonth will do.
export const resolveSourceMonth = (
  availableMonths: string[],
  targetMonth: string,
  sourceMonth?: string
): string | null => {
  if (sourceMonth && availableMonths.includes(sourceMonth)) return sourceMonth;
  const prev = getPreviousMonth(targetMonth);
  if (availableMonths.includes(prev)) return prev;
  const sorted = [...availableMonths].sort().reverse();
  return sorted.length > 0 ? sorted[0] : null;
};
