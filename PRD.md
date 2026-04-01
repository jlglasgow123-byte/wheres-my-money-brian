# PRD — Money: Where Did It Go?

## Product Overview

A personal finance application that allows a user to upload bank transaction data
(CSV), categorise each transaction, and understand spending patterns with certainty.

**Primary goal:** Replace guessing with exact, user-verified categorisation.

---

## Non-Goals (MVP)

- No budgeting tools
- No AI auto-categorisation without user validation
- No mobile app (web first; iOS is a future goal)
- No bank integrations — CSV upload only
- No multi-user support in MVP (single user; architecture must support multi-user later)
- No regex matching rules
- No nested categories in early phases (introduced in Phase 9)

---

## Core Workflow

1. User uploads CSV
2. System parses and normalises transactions
3. System detects duplicates and prompts user to resolve
4. System attempts auto-categorisation using stored rules
5. System presents draft list — user reviews, corrects, confirms
6. Confirmed transactions are saved to history
7. System stores categorisation rules and applies them to future uploads
8. User can view transaction history, manage categories and rules
9. User views spending insights on the dashboard
10. User exports enriched CSV

---

## CSV Format (MVP — Single Bank Format)

**Bank:** ANZ (MVP only; architecture must support additional formats later)

**Columns:**
```
BSB Number | Account Number | Transaction Date | Narration | Cheque | Debit | Credit | Balance | Transaction Type
```

**Date format:** `DD/MM/YYYY` (e.g. `30/03/2026`)

**Amounts:**
- `Debit` = money out
- `Credit` = money in
- Separate columns; empty cell = null

**Currency:** Always AUD

**Unique ID:** None — deduplication by `date + narration + debit + credit`

---

## Transaction Model

Internal fields after normalisation:

| Field | Source | Notes |
|---|---|---|
| `date` | Transaction Date | Parsed to ISO format |
| `narration` | Narration | Raw string |
| `debit` | Debit | Number or null |
| `credit` | Credit | Number or null |
| `balance` | Balance | Number |
| `transactionType` | Transaction Type | Raw string |
| `bsb` | BSB Number | Raw string |
| `accountNumber` | Account Number | Raw string |
| `category` | Assigned | Defaults to Uncategorised |
| `subcategory` | Assigned | Optional |
| `confidence` | Derived | High / Medium / Low |
| `uploadSessionId` | System | FK to upload session |

---

## Duplicate Detection

Duplicates detected by: `date + narration + debit + credit`

On duplicate detected, user is shown the list of affected transactions and given three options:

- **Import All** — import duplicates regardless
- **Skip Duplicates** — skip all detected duplicates
- **Decide One by One** — modal per duplicate: Import or Skip

Note: Genuinely identical transactions (same merchant, same amount, same day) are
possible. The one-by-one option exists to handle this.

---

## Categorisation Rules

**Matching:** Case-sensitive, plain text, contains-based

**Confidence scoring:**

| Level | Condition |
|---|---|
| High | Match string appears as a whole word (space, punctuation, or boundary on both sides) |
| Medium | Match string is embedded inside a longer word (e.g. `Netflixhbo`) |
| Low | Partial word match (e.g. `flix` inside `Netflix`) |
| High (override) | User has previously mapped this exact description |

**Conflicts:** If two rules both match a description, flag for user review — do not
auto-resolve.

**No match:** Transaction flagged as Uncategorised.

---

## Draft List Review

- Shows current upload batch only
- Colour-coded confidence: Green (high), Orange (medium), Red (low)
- Category dropdown → subcategory dropdown (dependent; subcategory options update
  when category changes)
- Filter by confidence level
- Auto-accept option: accept all transactions at a selected confidence level
- Uncategorised prompt: "Would you like to review uncategorised transactions?"
  - Yes — show all uncategorised
  - Yes — show only new uncategorised
  - No — leave as-is
- On reclassification: modal — "Would you like to permanently change this mapping?"
  - Yes → update the mapping rule
  - No → change this transaction only
- Confirm + save: commits batch to persistent transaction history

---

## Category System

**Structure:** Nested (parent → subcategory)

**Assignment:** Users can assign parent only, or parent + subcategory.

**Management:** Categories and subcategories can be created, renamed, and deleted.

**On deletion:** Affected transactions move to Uncategorised.

