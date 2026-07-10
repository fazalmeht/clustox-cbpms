# CBPMS — Employee ID + Admin Review Access

**Date:** 2026-07-10
**Scope:** Apps Script version only (`apps-script-cbpms/`). The React `src/App.jsx` is out of scope.

## Problem

Two changes requested for the Clustox CBPMS:

1. **Employee ID** — The add/edit employee form has no human-readable employee code, and no such code is stored in the spreadsheet. Only an internal UUID (`id`) exists.
2. **Admin can't review their assigned employees** — Admins who are assigned employees to review have no way to open the review wizard. The nav never offers "My Evaluations" to an admin, boot always forces admins to the Dashboard, and the review-notification email is a bare URL that therefore lands them in the admin panel with no route to the review flow.

## Change 1 — Employee ID (`empCode`)

A new `empCode` field: **manually entered by the admin, required, and unique** across employees. It is distinct from the internal UUID `id`, which continues to drive assignments and reviews. `empCode` is added as the **last** column everywhere so existing sheet data stays aligned (`writeTab_` writes by column position and never rewrites the header).

- **`Setup.gs`**
  - Append `'empCode'` to `headers[TABS.EMPLOYEES]`.
  - Add an idempotent migration: if the existing `Employees` sheet's header row lacks `empCode`, append it as a new header column. Runs during setup so already-deployed sheets pick up the column without data corruption.
- **`Code.gs`**
  - `saveEmployee`: add `'empCode'` to the `cols` array (last). Validate: trimmed `empCode` is non-empty (else throw `'Employee ID is required.'`); and no *other* employee already uses the same code, compared case-insensitively and trimmed (else throw `'Employee ID "<code>" is already in use.'`).
  - `deleteEmployee`: add `'empCode'` to its `cols` array (keep in sync with `saveEmployee`).
- **`JavaScript.html`**
  - `empModal`: add an "Employee ID" field, marked required, as the **first** field in the form (`id="m_empcode"`).
  - `empSave`: read `val('m_empcode').trim()` into the payload as `empCode`; block client-side with a toast if blank.
  - `vEmps` table: add an "Employee ID" column (header + cell) so the code is visible in the employee list.

Existing employees will show a blank `empCode` until an admin edits them and supplies a code.

## Change 2 — Admin review access

The backend already permits an admin to review anyone assigned to them (`getBootstrap` builds `myEmployees` for every user; `saveReview` bypasses the assignment check for admins). Only the frontend routing blocks it.

- **`JavaScript.html` `navFor`**: when `isAdmin`, append `['eval','My Evaluations']` if `myEmployees.length`, and `['done','My Reviews']` if `myReviews.length || myEmployees.length`, after the existing admin nav items. Non-admin behavior unchanged.
- **`Code.gs` `notifyReviewer_`**: append `?view=eval` to the web-app URL used in the review email body.
- **`JavaScript.html` boot** (`DOMContentLoaded`): read the `view` URL parameter via `google.script.url.getLocation(cb)`. If `view === 'eval'` and the user has assigned employees, set the landing tab to `eval` regardless of admin role. If the param is absent or the API fails, fall back to the existing default (`admin → dash`, else `eval`/`none`). Since `getLocation` is async, resolve it before `renderShell()`.

## Out of scope / non-goals

- No changes to `src/App.jsx`.
- No change to how assignments are created (admins are assigned employees through the existing Reviewers & Assignments flow).
- No backfill of `empCode` for existing employees beyond leaving it blank until edited.

## Testing / verification

- Add a new employee with an Employee ID → confirm it saves, appears in the table, and lands in the `Employees` sheet's `empCode` column.
- Attempt to save a second employee with a duplicate code → rejected with the duplicate error.
- Attempt to save with a blank code → rejected.
- As an admin assigned to an employee: confirm "My Evaluations" appears in the nav and the review wizard opens and submits.
- Open the app with `?view=eval` as an admin with assignments → lands directly on My Evaluations.
- Confirm a plain admin login (no assignments / no param) still lands on the Dashboard.
