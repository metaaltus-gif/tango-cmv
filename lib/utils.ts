export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatUSD(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDateUS(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getWeekStart(d: Date = new Date()): Date {
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const MONTHS_PT = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const MONTHS_EN = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const MONTHS_ES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

export function formatWeekRange(
  weekStart: string,
  locale: "pt" | "en" | "es" = "pt"
): string {
  // weekStart: "YYYY-MM-DD"
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  const months = locale === "en" ? MONTHS_EN : locale === "es" ? MONTHS_ES : MONTHS_PT;
  const sMonth = months[start.getUTCMonth()];
  const eMonth = months[end.getUTCMonth()];
  const sDay = start.getUTCDate();
  const eDay = end.getUTCDate();
  const sYear = start.getUTCFullYear();
  const eYear = end.getUTCFullYear();

  if (sYear !== eYear) {
    return `${sDay} ${sMonth} ${sYear} — ${eDay} ${eMonth} ${eYear}`;
  }
  if (sMonth === eMonth) {
    return `${sDay}—${eDay} ${sMonth} ${sYear}`;
  }
  return `${sDay} ${sMonth} — ${eDay} ${eMonth} ${sYear}`;
}

export function formatWeekRangeShort(weekStart: string, locale: "pt" | "en" | "es" = "pt"): string {
  // Sem o ano (pra usar em espaços apertados)
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  const months = locale === "en" ? MONTHS_EN : locale === "es" ? MONTHS_ES : MONTHS_PT;
  const sMonth = months[start.getUTCMonth()];
  const eMonth = months[end.getUTCMonth()];
  const sDay = start.getUTCDate();
  const eDay = end.getUTCDate();

  if (sMonth === eMonth) return `${sDay}—${eDay} ${sMonth}`;
  return `${sDay} ${sMonth}—${eDay} ${eMonth}`;
}
