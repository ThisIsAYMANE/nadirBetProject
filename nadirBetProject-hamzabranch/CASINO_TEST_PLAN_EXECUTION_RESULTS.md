# Casino Test Plan – Execution Results

Executed per plan: **Test Live Casino, Then Filters (with full steps from docs)**.

---

## Phase 0: Prerequisites

| Step | Status | Notes |
|------|--------|--------|
| 0.1 Environment | Done | `server/env` and `server/.env` present; required CASINO_* and server vars in use |
| 0.2 Database | Done | `node server/add-casino-tables.js` run successfully; tables `game_sessions`, `recent_games`, `casino_transactions`, `user_profiles` (with `currency`) exist |
| 0.3 ngrok | Manual | Per NGROK_SETUP.md and CASINO_CALLBACK_SETUP.md: start tunnels, set CASINO_CALLBACK_URL/CASINO_RETURN_URL, configure same callback URL in Slotegrator |
| 0.4 Services | Done | Backend started; health check returns 200 |

---

## Phase 1: Live Casino

| Step | Status | Notes |
|------|--------|--------|
| 1.1 Inspect game types | Done | `node server/scripts/inspect-casino-game-types.js` run; output shows types with `has_lobby === 1` (roulette, blackjack, dragon tiger, baccarat); "No game type contains 'live'. Use has_lobby=1 to show live/table games" |
| 1.2 API Live Casino list | Automated (slow) | Full test in `server/scripts/run-casino-test-plan.js`; Live Casino endpoint can take 1–2 min (backend fetches many Slotegrator pages). Run manually when needed |
| 1.3 UI Live Casino tab | Manual | Per plan: open `/casino`, click Live Casino, verify grid shows live/lobby games |
| 1.4 Launch live game / Start button | Manual | Per plan and CASINO_CALLBACK_SETUP.md: launch a live game, test Start/Play; requires public callback URL in Slotegrator |
| 1.5 Lobby flow verification | Manual | Per plan: choose `has_lobby === 1` game, launch, verify backend calls GET /games/lobby then POST /games/init with lobby_data |

---

## Phase 2: Filters

| Step | Status | Notes |
|------|--------|--------|
| 2.1 Category filter (API) | Done | Quick script: games list (no type) returns 200, items, _meta. Full category checks (Slots, Table Games, etc.) in `run-casino-test-plan.js` (Slots/Table requests can be slow) |
| 2.2 Provider filter | Done | Providers endpoint: 200, 107 providers for EUR |
| 2.3 Search | Manual | Client-side only; per plan and CASINO_FILTERS_TODO.md |
| 2.4 Pagination | Manual | Per plan: verify pagination; URL has no ?page= or ?category= |
| 2.5 Device filter | Manual | Per CASINO_TESTING_PLAN Tests 6–7 |
| 2.6 Known limitations | Documented | See CASINO_FILTERS_TODO.md |

---

## Scripts Added

- **`server/scripts/run-casino-test-plan.js`** – Full API checks (Phase 1.2 Live Casino + Phase 2). Run with backend up; Live Casino request may take 1–2 min.
- **`server/scripts/run-casino-test-plan-quick.js`** – Quick checks: health, games list (one page), providers. Run: `node scripts/run-casino-test-plan-quick.js` (default base `http://localhost:3001`).

**Quick test result (run during execution):** 6 passed, 0 failed (health, games list, _meta, providers).

---

## Manual Steps Remaining (per plan)

1. **ngrok**: Start backend and frontend tunnels; set and register CASINO_CALLBACK_URL.
2. **UI**: Open `/casino`, test Live Casino tab, category tabs, provider dropdown, search, pagination.
3. **Launch**: Log in, launch a live game, verify Start/Play with callback reachable.
4. **Optional**: Callback tests (balance, bet, win, refund, rollback) per CASINO_TESTING_PLAN Tests 12–18 using `server/scripts/test-casino-callback.js`.

---

**Date:** 2025-01-24  
**Plan:** Casino test plan (Live Casino first, then filters)
