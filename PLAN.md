# LabTrack — Execution plan & status

> This plan was updated to match the build brief supplied with the UI mock references. It supersedes the earlier draft, which treated due dates as date-only calendar values. The final requirement is a **timezone-aware instant** derived from a clinic-local date and time; this plan reflects that.

## Priorities

| Priority | Item | Status |
|---|---|---|
| P0 | Timezone bug solved properly (clinic-local input → UTC instant → correct display anywhere) | ✅ Done |
| P0 | Premium, clean dashboard with metrics, filters and believable demo data | ✅ Done |
| P0 | Functional ready notification with email preview + delivery log | ✅ Done (test mode) |
| P1 | Case detail with deadline proof, activity timeline, clinic info | ✅ Done |
| P1 | Demo quality: no broken buttons, responsive, no empty-state dead ends | ✅ Done |
| P1 | Written deliverables: tickets, client email, application email, Loom script | ✅ Drafted (links/TODOs to fill) |
| P0 | Deploy to Vercel + public GitHub repo | ⏳ Needs account access / credentials |

## Build order used

1. Scaffold Next.js 15 + TypeScript + Tailwind + Lucide + Luxon.
2. Define domain model (`Clinic`, `LabCase`, `Notification`) and isolated demo store.
3. Implement `lib/timezone.ts` as the single source of truth for conversion, display and urgency.
4. Add timezone regression tests (`npm test`, 8 passing).
5. Build app shell (sidebar, header, global clinic/lab toggle, New case dialog).
6. Build overview, cases table, case detail, clinics and notification outbox.
7. Seed 56 synthetic cases across 8 international clinics, anchored to a fixed demo instant.
8. Add notification simulation, idempotency, failure toggle and retry.
9. Verify production build, browser-test all flows, capture screenshots.
10. Write README, tickets and the three written deliverables.

## Key decisions

- **Timezone model:** clinic IANA zone is authoritative. Store one UTC instant; display in any zone with labelled offsets. No manual day shifts; Luxon handles DST.
- **Urgency:** compare calendar dates inside the display zone, using a fixed demo reference instant so counts are reproducible.
- **Persistence:** browser `localStorage` demo store (explicitly allowed by the brief), isolated in `lib/store.tsx` so a Supabase swap is a repository change. Vercel's filesystem is ephemeral, so a JSON file would not work.
- **Email:** test-mode outbox by default; live Resend adapter deferred until Maria approves recipients and copy.
- **Scope control:** WhatsApp, auth, full redesign and live sending deferred with reasons written to the client email.

## Verification performed

- `npm run build` — passes.
- `npm test` — 8/8 timezone tests pass.
- Browser walkthrough: overview → cases → case detail → Mark as ready → email preview → outbox → clinics, with no console errors.
- Screenshots captured into `docs/screenshots/`.

## Remaining handoff steps

1. Replace `TODO` placeholders in `README.md`, `docs/CLIENT_UPDATE.md` and `docs/APPLICATION_EMAIL.md`.
2. Create the public GitHub repo and push; add the URL to the documents.
3. Deploy to Vercel (no env vars needed for demo mode); add the live URL.
4. Record the ≤3 minute Loom using `docs/LOOM_SCRIPT.md`.
5. Send the application email to `tlpeter [at] chironlabs [dot] co` with exact subject **FDE – Your Name – Friday demo** and all links.
