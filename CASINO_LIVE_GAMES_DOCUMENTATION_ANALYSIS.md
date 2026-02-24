# Full Analysis: Live Games in Slotegrator Casino API Documentation

This document is a full analysis of **CASINO_API_DOCUMENTATION.md** (Slotegrator Game Aggregator, v1.4.3) with focus on **live games**: what the API provides, what is specific or special about them, and how to implement and surface them so they are visible and accessible.

---

## 1. What the documentation says about “live” explicitly

The word **“live”** does **not** appear in the API documentation. There is:

- No endpoint such as `GET /games/live` or `GET /live-games`.
- No request parameter such as `type=live` or `category=Live Casino` for `GET /games`.
- No dedicated section titled “Live games” or “Live dealer”.

So **“live games” are not a separate API product**. They are a subset of the general games list, identified by response fields and by the **lobby** flow.

---

## 2. How live games are represented in the API

### 2.1 GET `/games` – games list

**Documented request parameters:**

- `expand` (optional): comma-separated expansions (`tags`, `parameters`, `images`, `related_games`).
- Pagination is implied (collection format with `_meta`, `_links`; production max **50 games per page**).

**No filter by type/category:** The API does **not** document any parameter to filter by game type (e.g. “Live Casino”). You receive paginated pages of all games; filtering by type must be done **after** fetching (client- or server-side).

**Relevant response fields for identifying live/lobby games:**

| Field          | Type    | Description (doc) |
|----------------|---------|-------------------|
| `type`         | string  | **Game type** (e.g. example shows `"Slots"`). Live dealer games will use a type such as `"Live Casino"` or similar – exact value is provider-specific. |
| `has_lobby`    | integer | **1 or 0** – “indicates if game has lobby”. When **1**, the game uses the **lobby flow** (see below). Typical for live table games. |
| `has_tables`   | integer | **1 or 0** – “indicates if game has game tables”. Often 1 for live/table games. |
| `uuid`, `name`, `image`, `provider`, etc. | | Same as for any other game. |

So in practice:

- **Live dealer / live casino** games are those returned by `GET /games` with:
  - `type` equal to something like `"Live Casino"` (or any type whose name/label suggests “live”), and/or
  - `has_lobby === 1` (and often `has_tables === 1`).

There is **nothing else in the doc** that defines “live” beyond these fields and the lobby behaviour.

---

## 3. What is specific/special: the lobby flow (games with lobby)

The only **special** behaviour for games that are typically “live” (live dealer, Baccarat, etc.) is the **lobby flow**.

### 3.1 Game launch flow (documented)

**Games without lobby:**

1. Call `POST /games/init`.
2. Redirect the player to the returned URL.

**Games with lobby:**

1. Call **`GET /games/lobby`** (with `game_uuid`, `currency`, optional `technology`).
2. Call **`POST /games/init`** with the **`lobby_data`** obtained from the lobby response.
3. Redirect the player to the returned URL.

So for **any** game with `has_lobby === 1`, you **must** call `/games/lobby` first and pass `lobby_data` into `/games/init`. There is no separate “live” launch flow; “live” is just the typical use case for lobby games.

### 3.2 GET `/games/lobby` – lobby (tables) for a game

**Request:**

- `game_uuid` (required): from `GET /games`.
- `currency` (required): player currency.
- `technology` (optional): `"html5"` or `"flash"`.

**Response (conceptually):**

- `lobby` (in the doc example it’s a single object; in practice it can be an array of tables):
  - **`lobbyData`** (string): **Required** for `POST /games/init` as the **`lobby_data`** parameter.
  - `name`: table name (e.g. “Baccarat”).
  - `isOpen`, `openTime`, `closeTime`.
  - **`dealerName`**, **`dealerAvatar`**: clearly for live dealer.
  - `technology`, `limits`, `tableId` (e.g. for freevouchers).

So “live” in the doc is reflected by:

- Games with **`has_lobby === 1`**.
- The **lobby** endpoint exposing **tables** with **dealer** info and **open/close times**.

Implementation-wise, “live games” are simply **games that have a lobby** and are launched via this two-step flow; the doc does not name them “live” explicitly.

### 3.3 POST `/games/init` – lobby_data

**Documented parameters include:**

- `lobby_data` (string, optional): **“Required for games with lobby (from `/lobby`)”**.

So the only special handling for lobby (and thus typically live) games is:

