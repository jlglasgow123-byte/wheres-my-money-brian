# Project Log

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
