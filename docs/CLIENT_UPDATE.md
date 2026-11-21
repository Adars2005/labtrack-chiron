# Client update email — to Maria

**Subject:** LabTrack update for Friday's demo

Hi Maria,

Quick update before Friday. I've built a working LabTrack demo and focused it on the three things you raised.

**What I shipped**

- **Due dates are fixed properly.** Each clinic now has its own timezone, and a deadline entered as, say, 25 Nov at 5:00 PM is interpreted in that clinic's local time and stored as one unambiguous instant. The app shows it correctly in clinic time and in our lab time, side by side, with the timezone labelled. It handles daylight-saving changes and doesn't depend on anyone's computer clock. I've added automated tests for the cases that used to break.
- **Clinics can be notified when a case is ready.** From a case, one click marks it ready and captures an email to the clinic's contact with the case reference, treatment and correctly formatted due date. We're running in **test mode**: nothing actually leaves the app, and every message appears in a notification log where you can preview the exact wording. One email per case, even if someone clicks twice.
- **The dashboard is simpler.** It now opens on an action queue — overdue, due today, ready — with the four numbers you care about at the top. The cases table has search, status and clinic filters, and clear badges. Full details are one click away, so nothing was removed.
- **Demo-ready:** 56 synthetic cases across eight international clinics, no real patient data, and no broken buttons.

**Live demo:** https://labtrack-chiron.vercel.app
**Code:** https://github.com/Adars2005/labtrack-chiron
**2-minute walkthrough:** `TODO — add Loom URL`

**What I did not ship, and why**

- **WhatsApp.** It needs a business account, a verified number and clinic opt-in/consent. Email was the right first step and I've written WhatsApp up as the next ticket.
- **Real email sending.** I deliberately left test mode on so we can approve the wording, recipients and failure handling before anything reaches a clinic.
- **A bigger dashboard redesign.** "Cluttered" can mean too much information, the wrong information first, or just density. I made a small, reversible change rather than guessing. Happy to take it further once I know what you meant.
- **Accounts and permissions.** These need a decision about who uses the lab app and what they can change.

**What I need from you**

1. Is a due date a calendar day ("25 Nov"), or a deadline in time ("5pm Friday, clinic time")? I assumed the latter, with 5:00 PM as the common example.
2. Which timezone is authoritative when the lab and clinic disagree? I assumed the clinic's.
3. Which inbox should receive the ready email — reception, the dentist, or both? Should the lab be copied?
4. Can you approve the email wording in the outbox? Once you do, we can switch live sending on.
5. For Friday: which clinic group is attending, and would you like their name in the demo data?
6. What should happen if an email fails — retry automatically, or alert the lab?

Thanks,
[Your name]
