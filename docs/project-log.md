# Project Log

---

## Session: Demo Mode, Landing Page Redesign, Insights Rename, Routing Restructure

**Date:** 2026-04-27

---

### 1. Demo Mode

**Goal:** Let visitors explore the app with realistic seed data before signing up. No Supabase writes in demo mode.

**Changes:**
- `lib/store/auth.ts` — added `isDemoMode: boolean`, `enterDemoMode()`, `exitDemoMode()`. `enterDemoMode()` writes `'brian:demo'` to `sessionStorage` so demo mode survives page refreshes. `initAuth()` checks sessionStorage first and skips the Supabase call entirely if the flag is set.
- `lib/demo/seed.ts` — 170 realistic Australian transactions across Oct 2025–Mar 2026. March 2026 enriched with extra Uber rides, Uber Eats, Coffee Club, Disney Plus, McDonalds, KFC, Amazon to make demo insights compelling. Array sorted descending by date.
- `lib/store/history.ts` — `loadTransactions` returns `DEMO_TRANSACTIONS` in demo mode. `updateTransaction` and `bulkUpdateCategory` update Zustand state but skip Supabase. `addTransactions` and `deleteTransaction` are no-ops in demo mode.
- `lib/store/rules.ts` — `loadRules` returns `DEFAULT_RULES` in demo mode. Mutations update state only.
- `lib/store/userCategories.ts` — all loads return empty in demo mode. Mutations update state only.
- `components/DataLoader.tsx` — in demo mode, skips auth redirect and loads all stores (which branch to seed data).
- `components/DemoButton.tsx` — client component; navigates to `/demo` and calls `enterDemoMode()`. Accepts `label` and `variant` props.
- `app/demo/page.tsx` — new page. Computes insights from seed data: headline total → biggest category → money leaks (Uber by keyword, dining, groceries) → subscriptions (auto-detected by keyword list) → breakdown bars → pie chart → sign-up CTA.
- `components/Nav.tsx` — added `DemoBanner` (amber bar with Reset demo button + Sign up link). In demo mode, shows a dedicated "Demo" nav link pointing to `/demo`.
- `app/upload/page.tsx` — shows a blocked message with sign-up CTA in demo mode.

**Issues:**
- `lib/store/auth.ts` needed `'use client'` because `enterDemoMode` calls `sessionStorage` directly in the store definition scope. Stores that import from it (`history.ts`, `rules.ts`, `userCategories.ts`) don't have `'use client'` themselves — this is fine because they are only ever imported from client components.

---

### 2. Landing Page Redesign

**Goal:** High-converting marketing page. Demo mode as the primary CTA. Clear value proposition. No corporate fintech language.

**Changes to `app/landing/page.tsx`:**
- Hero: headline "You're leaking money. Brian shows you where." + benefit bullets + "No budgeting guilt. No spreadsheets. Just the uncomfortable truth." trust line under CTAs.
- Demo snapshot section: improved copy + "This is demo data. Yours might be more interesting. Or worse." line beneath card.
- How it works: reordered to lead with "Try the demo first" as step 1.
- New "What you get" section: 4 benefit cards (Spending leaks, Subscriptions, Category breakdowns, Month-to-month changes).
- Privacy section: rewritten as 2×2 grid of honest, non-overclaiming points.
- Final CTA section at bottom with demo-first framing.
- FAQ renamed to Help throughout (header + footer).
- CTA wording consistent across page: "Try demo — no upload" / "Upload my CSV".

---

### 3. Dashboard → Insights Rename + UX Changes

**Goal:** Rename "Dashboard" to "Insights", remove the old Home page from nav, and add several UX improvements to the Insights page.

**Route changes:**
- `app/insights/page.tsx` — new file; full Insights page (formerly Dashboard).
- `app/dashboard/page.tsx` — server component redirect to `/insights`.
- `app/home/page.tsx` — server component redirect to `/insights`.
- Auth callbacks updated: `app/auth/callback/route.ts`, `app/login/page.tsx`, `app/signup/page.tsx` all redirect to `/insights` after auth.

**Nav changes (`components/Nav.tsx`):**
- Removed `{ href: '/home', label: 'Home' }` from links array.
- Changed `{ href: '/dashboard', label: 'Dashboard' }` to `{ href: '/insights', label: 'Insights' }`.
- Removed dead Home→Demo conversion logic. Demo link now rendered as a standalone conditional item at the start of the nav (only shown in demo mode).

**Insights page improvements:**
- h1: "Dashboard" → "Insights".
- KPI card label: "Net" → "Saved this period".
- Largest transactions accordion: `useState(true)` — open by default.
- Next Best Action banner (between KPI cards and charts): three states driven by data:
  - Amber — uncategorised transaction count > 0: "You have X transactions with no category — they're not showing in your charts." → Categorise now → `/history`
  - Slate/blue-grey — most recent `importedAt` is 30+ days ago: "Your last upload was X weeks ago. Your charts only show what's been imported." → Upload latest transactions → `/upload`
  - Light green — all clean: "All transactions categorised. Your charts reflect your full history." → Add this month's data → `/upload`
  - Priority: uncategorised over stale.