**Permanent Uncategorised:** Users may leave transactions as Uncategorised
indefinitely.

**Default category list:**

| Parent | Subcategories |
|---|---|
| Housing | Rent, Mortgage, Utilities, Insurance, Repairs & Maintenance |
| Groceries | Supermarket, Fresh Produce, Specialty Food |
| Dining & Takeaway | Restaurants, Cafes, Fast Food, Delivery |
| Automotive | Fuel, Maintenance, Registration, Insurance, Tolls, Parking |
| Health | General Practitioner, Specialist Appointment, Pharmacy, Dental, Fitness, Vitamins, Private Health Insurance |
| Shopping | Clothing, Electronics, Homewares, Other Retail |
| Entertainment | Streaming, Events, Hobbies, Games, Concerts, Sporting Match |
| Personal Care | Haircut, Beauty, Gym |
| Education | Courses, Books, Subscriptions |
| Financial | Fees, Interest, Insurance, Super, Tax Advice, Legal Fees |
| Travel | Flights, Accommodation, Activities, Public Transport |
| Giving | Donations, Gifts |
| Pets | Pet Food, Vet, Insurance |
| Savings | *(no default subcategories — user may add)* |
| Income | Salary, Transfer In, Refunds, Centrelink, Child Support |
| Uncategorised | *(system-assigned default; cannot be deleted)* |

---

## Rule Management

- Rules stored as: `narration pattern → category (+ optional subcategory)`
- Auto-created or updated when user confirms a category in the draft list
- Users can create, view, edit, and delete rules directly
- A single narration pattern can only map to one category (different descriptions
  for the same merchant are separate rules)
- Rule changes prompt: "Would you like to permanently change this mapping?"

---

## Data Storage

**Database:** Supabase PostgreSQL

**Schema tables:**
- `bank_formats` — pluggable CSV parser registry
- `upload_sessions` — each CSV import event
- `transactions` — all imported transactions
- `categories` — parent categories
- `subcategories` — FK to categories
- `mapping_rules` — narration pattern → category + subcategory, FK to user

**Row Level Security:** Enforced on all tables. Users can only access their own data.

**Persistence:** Full — data survives across sessions and devices.

---

## Authentication

- Email + password
- Google OAuth
- 2FA (TOTP) — mandatory option, user-enabled
- Protected routes redirect unauthenticated users
- MVP is single user; architecture supports multi-user SaaS later

---

## Dashboard

**Chart types (user selects):**
- Spending by category / subcategory: pie or bar
- Spending over time: line or bar

**Filters:**
- Category
- Subcategory
- Date range

**Date range presets:**
- This month
- This financial year (1 July – 30 June, Australian)
- Since first import
- Custom from / to

**Time groupings:** Weekly, monthly, quarterly, annually

**Uncategorised toggle:** Show or hide Uncategorised transactions in charts

---

## Export

- Format: CSV
- Columns: all original columns + `Category` + `Subcategory`
- Uncategorised transactions included (`Uncategorised` in Category, empty Subcategory)
- One-click download

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Backend | Next.js API routes |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |

---

## Build Plan

Build order follows dependency and risk. Core pipeline is validated before
infrastructure is introduced. Each phase has a hard stop condition — if the test
fails, do not proceed.

---

### Phase 1 — CSV Upload + Raw Parsing

**Goal:** Accept a CSV file and return raw rows. Validate headers. Nothing else.

**Scope:**
- File upload input
- Validate headers match the known format exactly
- Return raw rows unparsed
- Clear error if headers are unrecognised or file is empty
- Pluggable parser interface — one implementation in MVP

**Test:**
- Upload valid CSV → row count matches expected
- Upload CSV with wrong headers → clear error shown
- Upload empty CSV → handled gracefully

**Pass condition:** App reliably reads and validates the known CSV format.

**Stop condition:** Any test failure. Diagnose before proceeding to Phase 2.

---

### Phase 2 — Transaction Normalisation

**Goal:** Convert raw rows into consistent internal transaction objects.

**Scope:**
- Map CSV columns to internal transaction fields
- Parse `DD/MM/YYYY` dates to ISO format
- Parse debit and credit as numbers; empty = null
- Flag malformed rows — do not silently drop them

