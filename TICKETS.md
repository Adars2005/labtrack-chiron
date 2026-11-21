# LabTrack — Client Request Breakdown

**From:** Maria, Lab owner · **To:** Forward Deployed Engineer · **Context:** Friday demo with a large clinic group

This document turns Maria's email into buildable tickets, records the acceptance criteria, and lists the questions I would ask before building. Assumptions are stated explicitly so work can proceed while awaiting answers.

---

## Ticket 1 — Correct case due dates across timezones

**Priority:** P0 — Critical
**Problem:** Clinics outside the lab's country see due dates one day off. A deadline is being interpreted using the wrong clock (device, server or UTC) instead of the clinic's clock.

### Acceptance criteria

- [x] Each clinic has a valid IANA timezone (e.g. `Europe/London`, `Asia/Dubai`) and it is the authoritative clock for that clinic's cases.
- [x] A case deadline is captured as **clinic-local date + time** and converted into a single timezone-aware **UTC instant** for storage. No implicit `new Date()` parsing or `toISOString().slice()` shortcuts.
- [x] Deadlines render correctly in the clinic's local timezone, with the timezone and UTC offset visibly labelled.
- [x] A global toggle renders the same stored instant in the lab's timezone as well (clinic local ↔ lab local).
- [x] Changing the viewer's device or server timezone never changes the stored deadline or the clinic-local display.
- [x] Date-only values are never shifted by UTC conversion: the local date entered is preserved in the clinic view.
- [x] Daylight-saving transitions are handled by the timezone library (`date-fns-tz` / Luxon), not by manual hour arithmetic.
- [x] Automated regression tests cover London winter vs summer, New York, Dubai/Kolkata half-hour offsets, invalid zones and calendar-day comparisons.
- [x] "Overdue / due today" comparisons are made between calendar dates **inside the display zone**, not millisecond deltas against the device clock.

### Implementation note

`lib/timezone.ts` is the single source of truth: `deadlineToUtc(date, time, zone)` converts input to a UTC instant; `displayDeadline(utc, zone)` renders it anywhere; `dueInfo(utc, zone, now)` classifies urgency by local calendar day. The case form shows both clinic and lab previews before a case is created.

### Out of scope

Changing the meaning of "due date" (deadline vs dispatch vs receipt) until Maria confirms it.

---

## Ticket 2 — Notify clinics when cases are ready

**Priority:** P1 — High
**Problem:** Clinics have no signal that a case is ready for delivery.

### Acceptance criteria

- [x] Lab staff can trigger notification from the case detail page with a single **Mark as ready** action.
- [x] The action changes status to **Ready** and sends an email to the clinic's configured recipient.
- [x] The email contains the case reference, treatment type, clinic name, patient reference, ready status and the deadline rendered in the clinic's timezone.
- [x] Test mode works without any live credentials: messages are captured in an in-app outbox with a full email preview.
- [x] Duplicate notifications are prevented at the data level — one `CASE_READY` notification per case, even on double-click or retry.
- [x] Notification status is visible to lab staff (`Sending` → `Sent (Simulation)` / `Failed`).
- [x] A "simulate delivery failure" switch and retry action make the failure path demoable and verifiable.
- [ ] Live provider (Resend) adapter is scaffolded via env vars but deliberately not enabled before Maria approves the copy and recipients.

### Implementation note

Notification writes are treated as an outbox: the status change and the notification record are created together, and delivery settles asynchronously. The email body is pure copy in `lib/seed.ts` (`buildReadyEmail`) with the deadline injected from `displayDeadline()`.

### Out of scope

WhatsApp/SMS (needs provider, verified number and clinic opt-in), multiple recipients, delivery webhooks, templating/branding.

---

## Ticket 3 — Simplify the case management dashboard

**Priority:** P1 — High
**Problem:** "The dashboard feels cluttered" ahead of a demo with a big clinic group.

### Acceptance criteria

- [x] Four key metrics visible at a glance: active cases, due today, overdue, ready for delivery.
- [x] A "Needs attention" queue replaces a flat table dump on the overview, plus upcoming deadlines and recent activity.
- [x] The cases table is clean and scannable: case, clinic, treatment, due date (with timezone), status and urgency badge.
- [x] Search works across case reference, clinic, treatment and patient reference.
- [x] Filters work by status and clinic; quick filters cover overdue, due today and ready.
- [x] Overdue (red), due soon (amber) and ready (green) are easy to identify; red is reserved for overdue.
- [x] Layout works on desktop and smaller screens (responsive sidebar → top navigation, horizontally scrollable table).
- [x] Primary actions (New case, Mark as ready) are easy to find; no dead buttons; empty states are handled.
- [x] No data is lost — details live in the case detail view with an activity timeline.

### Out of scope

Full design-system redesign, charts, customisable columns, saved views.

---

## Questions for Maria

1. When you say a due date is a day off, is the issue the clinic's calendar date, the delivery time, or both?
2. Should the due date represent when the case leaves the lab, when the clinic receives it, or when it must be completed?
3. What timezone should we use for clinics? Do clinics have individual timezones?
4. Who should receive ready notifications: the dentist, clinic reception, or multiple contacts?
5. What information should the email contain?
6. Should notification happen automatically when a case becomes Ready, or should staff confirm first?
7. What should happen if the email fails?
8. Which dashboard information do you use most often, and what can be removed?
9. Is there an existing system or workflow that we must preserve?
10. What is essential for Friday's demo versus what can follow later?

---

## Assumptions for the first demo

- The case due date is a deadline in the **clinic's local timezone**.
- Each clinic has one configured notification email.
- Notifications are email-first; WhatsApp is a later integration.
- Demo data is synthetic — patient references are de-identified (`PAT-####`).
- Email notifications run in simulation mode because no live credentials are configured.
- The lab operates in `Asia/Kolkata` for the lab-local view; this is configurable in the UI.
- Demo urgency counts are anchored to a fixed reference instant (`2026-11-22T06:00Z`) so the demo is reproducible regardless of when it is opened.
- Persistence uses browser-local storage for the demo; swapping in Supabase/Postgres is a repository-layer change, not a UI rewrite.
