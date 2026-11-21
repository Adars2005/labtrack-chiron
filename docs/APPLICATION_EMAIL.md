# Application email — send with all links

**To:** tlpeter [at] chironlabs [dot] co
**Subject:** FDE – Your Name – Friday demo

Hi Peter,

I've attached my take-home for the Forward Deployed Engineer role. I built LabTrack as a small, demo-ready product rather than a set of CRUD screens: the due-date bug is fixed at the data-model level, the notification flow is real and inspectable, and the dashboard is shaped around what a lab needs to act on.

**Deliverables**

1. Tickets, acceptance criteria and client questions: https://github.com/Adars2005/labtrack-chiron/blob/main/TICKETS.md
2. Live application: https://labtrack-chiron.vercel.app
3. Public GitHub repository (README with setup and screenshots): https://github.com/Adars2005/labtrack-chiron
4. Client update email for Maria: https://github.com/Adars2005/labtrack-chiron/blob/main/docs/CLIENT_UPDATE.md
5. Loom walkthrough (2m 40s): `TODO — add Loom URL`

LinkedIn: `TODO — your profile URL`

**A few questions**

**Tell me about something you shipped end to end and a trade-off you made.**
`TODO — replace with a real example, 4–5 sentences. Structure: problem → what you owned → launch/outcome (include a number) → one concrete trade-off and why.`
Example shape: *"I owned the migration of our client reporting tool from a nightly CSV to a live dashboard. I scoped it, built the pipeline and UI, and released it to 40 accounts; support tickets about stale numbers dropped by about 60% in the first month. The trade-off was shipping with a 15-minute cache instead of true real-time — the founders needed trustworthy numbers on Monday morning more than they needed second-by-second freshness, and we could add streaming later without changing the interface."*

**A client asks for something vague. What do you do first?**
I write down what I think they asked for, then ask two or three questions that change the build, each with a default assumption so I don't have to stop. Then I ship the smallest reversible slice and show it early. "Make the dashboard better" became an action queue plus a question about what "cluttered" means — not a two-week redesign. Ambiguity is a ticket to be refined, not a reason to wait.

**Why this role, and why now?**
I want to own outcomes, not tickets. The FDE role puts me in the room with the founder while I'm still writing the code, so I can turn a vague complaint into a shipped change in the same week. That's how I work best: understand the business problem, make the small call, show it, and adjust. Having spent this take-home on timezone semantics and a client-facing notification flow, I'm more convinced that's the job I want.

**When can you start, and what are your salary expectations?**
`TODO — exact date / notice period, and one clear number or tight range with currency and period, e.g. "Available from 7 December 2026. I'm looking for ₹X–Y per month / $X–Y per year, flexible depending on scope."`

**AI tools used**
I used OpenCode with the Big Pickle agent to scaffold and implement the app, draft the tests and documents, and review the build. I supplied the product brief and made all scope and data-model decisions myself; every generated change was reviewed, type-checked, tested and clicked through in a browser. No other AI coding tools were used. Full disclosure is also in the README.

Thanks,
[Your name]
