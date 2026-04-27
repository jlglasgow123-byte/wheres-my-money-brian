# Project Log — Money: Where Did It Go?

This is a learning journal. It tracks what we tried to build, what went wrong, why,
and what to do differently on the next project.

**Context:** First software project built end-to-end. Background in IT and support —
not a developer. No prior experience with VS Code, Claude Code, GitHub, Vercel,
Supabase, or application design. Motivated by the belief that AI now unlocks the
ability to build software for people who can't code. This project is a smaller-scope
learning run before a larger, more complex idea. The discipline here is learning to
design and specify software precisely — the AI does the technical heavy lifting,
but only as well as the instructions it's given.

---

## Session: Transaction Review Page — Confidence Tooltips, Bulk Categorisation, Debug Cleanup

**Date:** 2026-04-02

### What we were building

Three things: (1) A tooltip on each transaction's confidence badge showing *why* the
AI categorised it that way — which rule matched, what pattern it used. (2) Multi-select
with bulk categorisation — check multiple transactions, assign them all a category at
once. (3) Removal of a debug inspector panel that was only there during development.

### What went wrong

**Issue: Layered data types created an architecture conflict.**
When wiring the confidence tooltip, the transaction object needed to know which rule
matched it. The `Transaction` type and the `MappingRule` type lived in different parts
of the codebase, and making one directly reference the other would create a dependency
going the wrong direction in the architecture.
The model caught the constraint and resolved it by defining a separate `MatchedRuleInfo`
interface containing only the fields needed for display — which kept the layers clean.
But the architectural constraint was never explained in the brief. The model got lucky
(or made a good judgment call).
**Next time:** When briefing a feature that connects two data layers, describe how those
layers are meant to relate. Don't assume the model will always catch architectural
constraints — give them explicitly. "Layer A should not depend on Layer B" is the kind
of design rule that belongs in the brief.

### What worked well

- The three-state "select all" checkbox (unchecked / indeterminate / checked) worked
  correctly on the first pass. Detailed upfront design of interaction states translated
  directly into a useable implementation.
- The bulk action bar design (fixed to the bottom of the screen, count + category picker
  + apply + clear) was solid immediately. Thinking through the UI in terms of specific
  states and actions before asking for code is worth the upfront time.

### Open questions

- After bulk-applying a category, the selection clears. Is this always the right
  behaviour, or should the user decide? Not resolved.
- How does the fixed bulk bar behave on a small screen? Not tested.

---

## Bug Fix: Custom Categories Missing from Review Page Dropdowns

**Date:** 2026-04-13

### What we were building

This wasn't planned — it was a bug discovered after the fact. Custom categories created
on the Rules page were not appearing as options in the category dropdowns on the Review
(transaction) page.

### What went wrong

**Issue: One page was using the right pattern; another was still using the old one.**
The Rules page was built using hooks that merge default and user-created categories
(`useAllCategories`, `useGetSubcategories`). When the Review page was built, it
imported a hardcoded list of defaults directly. The correct pattern was never applied
to the second page. When custom category support was added, only the page being actively
worked on was updated — the impact on other pages wasn't checked.
**Next time:** Whenever a new capability is added (e.g. custom categories), explicitly
ask: "which other pages or components use this data, and do they all read it the same
way?" Build a habit of impact-checking across the whole feature, not just the page
being actively worked on. A simple question — "where else does this appear in the app?"
— would have caught this before it became a bug.

### What worked well

- The fix was trivial because the correct hooks already existed. Good abstractions
  make bugs cheaper to fix. Having a pattern that works — and reusing it — is better
  than solving the same problem twice in different ways.

---

## Session: Demo Mode, Landing Page, Dashboard → Insights, Routing Fix

**Date:** 2026-04-27

### What we were building

Four things this session:
1. **Demo mode** — let visitors try the app with realistic seed data before signing
   up, no writes to the database.
2. **Landing page redesign** — a higher-quality marketing page with demo as the
   primary call to action.
3. **Dashboard renamed to Insights** — plus several UX improvements: a next-best-action
   banner, a "data may be incomplete" note on in-progress months, KPI label cleanup,
   accordion open by default.
4. **Routing fix** — make `/` redirect to the landing page for logged-out users
   instead of showing nothing.

### What went wrong

**Issue 1: Blank page at the root URL for logged-out users.**
When a logged-out user visited the site at `/`, they saw a blank white page briefly
before being redirected.
Root cause: The upload page at `/` relied on a client-side redirect inside `DataLoader`.
Client-side redirects require JavaScript to load first — so there's a brief window where
the page renders with nothing. For logged-out users, this blank flash was the whole
experience.
Fix: Replaced `app/page.tsx` with a server-side `redirect('/landing')`. This happens
before the page renders at all — no blank flash, no JavaScript needed.
**Next time:** Routes that should never be accessible in a certain state (logged-out,
no data loaded, etc.) should use server-side redirects — not client-side logic. If a
page should redirect before it renders, the redirect belongs in a server component.
This distinction between server-side and client-side is a Next.js fundamental worth
locking in early.

