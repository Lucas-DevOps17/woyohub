const DEFAULT_APP_TIME_ZONE = "Asia/Bangkok";

export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIME_ZONE ||
  process.env.APP_TIME_ZONE ||
  DEFAULT_APP_TIME_ZONE;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getDateKeyInAppTimeZone(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return dateKeyFormatter.format(new Date(value));
}

export function getTodayDateKey(): string {
  return getDateKeyInAppTimeZone(new Date());
}

export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getRecentDateKeys(endDateKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    shiftDateKey(endDateKey, -(count - 1 - index))
  );
}
