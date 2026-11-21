# Loom script — target 2m 40s (hard stop 3m 00s)

**Before recording:** open the overview, a non-ready case (LT-1042), the cases table and the notification outbox in four tabs. Reset demo data. Confirm test mode is on. Turn off notifications. Rehearse once; record once; re-record only if it runs over.

---

### 0:00–0:18 — Hook

"The three asks were a wrong due date, no clinic notification, and a cluttered dashboard. Here's the demo. This is LabTrack, and I'll spend most of the time on the date bug because that's the one that actually breaks trust."

*Show the overview for a moment: four metrics and the needs-attention queue.*

---

### 0:18–1:05 — The timezone fix

"Maria said dates were a day off, mostly abroad. The root cause isn't arithmetic — it's treating a deadline as a generic timestamp. So each clinic now carries its own IANA timezone. Staff enter a local date and time; we interpret it in that clinic's zone and store one UTC instant. Nothing about your device or our server can shift it."

*Open LT-1042. Point at the two panels.*

"Here's the same deadline: 22 November, 9 AM in London — and 2:30 PM in our lab in Kolkata. Same instant, two correct local views, with the offsets shown. The form previews both before you even create the case. And here's the stored instant, 09:00Z. I've also got eight regression tests covering London in winter and summer, New York, half-hour offsets and calendar-day comparisons — `npm test` passes."

---

### 1:05–1:45 — Ready notification

"Second ask: tell the clinic when a case is ready. I'll click Mark as ready on this case."

*Click. Wait for the toast and email modal.*

"Status is now Ready, the timeline recorded it, and the email was sent automatically — no separate send button. It went through a server API. We're in test mode, so it was captured rather than delivered to a real inbox; flipping `NOTIFY_MODE=live` with a Resend key switches on real delivery. You can see the exact message: case reference, treatment, clinic, and the due date in the clinic's timezone. One record per case, so double-clicking can't spam the clinic. The log shows delivery status, and I can simulate a failure and retry it — because 'did it send?' is a question the lab will ask on day one."

---

### 1:45–2:05 — Dashboard

"Third ask: clutter. Instead of a table dump, the overview opens on what needs attention — overdue first, then due today, then ready. The cases table has search, status and clinic filters, and urgency badges. Details are one click away, so nothing was removed."

---

### 2:05–2:35 — One decision I'd make differently

"One decision I'd change: I scoped 'make the dashboard better' myself. I asked Maria questions, but I also went ahead and designed an action queue based on my own guess about what the lab owner looks at first. With a founder available, I should have shown her two rough options on a call before building — especially because the technician's workflow may matter more than the owner's. I'd have shipped a smaller first change and learned more. The code is easy to change; the wasted assumption isn't."

---

### 2:35–2:50 — Close

"That's the demo: correct deadlines, a real notification flow, and a calmer dashboard. Live URL, repo and the written breakdown are in my email. Test mode stays on until Maria approves the copy and recipients. Thanks for watching."

---

## Decision to say out loud

Use the dashboard-scoping decision above — it's honest, client-facing, and shows you understood the FDE role. If asked in the Q&A, the second choice would be: "I built a browser-persisted demo store instead of wiring Supabase; it kept the demo fully functional but means state is per-browser, so the first production task is the repository swap."