- Month-over-month chart: detects if either selected month equals the current calendar month. If so, shows inline note: "[Month name] is in progress — data may be incomplete."

---

### 4. Routing Restructure

**Goal:** `/` should be the marketing/landing page. Upload page moved to `/upload`. Logo links to landing.

**Changes:**
- `app/page.tsx` — server component that calls `redirect('/landing')`. Fixes blank page for logged-out users hitting the domain root.
- `app/upload/page.tsx` — upload functionality moved here from `app/page.tsx`.
- `components/Nav.tsx` — Upload nav link changed from `href="/"` to `href="/upload"`. Logo `href` changed from `"/"` to `"/landing"`.
- `app/insights/page.tsx` — NBA banner upload links updated from `"/"` to `"/upload"`.
- `app/history/page.tsx` — "Upload transactions" button updated from `"/"` to `"/upload"`.

**Issues encountered:**
- Site at `wheresmymoneybrian.store` showed "This page couldn't load" (browser-level error) on two occasions during this session. Cause was not conclusively identified — likely Vercel build failure or deployment timing. Resolved by pushing a new commit to trigger redeployment.
- `env.local` (without leading dot) was tracked in git from an earlier session on a different machine. Fixed: renamed to `.env.local`, removed from git tracking with `git rm --cached env.local`. Vercel environment variables must be configured separately in the Vercel dashboard.

---

---

## Phase: Review Page — Confidence Tooltip, Multi-Select Bulk Assign, Debug Panel Removal

**Date:** 2026-04-02

### Tasks
- Added `MatchedRuleInfo` type and `matchedRule?` field to `Transaction`
- Populated `matchedRule` in categoriser for single-match and best-of-many paths
- Added hover tooltip to `ConfidenceBadge` showing rule type, match condition, pattern, category, subcategory
- Added `bulkUpdateItems` action to review store
- Added checkbox column to `DraftRow` with selection highlight
- Added select-all checkbox to table header with indeterminate state
- Added fixed bottom bulk action bar (count, category, subcategory, apply, clear)
- Removed `CategoryInspector` debug panel and its component file

### Issues
- `Transaction` type lives in the normaliser layer; `MappingRule` lives in the categoriser layer. Adding a direct type reference would create a downward dependency.

### Issue Resolutions
- Defined a separate `MatchedRuleInfo` interface in `normaliser/types.ts` containing only the fields needed for display. No cross-layer dependency introduced.

### Tests
- Select one row → bulk bar appears with correct count
- Select all via header checkbox → all visible rows checked
- Select some → header checkbox shows indeterminate state
- Change filter tab mid-selection → previously selected rows outside the filter remain selected, reappear if filter is changed back
- Apply bulk category → all selected rows update, bulk bar dismisses, selection clears
- Bulk apply with a category that has subcategories → subcategory dropdown appears
- Bulk apply Uncategorised → rows marked unaccepted
- Hover over High/Medium/Low badge on a categorised row → tooltip shows rule type, match, pattern, category, subcategory
- Hover over Uncat or Conflict badge → no tooltip, plain badge only
- Confirm import after bulk assign → correct categories saved

### Changes
None — no design flaws found that required rework during this phase.

### Improvements
- ~~Confirm upfront: does bulk assign need to include user-defined categories? `DraftRow` and the bulk bar both use `DEFAULT_CATEGORIES` only.~~ → Fixed 2026-04-13. See below.
- Confirm whether clearing selection after Apply is always the right behaviour.
- Confirm bulk bar placement preference (fixed bottom) on small screens.

---

## Bug Fix: Custom Categories Not Available in Transaction Review Dropdowns

**Date:** 2026-04-13

### Problem
Custom categories created on the Rules page were not appearing as options in the category or subcategory dropdowns on the Review (transactions) page. This affected both the per-row dropdowns in `DraftRow` and the bulk action bar.

### Root Cause

`DraftRow.tsx` and `review/page.tsx` both imported `DEFAULT_CATEGORIES` and `getSubcategories` directly from `lib/categories/defaults.ts`. This hardcoded list contains only the 15 built-in categories. The `useAllCategories()` and `useGetSubcategories()` hooks — which merge defaults with user-created categories and subcategories from Supabase — already existed and were correctly used on the Rules page, but were never wired into the review components.

### Fix

- `components/review/DraftRow.tsx` — replaced `DEFAULT_CATEGORIES` / `getSubcategories` imports with `useAllCategories` / `useGetSubcategories` hooks. Category dropdown now renders all categories including custom ones.
- `app/review/page.tsx` — same replacement. Bulk action category dropdown and subcategory lookup now include custom categories and their subcategories.

### Tests

- Create a custom category with subcategories on the Rules page
- Upload a statement and go to Review
- Confirm custom category appears in the per-row category dropdown
- Confirm custom subcategories appear when that category is selected
- Confirm custom category appears in the bulk action bar category dropdown
- Confirm bulk apply works correctly with a custom category