**Test:**
- Clean row → correct internal object shape and types
- Invalid date → row flagged, not dropped
- Non-numeric amount → row flagged, not dropped

**Pass condition:** Every row becomes a typed transaction object or is explicitly
flagged.

**Stop condition:** Any silent failure or incorrect type mapping. Diagnose before
proceeding to Phase 3.

---

### Phase 3 — Duplicate Detection

**Goal:** Prevent duplicate transactions from entering the dataset.

**Scope:**
- Detect by `date + narration + debit + credit`
- Show warning listing detected duplicates
- Three options: Import All / Skip Duplicates / Decide One by One
- One-by-one modal: Import or Skip per transaction

**Test:**
- Import same CSV twice → duplicates detected and listed correctly
- Skip All → no duplicates added
- Import All → duplicates added
- One by One → each decision applied correctly

**Pass condition:** Re-importing known data never silently creates duplicates.

**Stop condition:** Any silent duplicate import or incorrect detection. Diagnose
before proceeding to Phase 4.

---

### Phase 4 — Categorisation Engine

**Goal:** Match transactions to categories using rules, with confidence scoring.

**Scope:**
- Case-sensitive, plain text, contains-based matching
- Confidence scoring: High / Medium / Low / High (override for user-mapped)
- Conflict detection: two rules match → flag for user, do not auto-resolve
- No match → Uncategorised
- Categories: flat hardcoded default list (nested comes in Phase 9)

**Test:**
- `"Netflix"` vs `"NETFLIX SUBSCRIPTION"` → High
- `"Netflix"` vs `"Netflixhbo"` → Medium
- `"flix"` vs `"Netflix"` → Low
- Two rules match same description → conflict flagged
- No rule matches → Uncategorised

**Pass condition:** All confidence levels assigned correctly. Conflicts surfaced,
never silently resolved.

**Stop condition:** Any incorrect confidence assignment or silent conflict resolution.
Diagnose before proceeding to Phase 5.

---

### Phase 5 — Draft List Review UI

**Goal:** User reviews, corrects, and confirms categorisation before anything is saved.

**Scope:**
- Current upload batch only
- Colour-coded rows: Green (high), Orange (medium), Red (low)
- Category dropdown → dependent subcategory dropdown
- Filter by confidence level
- Auto-accept by confidence level
- Uncategorised prompt with three options
- Reclassification modal: update rule or this transaction only
- Confirm + save commits batch to in-memory history

**Test:**
- Mixed confidence batch → colour coding correct
- Category change → subcategory dropdown updates
- Auto-accept High → those rows accepted without manual review
- Confirm saves batch → transactions accessible in history state
- Reclassification: Yes → rule updated; No → transaction only

**Pass condition:** User can review, correct, and confirm a full batch. Nothing saved
without confirmation.

**Stop condition:** Incorrect colour coding, broken dropdown cascade, or save
failure. Diagnose before proceeding to Phase 6.

---

### Phase 6 — Rule Memory (In-Memory)

**Goal:** Learn from user decisions and apply them to future imports within the session.

**Scope:**
- Confirmed category → rule stored in application state
- Rules applied automatically on next upload
- Rule CRUD within the session: view, edit, delete

**Test:**
- Categorise unknown merchant → re-import same merchant → auto-categorised at High
- Edit rule → re-import → updated rule applied
- Delete rule → re-import → transaction uncategorised

**Pass condition:** Rules learned in-session are applied correctly on re-import.

**Stop condition:** Rules not applied, or edits and deletes have no effect. Diagnose
before proceeding to Phase 7.

---

### Phase 7 — Database Schema + Supabase Setup

**Goal:** Persist everything. Data survives across sessions.

**Scope:**
- Supabase project, PostgreSQL schema, Row Level Security
- Tables: `bank_formats`, `upload_sessions`, `transactions`, `categories`,
  `subcategories`, `mapping_rules`
- Wire transaction save, rule storage, and category loading to database
- Seed default categories and subcategories
- RLS in place (enforced fully after Phase 8)

**Test:**
- Migrations run cleanly
- Save transaction → reload → persists
- Save rule → reload → persists
- Default categories load from database

**Pass condition:** Data survives a page reload. Schema is clean. RLS is in place.

**Stop condition:** Migration failure, data loss on reload, or RLS misconfiguration.
Diagnose before proceeding to Phase 8.

