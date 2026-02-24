# Casino Filters – Unapplied / TODO

Notes for later: filter improvements that were analysed but not yet implemented.

---

## 1. Provider-only branch (backend)

- **Current:** When only `provider` is set (no `type`), the API fetches **one** Slotegrator page and filters by provider. `totalCount` and `pageCount` come from Slotegrator, not from the filtered list.
- **TODO:** Fetch multiple pages when filtering by provider (like the type branch), then filter by provider and return correct `totalCount` / `pageCount` for the filtered result.

**File:** `server/src/routes/casino.js`

---

## 2. Fallback path (backend)

- **Current:** When neither `type` nor `provider` triggers the special branches, the fallback uses **case-sensitive** provider comparison and **exact** type match (no "live" substring or `has_lobby` logic).
- **TODO:** Make provider comparison **case-insensitive**. Optionally apply the same "Live Casino" logic (type contains "live" or `has_lobby === 1`) in the fallback when type is "Live Casino".

**File:** `server/src/routes/casino.js`

---

## 3. Categories without API `type` (frontend + optional backend)

- **Current:** Categories like **New**, **Crash**, **Poker**, **Bingo**, **Offers** do not send a `type` (or equivalent) to the API. Only "new" and "jackpots" get a **client-side** tag filter on the full list.
- **TODO:** Decide if these should:
  - Map to API `type`/tags (if Slotegrator supports them), or
  - Stay client-side but with URL state (see below) so the selection is shareable/bookmarkable.

**Files:** `nadir-user/app/casino/page.tsx`, optionally `server/src/routes/casino.js`

---

## 4. Search (frontend / backend)

- **Current:** Search is **client-side only** on the current page/category result. It does not search across all pages or the full catalog.
- **TODO:** Either:
  - Add **server-side search** (if Slotegrator API supports search by name), or
  - Fetch more pages when searching and filter by name on the server, then paginate.

**Files:** `nadir-user/app/casino/page.tsx`, `server/src/routes/casino.js`

---

## 5. URL state (frontend)

- **Current:** Category and provider are not reflected in the URL. Refreshing or sharing the link loses the selection.
- **TODO:** Read and write URL params, e.g.:
  - `/casino?category=live`
  - `/casino?category=slots&provider=Evolution`
  So the current category and provider are shareable and restored on load.

**File:** `nadir-user/app/casino/page.tsx`

---

## Summary

| Item              | Area     | Priority (suggested) |
|-------------------|----------|----------------------|
| Provider multi-page + counts | Backend  | High                 |
| Fallback case-insensitive + Live logic | Backend  | Medium               |
| New/Crash/Poker/Bingo/Offers mapping   | Frontend/API | Low              |
| Server-side or broader search         | Backend/Frontend | Medium        |
| URL state (?category=, ?provider=)    | Frontend | Medium               |