1. Detect `has_lobby === 1` (and optionally show a “live”/“table” badge if you also use `type` or `has_tables`).
2. Before launch: call `GET /games/lobby` for that `game_uuid` and currency.
3. Use the returned **`lobbyData`** as **`lobby_data`** in `POST /games/init`.

No other init parameters are specific to “live” in the doc.

---

## 4. Callbacks and transactions – nothing specific to live

The doc describes:

- Balance, bet, win, refund, rollback, rollback with list, etc.
- All reference `game_uuid`, `session_id`, and transaction `type` (e.g. bet, win, freespin).

There is **no** separate callback set or special transaction type for “live” games. They use the same callbacks as any other game. **Subsessions** (different `game_uuid` in same session after init, e.g. switching tables in the provider lobby) are mentioned only as a possibility; handling is the same (same `session_id`, possibly different `game_uuid`).

---

## 5. Other endpoints that touch “lobby” (and thus often live)

- **Freevouchers** (`/freevouchers/set`): `table_ids` are **“Table UUIDs from `/games/lobby`”**. So vouchers can be limited to specific lobby tables (typically live tables). No other “live”-specific logic is documented.

---

## 6. Summary: what is specific or special about live games

| Aspect | In the documentation |
|--------|----------------------|
| **Definition of “live”** | Not defined. In practice: games with `type` like “Live Casino” and/or `has_lobby === 1` (and often `has_tables === 1`). |
| **Listing live games** | No filter. You must use **GET /games** (paginated, max 50/page) and **filter by `type` and/or `has_lobby`** on your side. |
| **Launch** | **Same** as other games, except when **`has_lobby === 1`**: then you **must** call **GET /games/lobby** first and pass **`lobby_data`** into **POST /games/init**. |
| **Callbacks** | **Same** as for all games; no live-specific callbacks or transaction types. |
| **Lobby response** | Contains **dealer** and **table** info (dealerName, dealerAvatar, open/close times, limits, tableId). |

So the only **special** thing is the **lobby flow** for games with `has_lobby === 1`; the rest is “use the same endpoints, filter and label by `type` / `has_lobby`”.

---

## 7. How to implement and make live games appear and accessible

### 7.1 Backend (your server)

- **Listing**
  - Call Slotegrator **GET /games** with pagination (e.g. page, perPage; respect 50/page in production).
  - **Filter** items where:
    - `game.type` matches “Live Casino” (or whatever your aggregator returns), **or**
    - `game.has_lobby === 1` (if you want “all lobby games” as “live”).
  - Optionally support a **type** query on your API (e.g. `?type=Live Casino`) and return only those games (you may need to fetch multiple Slotegrator pages to collect enough live games, since Slotegrator does not filter by type).

- **Launch**
  - For **every** game, before init, check **`has_lobby`**:
    - If **`has_lobby === 1`**: call **GET /games/lobby** (game_uuid, currency, optional technology), then **POST /games/init** with **`lobby_data`** from the lobby response.
    - Otherwise: call **POST /games/init** only.
  - Use the same callback URL and transaction handling for all games (no live-specific logic).

- **Optional**
  - Endpoint like **GET /api/casino/games/live** that internally uses the same games endpoint and returns only games that you classify as “live” (by `type` and/or `has_lobby`).

### 7.2 Frontend (making them visible and accessible)

- **Discovery**
  - **Category/tab “Live Casino”**: when selected, request games with `type=Live Casino` (or your backend’s “live” filter). Show only those in the grid.
  - **Section “Your live casino” / “Live games”**: same data source; show a short list (e.g. first N) with a “View all” link to the Live Casino view (e.g. `/casino?category=live`).
  - **Badge**: For any game with `type` containing “live” or `has_lobby === 1`, show a “LIVE” or “Live dealer” badge so users can recognise them.

- **URL and state**
  - Use query or route so that “View all” opens e.g. `/casino?category=live` and the casino page preselects the “Live” category and only shows live games. Optionally persist `category` (and provider) in the URL so links are shareable.

- **Launch**
  - No extra UI for “live”: same “Play” button. Your backend already handles the lobby flow when `has_lobby === 1`. If you want, you can show a short “Loading table…” when the backend is calling the lobby before init.

### 7.3 Caching and rate limits (doc)

- **Games list** (including live) must be **cached client-side**; static data (e.g. images) must be cached; do not publish aggregator image URLs in the front-end.
- **Production:** 1 request per second for `/games`; max 50 games per page. When building a “live only” list, either cache and filter client-side or have your backend fetch multiple pages (respecting rate limits) and filter by type/`has_lobby`, then paginate your own response.

---

## 8. Checklist: implementing live games end-to-end