---

### Phase 8 — Auth

**Goal:** Users must have an account. Data is isolated per user.

**Scope:**
- Email + password sign up and login
- Google OAuth
- 2FA (TOTP)
- Protected routes redirect unauthenticated users
- RLS fully enforced: users access only their own data

**Test:**
- Sign up → verify → log in → access confirmed
- Google OAuth → access confirmed
- Enable 2FA → log out → log in → 2FA prompt works
- Unauthenticated route access → redirected to login
- User A data → not visible to User B

**Pass condition:** All auth paths work. User data is fully isolated.

**Stop condition:** Any auth failure or RLS data leak. Diagnose before proceeding
to Phase 9.

---

### Phase 9 — Nested Categories + Full Management

**Goal:** Introduce nested categories and full CRUD for categories and rules.

**Scope:**
- Parent → subcategory structure
- Full predefined list seeded
- Create, rename, delete categories and subcategories
- Delete category → affected transactions → Uncategorised
- Create, view, edit, delete mapping rules directly

**Test:**
- Create parent + subcategory → relationship stored correctly
- Assign parent only → valid
- Assign parent + subcategory → valid
- Delete parent → affected transactions move to Uncategorised
- Delete rule → re-import → transaction uncategorised

**Pass condition:** Nested categories work. All management operations persist
correctly.

**Stop condition:** Broken dropdown cascade, delete not cascading to Uncategorised,
or management changes not persisting. Diagnose before proceeding to Phase 10.

---

### Phase 10 — Transaction History

**Goal:** Reliable, inspectable view of all saved transactions.

**Scope:**
- All transactions: date, narration, debit, credit, category, subcategory
- Filter by date range, category, subcategory
- Toggle Uncategorised on/off
- Reclassify from this view
- Australian financial year preset (1 July – 30 June)

**Test:**
- Known import → all transactions appear with correct values
- Date range filter → correct rows returned
- Toggle Uncategorised off → hidden correctly
- Reclassify → change reflected immediately

**Pass condition:** History accurately reflects stored data. All filters work correctly.

**Stop condition:** Display values do not match stored values, or filters are
incorrect. Diagnose before proceeding to Phase 11.

---

### Phase 11 — Dashboard

**Goal:** Accurate visual summary of spending using verified data.

**Scope:**
- Spending by category/subcategory: pie or bar (user selects)
- Spending over time: line or bar (user selects)
- Time grouping: weekly, monthly, quarterly, annually
- Filters: category, subcategory, date range
- Date presets: this month, this financial year, since first import, custom
- Toggle Uncategorised on/off

**Test:**
- Known history → category totals match underlying data exactly
- Time grouping change → chart buckets correct
- Category filter → chart reflects filtered data only
- Dashboard totals match transaction history view totals

**Pass condition:** Dashboard reconciles exactly with transaction history.

**Stop condition:** Any chart total that does not match underlying data. Diagnose
before proceeding to Phase 12.

---

### Phase 12 — Export

**Goal:** User can download their enriched transaction data.

**Scope:**
- CSV with all original columns + `Category` + `Subcategory`
- Uncategorised transactions included
- One-click download

**Test:**
- Export after known import → all original columns present and unmodified
- `Category` and `Subcategory` columns appended correctly
- Row count matches import
- Uncategorised transaction → `Uncategorised` in Category, empty Subcategory
- Category total in dashboard matches sum of that category in export

**Pass condition:** Export is complete, accurate, and reconciles with the dashboard.

---

## Phase Summary

| Phase | Goal | Depends On | Infra Required |
|---|---|---|---|
| 1 | CSV upload + raw parsing | — | None |
| 2 | Transaction normalisation | 1 | None |
| 3 | Duplicate detection | 2 | None |
| 4 | Categorisation engine | 2 | None |
| 5 | Draft list review UI | 3, 4 | None |
| 6 | Rule memory (in-memory) | 5 | None |
| 7 | Database + Supabase setup | 6 | Supabase |
| 8 | Auth (email, Google, 2FA) | 7 | Supabase Auth |
| 9 | Nested categories + management | 7, 8 | Supabase |
| 10 | Transaction history | 8, 9 | Supabase |
| 11 | Dashboard | 10 | Supabase |
| 12 | Export | 10 | Supabase |
