# Casino Live Games – Documentation Analysis & Implementation Guide

This document summarizes the casino documentation (Slotegrator integration) and explains **how to implement and surface Live Casino games** in your platform.

---

## 1. What the documentation says

### 1.1 Game types from Slotegrator

- **`CASINO_API_DOCUMENTATION.md`** (Slotegrator): The **GET `/games`** endpoint returns a list of games. Each game has a **`type`** field (string), e.g.:
  - `"Slots"`
  - `"Live Casino"` (live dealer games)
  - `"Table Games"`
  - Other types depending on the aggregator catalog.

- The API does **not** support filtering by `type` in the request. You get paginated pages (e.g. 50 games per page) and must **filter client-side or server-side** by `game.type`.

- **`has_lobby`** is separate from "Live Casino":
  - `has_lobby === 1` → game has a **lobby** (e.g. table selection); you must call **GET `/games/lobby`** before **POST `/games/init`**.
  - Live dealer games can have `type === "Live Casino"` and may or may not have `has_lobby === 1`.

### 1.2 Testing & implementation docs

- **`CASINO_TESTING_PLAN.md`**: Covers setup, callbacks, launch, device filtering, search, **category tabs** (including "Live"), and lobby games. It does not define a special "live games only" flow; live games use the same launch flow as other games.
- **`SLOTEGRATOR_IMPLEMENTATION_GUIDE.md`**: Describes X-Sign auth, `getGames()`, `getGameLobby()`, `initializeGameSession()`, provider enablement per currency, and that **lobby games** must call `/games/lobby` before `/games/init`. No extra steps for "Live Casino" as a type.

**Conclusion:** Live games are just games with **`type === "Live Casino"`**. Same API, same launch flow (with lobby when `has_lobby === 1`). Implementation is mainly about **filtering, surfacing, and labeling** them in the UI and API.

---

## 2. What is already implemented

### 2.1 Backend (`server/`)

| Feature | Where | How |
|--------|--------|-----|
| **Type filter** | `server/src/routes/casino.js` | `GET /api/casino/games` accepts query `type`. When `type` is set (e.g. `type=Live Casino`), backend fetches one Slotegrator page and filters `g.type === type`. |
| **Game launch** | Same + `CasinoService` | Launch works for any game (including Live Casino). Lobby flow is implemented: if `has_lobby === 1`, backend calls `getGameLobby()` then passes `lobby_data` to init. |
| **Callbacks** | Callback handler | Bet/win/refund/rollback apply to all games; no special handling for live. |

So the backend already supports:

- Fetching games and filtering by `type` (e.g. `Live Casino`).
- Launching any game, including live dealer games, with lobby when required.

### 2.2 Frontend (`nadir-user/`)

| Feature | Where | How |
|--------|--------|-----|
| **Category "Live Casino"** | `app/casino/page.tsx` | Category tab `id: 'live'` → label "Live Casino". When selected, `filters.type = 'Live Casino'` is sent to the API. |
| **`isLive` on game** | Same + types | `isLive: game.type?.toLowerCase().includes('live')` so Live Casino games are tagged. |
| **"YOUR LIVE CASINO" section** | Same | A dedicated section that shows when the current list has live games (`filter(g => g.isLive)`), shows up to 5 with a "LIVE" badge. |
| **View All** | Same | "View All" for that section does not yet link to a live-only view (e.g. `/casino?category=live` or dedicated route). |

So: **filtering and surfacing live games are partly there**; what's missing is making "Live Casino" a first-class, easy-to-discover path (dedicated section on home/casino, "View All" that goes to live-only list, optional dedicated route).

---

## 3. How to implement live games (concrete steps)

### 3.1 Backend (optional improvements)

- **Already working:**
  - `GET /api/casino/games?type=Live%20Casino&device=desktop&page=1&perPage=50` returns only Live Casino games (within the first Slotegrator page).
  - No change required for launch or callbacks.

- **Optional:** If you want a **dedicated "live games" endpoint** for clarity or for a future "Live" landing page:
  - Add e.g. `GET /api/casino/games/live` that internally calls the same logic with `type=Live Casino` (and same device/pagination). This is a convenience wrapper only.

### 3.2 Frontend – make Live Casino a first-class experience

1. **"View All" for "YOUR LIVE CASINO"**
   - Today: button has no href or it doesn't apply filters.
   - Change: link to casino with Live filter applied, e.g.
     - `href="/casino?category=live"`
     - and on `/casino`, read `category` from query and set `selectedCategory = 'live'` on load so the main grid shows only Live Casino games.

2. **Default or prominent entry to Live**
   - On `/casino`, you can:
     - Either keep "Home" as default and add a clear "Live Casino" tab (already there).
     - Or add a **hero or quick-access block** at the top of the casino page: "Live Casino" with a few tiles and a "See all Live" link (same as above).

3. **Home page "Casino" block**
   - You already have "Featured Casino Games" on the home page. Optionally add a **second row** "Live Casino" with e.g. 3–6 live games:
     - Call `GET /api/casino/games?type=Live%20Casino&perPage=6&device=...` (or use existing endpoint with `type=Live Casino`).
     - Render a small grid and a "Play Live" (or "See all Live") link to `/casino?category=live`.

4. **URL state**
   - Ensure `/casino?category=live` (and optionally `?provider=...`) is read on load and that sharing/bookmarking this URL shows the Live Casino list and correct tab state.

### 3.3 UX details for "live" feel

- **Badge:** You already show a "LIVE" badge on live game cards in "YOUR LIVE CASINO"; keep it and use the same on any other live game grid (e.g. on home or in the main casino grid when category is Live).
- **Labels:** Use "Live Casino" or "Live dealer" consistently in nav and section titles.
- **Lobby games:** No extra work for "live" specifically; your existing lobby flow (`has_lobby` → `/games/lobby` → init) already covers live tables that use a lobby.

### 3.4 Testing (from CASINO_TESTING_PLAN)

- **Test 8 (Search & filters):** Select "Live Casino" tab and confirm only live games appear and that "View All" (once linked) shows the same.
- **Test 6–7 (Display & device):** Confirm live games respect device (desktop/mobile) like other games.
- **Test 10–11 (Launch):** Launch a Live Casino game (with and without lobby) and verify balance/callbacks as in the plan.

---

## 4. Summary

| Topic | Documentation | Current implementation | What to do |
|--------|----------------|------------------------|------------|
| **What are "live games"?** | Games with `type === "Live Casino"` from Slotegrator. Same API and launch flow. | Backend filters by `type`; frontend has Live tab and "YOUR LIVE CASINO" section. | Use existing type filter everywhere. |
| **Backend** | No special endpoint for live; use `/games` and filter by `type`. | `GET /api/casino/games?type=Live Casino` works. | Optional: add `/api/casino/games/live` wrapper. |
| **Frontend** | N/A | Live tab + section + `isLive` flag. | Wire "View All" to `/casino?category=live`, optional Live block on home, and URL state. |
| **Launch** | Same as other games; use lobby when `has_lobby === 1`. | Implemented. | No change. |
| **Callbacks** | Same for all games. | Implemented. | No change. |

So: **you don't need a new API contract for "live games".** You only need to **consistently filter by `type=Live Casino`** and **improve discovery and navigation** (tabs, "View All", optional home block, URL state) so users can easily find and play Live Casino games.
