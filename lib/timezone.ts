import { DateTime, IANAZone } from "luxon";

/** A curated list for the form; any valid IANA zone can still be typed in. */
export const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Oslo",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Pacific/Auckland",
];

export function isValidTimezone(zone: string): boolean {
  return IANAZone.isValidZone(zone);
}

/**
 * Convert a clinic-local date + wall-clock time into a single unambiguous UTC
 * instant. This is the ONLY place where local input becomes stored data.
 *
 * "2026-11-25 17:00 Europe/London" -> "2026-11-25T17:00:00.000Z"
 * (London is on GMT in November.)
 */
export function deadlineToUtc(
  date: string,
  time: string,
  zone: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  if (!isValidTimezone(zone)) return null;

  const local = DateTime.fromISO(`${date}T${time}`, { zone });
  if (!local.isValid) return null;

  return local.toUTC().toISO({ suppressMilliseconds: true });
}

export interface DeadlineDisplay {
  date: string; // "25 Nov 2026"
  time: string; // "5:00 PM"
  dateTime: string; // "25 Nov 2026 · 5:00 PM"
  zone: string; // "Europe/London"
  zoneLabel: string; // "London"
  offset: string; // "+00:00"
  offsetName: string; // "Greenwich Mean Time"
  iso: string; // ISO in the display zone
}

/** Render a stored UTC instant in any IANA zone. Never shifts the instant. */
export function displayDeadline(
  deadlineUtc: string,
  zone: string,
): DeadlineDisplay {
  const dt = DateTime.fromISO(deadlineUtc, { zone: "utc" }).setZone(zone);
  const safe = dt.isValid ? dt : DateTime.fromISO(deadlineUtc, { zone: "utc" });
  const date = safe.toFormat("d LLL yyyy");
  const time = safe.toFormat("h:mm a");

  return {
    date,
    time,
    dateTime: `${date} · ${time}`,
    zone: safe.zoneName ?? zone,
    zoneLabel: safe.toFormat("ZZZZZ"),
    offset: safe.toFormat("ZZ"),
    offsetName: safe.toFormat("ZZZZ"),
    iso: safe.toISO() ?? deadlineUtc,
  };
}

export function localTimeNow(zone: string): string {
  return DateTime.now().setZone(zone).toFormat("h:mm a");
}

export function localDateNow(zone: string): string {
  return DateTime.now().setZone(zone).toISODate() ?? "";
}

export type DueBucket = "overdue" | "today" | "soon" | "later";

export interface DueInfo {
  bucket: DueBucket;
  label: string;
  days: number;
}

/**
 * Compare calendar dates *inside the display zone*. Using millisecond diffs
 * against the device timezone is what caused the original off-by-one bug.
 */
export function dueInfo(
  deadlineUtc: string,
  zone: string,
  now: DateTime = DateTime.now(),
): DueInfo {
  const due = DateTime.fromISO(deadlineUtc, { zone: "utc" })
    .setZone(zone)
    .startOf("day");
  const today = now.setZone(zone).startOf("day");
  const days = Math.round(due.diff(today, "days").days);

  if (days < 0) {
    return {
      bucket: "overdue",
      days,
      label: days === -1 ? "Overdue by 1 day" : `Overdue by ${Math.abs(days)} days`,
    };
  }
  if (days === 0) return { bucket: "today", days, label: "Due today" };
  if (days === 1) return { bucket: "soon", days, label: "Due tomorrow" };
  if (days <= 3) return { bucket: "soon", days, label: `Due in ${days} days` };
  return { bucket: "later", days, label: `In ${days} days` };
}

export function formatReceived(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).toFormat("d LLL yyyy");
}

export function formatTimelineTime(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).toFormat("d LLL yyyy, h:mm a");
}

export function todayIso(zone = "Asia/Kolkata"): string {
  return DateTime.now().setZone(zone).toISODate() ?? "2026-11-22";
}

/** Stable "now" for the seeded demo so dashboard counts are reproducible. */
export function demoNow(referenceNow: string): DateTime {
  const dt = DateTime.fromISO(referenceNow, { zone: "utc" });
  return dt.isValid ? dt : DateTime.utc();
}
