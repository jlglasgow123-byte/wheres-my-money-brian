# CLAUDE.md — Money: Where Did It Go?

## Project Overview

A personal finance web application. Users upload bank CSV exports,
categorise transactions, and understand their spending patterns.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth)

**PRD:** See `PRD.md` for full product spec, decisions, and build plan.

---

## Build Rules

- Follow the phased build plan in `PRD.md` exactly — one phase at a time
- Run the defined test for each phase before proceeding to the next
- Hard stop if a phase test fails — diagnose before continuing
- Do not add features, UI polish, or abstractions beyond the current phase scope

---

## Key Product Decisions

These are confirmed — do not change without explicit instruction:

- CSV matching: **case-sensitive**, plain text, contains-based
- Confidence: **High** (whole word) / **Medium** (embedded) / **Low** (partial)
- Rule conflicts: **prompt the user** — never auto-resolve
- Duplicate imports: **warn user**, offer Import All / Skip All / One by One
- Categories: **nested** (parent → subcategory); Uncategorised cannot be deleted
- Reclassification: prompt "permanently change this mapping?" before updating rule
- Auth: email/password + Google OAuth + 2FA (TOTP)
- Data: Supabase PostgreSQL, Row Level Security on all tables

---

## File Structure

```
app/                  → Next.js App Router pages and API routes
  api/                → Route handlers (POST /api/upload, etc.)
  upload/             → Upload flow pages
  review/             → Draft list review
  dashboard/          → Charts and insights
  transactions/       → Full history
  rules/              → Mapping rules management
  categories/         → Category management
  export/             → CSV export
  settings/           → Account and preferences
lib/
  parsers/            → Pluggable CSV parser interface + bank implementations
    types.ts          → BankParser interface, ParseResult, RawRow types
    anz.ts            → ANZ bank parser (MVP)
    index.ts          → Parser registry
components/           → Shared UI components
```

---

## Code Standards

- TypeScript strict mode — no `any`
- Server Components by default; `'use client'` only when interactivity is needed
- API routes in `app/api/*/route.ts` using Web Request/Response APIs
- Path alias `@/*` maps to project root
- No inline styles — Tailwind only
- No unused imports, variables, or dead code

---

## Working Rules

- Read `PRD.md` at the start of any new session before writing code
- Do not invent product behaviour — check PRD.md first
- Draft significant changes in chat before writing to files
- Do not install packages without stating why
- Do not create files not required by the current phase

---

## CSV Format Reference (MVP — ANZ)

Headers (exact):
`BSB Number`, `Account Number`, `Transaction Date`, `Narration`,
`Cheque`, `Debit`, `Credit`, `Balance`, `Transaction Type`

Date format: `DD/MM/YYYY`
Currency: AUD only
Amounts: separate Debit / Credit columns; empty = null
Unique ID: none — dedup by date + narration + debit + credit

---

## Phase Status

Track current phase progress here as build progresses.

| Phase | Goal | Status |
|---|---|---|
| 1 | CSV upload + raw parsing | In progress |
| 2 | Transaction normalisation | Pending |
| 3 | Duplicate detection | Pending |
| 4 | Categorisation engine | Pending |
| 5 | Draft list review UI | Pending |
| 6 | Rule memory (in-memory) | Pending |
| 7 | Database + Supabase setup | Pending |
| 8 | Auth | Pending |
| 9 | Nested categories + management | Pending |
| 10 | Transaction history | Pending |
| 11 | Dashboard | Pending |
| 12 | Export | Pending |