**Issue 2: The production site went down twice during the session.**
The site at `wheresmymoneybrian.store` showed a browser-level error ("This page
couldn't load") on two occasions. Root cause was never definitively identified —
likely a Vercel build failure or a deployment that hadn't finished propagating.
Fix: Pushed a new commit to trigger a fresh Vercel build. Site came back.
**Next time:** When the site goes down on Vercel, check the Vercel dashboard
(deployments tab) before assuming the code is broken. If the latest deployment shows
an error or is stuck, triggering a new deploy resolves it. This is a production
platform with its own failure modes — separate from code issues. Checking deployment
status should be the first step, not the last.

**Issue 3: Environment variable file committed to git.**
`env.local` (without a leading dot) was being tracked in git from a previous session
on a different machine. `.env.local` is in `.gitignore`; `env.local` is not. A typo
in the filename bypassed the safety net entirely.
Fix: Renamed to `.env.local`, removed from git tracking with `git rm --cached env.local`.
Vercel environment variables are configured separately in the Vercel dashboard, not
in committed files.
**Next time:** This is the most serious issue of the project so far. Environment
variables contain database credentials and API keys. If these get pushed to a public
repository, they need to be rotated immediately — assume they're compromised. Habits
to build from the start of any new project:
- Verify `.gitignore` includes `.env*` before the first commit.
- When working across machines, use the hosting platform's environment variable
  settings — not files on disk.
- Never commit a file containing a password, key, or connection string.

**Issue 5: Demo mode had an entry path but no exit path.**
A visitor could click "Try demo" and enter demo mode, but there was no way to leave it
without signing up or closing the browser tab. The DemoBanner had "Reset demo" (reloads
the page — stays in demo) and "Sign up free" — but nothing for "I'm done, take me back."
Root cause: The design only considered the happy path — visitor enters demo, is impressed,
signs up. The obvious alternative journey (visitor enters demo, looks around, decides not
to sign up yet) was never mapped. There was no "exit demo" action because nobody thought
to ask "how does a user leave this state?"
**Next time:** For any feature that puts a user into a special mode or state, define all
the ways they get out before writing any code. Entry and exit are a pair — designing one
without the other is always incomplete. Ask: "what does a user do if they want to go back
to where they were?"

**Issue 4: A nav bar rollback was needed after a fragile change.**
When the Home nav link was removed and a Demo link was introduced for demo mode, the
change broke in production and required a rollback. The original Home-to-Demo conversion
logic had been bolted onto the existing nav structure rather than redesigned cleanly.
When Home was removed, that logic became dead code producing unexpected behaviour.
Root cause: As my instruction lacked specifics about what to remove alongside the Home
link, the model updated the nav addition but didn't clean up the conversion logic that
depended on it.
**Next time:** When removing a nav item that has conditional logic attached to it, ask
explicitly: "is there any other code that references this by name or href that needs
to be cleaned up?" Partial removals leave time-bombs. Describe the *end state* you
want, not just the change — "remove Home, the Demo link should appear only in demo
mode as a standalone item at the start of the nav" is clearer than "replace Home with
Demo in demo mode."

### What worked well

- **Demo mode was clean by design.** Routing all reads through the existing store
  methods (with a branch on `isDemoMode`) meant the app UI needed no special-casing
  — it just works with seed data transparently. Thinking about the architecture before
  asking for code meant no rework.
- **Server redirects are simple and effective.** Once the pattern was understood — a
  server component that just calls `redirect()` — retired pages like `/dashboard` and
  `/home` became trivial to redirect. No duplicate UI to maintain.
- **Detailed copy briefs produce good output.** The landing page came together quickly
  because the brief was specific: section by section, tone guidance ("no corporate
  fintech language"), exact CTA wording. The investment in writing a clear brief paid
  for itself. Vague briefs produce generic output. Specific briefs produce something
  close to what you actually want.

### Open questions

- What actually caused the two Vercel outages? Understanding the deployment platform's
  failure modes is part of shipping software — not just writing code that works locally.
  Worth reading Vercel's documentation on build failures and deployment health.
- Should every push be verified in the Vercel dashboard before marking a task done?
  A checklist habit — push, check dashboard, confirm deployment succeeded — would catch
  build failures before they become "the site is down" moments.

---

## Cross-Project Reflection: Design Process

*These are lessons that don't belong to one session — they're patterns across the
whole project.*

### User workflows were never mapped before building

Pages and features were designed in isolation, one at a time, as the need arose. The
result was a structure that drifted into confusion: Home, Dashboard, Upload at `/`,
Insights — pages with overlapping purposes, inconsistent naming, and navigation that
didn't reflect how a real user actually moves through the app. Fixes (renaming,
redirects, routing restructures) cost more time than getting it right upfront would have.

The same gap showed up in demo mode: the entry path was designed, the exit path wasn't.
The feature was conceived as a funnel (try → be impressed → sign up) rather than as a
complete journey (try → explore → decide — and if the answer is "not yet," what then?).

**Root cause:** Building started before the user's journey through the app was written
down end-to-end. Each feature made sense in isolation but wasn't checked against the
full picture.

**Next time:** Before writing a single line of code for the next project, map out every
type of user and every path they take through the app:
- Who are they? (logged out, logged in, in demo, new user, returning user)
- Where do they start?
- What do they need to do? In what order?
- What does "done" look like — and how do they get there?
- What do they do if they want to leave, go back, or change their mind?

Write this as a simple flowchart or a numbered list of steps — it doesn't need to be
formal. The test is: can you trace every user type from arrival to goal without hitting
a dead end or a page that does something another page already does?

Building from a workflow map also makes briefing the AI much more specific. "Build the
page a logged-out visitor sees after clicking Try Demo, including the exit path back to
the landing page" is a complete brief. "Build demo mode" is not.
