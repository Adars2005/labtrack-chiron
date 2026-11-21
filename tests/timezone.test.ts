import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
  deadlineToUtc,
  displayDeadline,
  dueInfo,
  isValidTimezone,
} from "../lib/timezone";

describe("deadlineToUtc", () => {
  it("interprets a clinic-local wall time in the clinic's IANA zone", () => {
    // London is on GMT in November: 17:00 local === 17:00 UTC.
    expect(deadlineToUtc("2026-11-25", "17:00", "Europe/London")).toBe(
      "2026-11-25T17:00:00Z",
    );
  });

  it("handles daylight saving correctly", () => {
    // London is on BST (UTC+1) in July: 17:00 local === 16:00 UTC.
    expect(deadlineToUtc("2026-07-25", "17:00", "Europe/London")).toBe(
      "2026-07-25T16:00:00Z",
    );
  });

  it("handles a US clinic and a half-hour offset zone", () => {
    expect(deadlineToUtc("2026-11-25", "17:00", "America/New_York")).toBe(
      "2026-11-25T22:00:00Z",
    );
    expect(deadlineToUtc("2026-11-25", "17:00", "Asia/Kolkata")).toBe(
      "2026-11-25T11:30:00Z",
    );
  });

  it("rejects invalid zones and malformed dates instead of silently shifting", () => {
    expect(deadlineToUtc("2026-11-25", "17:00", "Not/AZone")).toBeNull();
    expect(deadlineToUtc("25-11-2026", "17:00", "Europe/London")).toBeNull();
    expect(isValidTimezone("Europe/London")).toBe(true);
  });
});

describe("displayDeadline", () => {
  it("shows the same instant in clinic time and lab time", () => {
    const instant = deadlineToUtc("2026-11-25", "17:00", "Europe/London")!;
    const london = displayDeadline(instant, "Europe/London");
    const india = displayDeadline(instant, "Asia/Kolkata");

    expect(london.dateTime).toBe("25 Nov 2026 · 5:00 PM");
    expect(london.zone).toBe("Europe/London");
    expect(london.offset).toBe("+00:00");

    expect(india.dateTime).toBe("25 Nov 2026 · 10:30 PM");
    expect(india.zone).toBe("Asia/Kolkata");
    expect(india.offset).toBe("+05:30");
  });

  it("does not shift a date-only value through UTC when rendering", () => {
    const instant = deadlineToUtc("2026-11-25", "17:00", "Europe/London")!;
    expect(displayDeadline(instant, "Europe/London").date).toBe("25 Nov 2026");
  });
});

describe("dueInfo", () => {
  const now = DateTime.fromISO("2026-11-22T09:00:00Z", { zone: "utc" });

  it("counts calendar days inside the display zone, not milliseconds", () => {
    const instant = "2026-11-25T20:00:00Z";
    // 20:00Z is 25 Nov in London but 01:30 on 26 Nov in Kolkata.
    expect(dueInfo(instant, "Europe/London", now).days).toBe(3);
    expect(dueInfo(instant, "Asia/Kolkata", now).days).toBe(4);
    expect(dueInfo(instant, "Europe/London", now).bucket).toBe("soon");
  });

  it("identifies overdue and due-today cases", () => {
    const overdue = deadlineToUtc("2026-11-20", "17:00", "Europe/London")!;
    const today = deadlineToUtc("2026-11-22", "23:00", "Europe/London")!;
    expect(dueInfo(overdue, "Europe/London", now).bucket).toBe("overdue");
    expect(dueInfo(today, "Europe/London", now).bucket).toBe("today");
  });
});