- [ ] **List**: Fetch games (GET /games, paginated); filter by `type` (e.g. `"Live Casino"`) and/or `has_lobby === 1`; expose via your API (e.g. `?type=Live Casino` or `/games/live`).
- [ ] **UI**: “Live Casino” category/tab and/or “Live” section with “View all” linking to a live-only view (e.g. `/casino?category=live`).
- [ ] **Badge**: Show “LIVE” (or similar) on game cards when `type` suggests live or `has_lobby === 1`.
- [ ] **Launch**: For every game, if `has_lobby === 1`, call GET /games/lobby then POST /games/init with `lobby_data`; otherwise only POST /games/init. Same callbacks for all.
- [ ] **Optional**: Use lobby response (dealerName, openTime/closeTime, limits) to show “Choose table” or “Live with dealer X” before init; then pass chosen `lobbyData` to init.

---

**Conclusion:** The Slotegrator documentation does **not** define or name “live games” explicitly. It defines **games with lobby** (`has_lobby === 1`) and the **lobby flow** (GET /games/lobby → POST /games/init with `lobby_data`). Live games are implemented by (1) treating `type` and/or `has_lobby` as “live”, (2) filtering the games list on your side, (3) using the lobby flow for launch when `has_lobby === 1`, and (4) surfacing them in the UI with a dedicated category/section and optional badges. There is no separate API or special callbacks for “live” beyond the lobby flow and the `type` / `has_lobby` / `has_tables` fields.

---

## 9. How to “call” them and where the live feed comes from

Live games are **different** from slots in that they have a **live dealer / live table** (video stream, real-time play). The important point: **you do not implement or stream the live feed yourself.** The **game provider** does.

### 9.1 The flow (how we “call” them)

1. **List (same as normal games)**  
   Call **GET /games** (paginated). Filter items where `type === "Live Casino"` or `has_lobby === 1`. Show those in your “Live Casino” section/category. No different API call for “live” list.

2. **Launch (same button, different backend steps)**  
   - User clicks **Play** on a live game (same as on a slot).  
   - Your frontend calls your backend: e.g. `POST /api/casino/games/:gameId/launch` with `device`, `language`, `returnUrl`.  
   - Your backend:
     - Loads the game (from GET /games or cache), sees **`has_lobby === 1`**.
     - Calls **GET /games/lobby** with `game_uuid` and `currency` → gets back **`lobbyData`** (and optionally table/dealer info).
     - Calls **POST /games/init** with **`lobby_data`** set to that value (plus player_id, session_id, etc.).  
   - Slotegrator returns a **URL**.  
   - You open that **URL** (e.g. in an iframe or new tab).  

3. **Where the live feed is**  
   That **URL** is the provider’s page. **That page** contains:
   - The live video stream (dealer, table, etc.)
   - The betting UI and game logic  

   So “calling” a live game = same as a normal game: **get a URL from init, then open it.** The provider’s page at that URL is what shows the live feed; you don’t stream anything yourself.

### 9.2 How we show them in the UI

| What | How |
|------|-----|
| **Show live games in the list** | Use the same **GET /games** response; filter by `type` (e.g. `"Live Casino"`) or `has_lobby === 1`. Display them like other games: card with image, name, and a **“LIVE”** badge. |
| **Category “Live Casino”** | When the user selects “Live Casino”, request games with `type=Live Casino` (or your backend’s “live” filter) and render only those in the grid. |
| **Section “Your live casino”** | Same filtered list; show e.g. first 5–6 with a “View all” link to `/casino?category=live`. |
| **Play button** | Same as for slots. On click → call your launch endpoint → backend does lobby + init for live games → you get URL → open URL (iframe or new tab). The opened page = full live experience (stream + table + bets). |

### 9.3 Optional: “Choose table” (multiple tables per game)

The **GET /games/lobby** response can contain **multiple tables** (e.g. different dealers, limits, open times). Right now many integrations take the **first** table’s `lobbyData` and pass it to init. To make “live” feel more special and give the user choice:

- Add an endpoint that returns lobby **tables** (e.g. from GET /games/lobby): dealer name, avatar, open/close time, limits.
- When the user clicks Play on a **lobby game**, first show a small **“Choose table”** modal with that list.
- When they pick a table, call launch with **that** table’s **`lobbyData`** (your backend would need to accept an optional `lobby_data` or `table_index` and pass it to init).

If you don’t need table choice, you can keep using a single lobby result (e.g. first table) and the experience is still full “live” once the provider’s URL is opened.
