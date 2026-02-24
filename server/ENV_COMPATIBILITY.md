# Env compatibility with your `.env`

Your `.env` is **compatible** with the code. Details below.

## Loading: `.env` vs `env`

- The server **first** tries to load `server/env` (no dot).
- If that file is missing, it **falls back** to `server/.env`.
- So you can use **either**:
  - `server/env` (no dot), or  
  - `server/.env` (dot) — **your current file is fine.**

**Note:** Scripts under `server/scripts/` (e.g. `inspect-casino-game-types.js`, `verify-env.js`) only read `server/env`. If you use only `.env`, either copy it to `env` when running those scripts, or run the server as usual (it will load `.env`).

## Variables the app actually uses

| Your variable        | Used by app? | Notes |
|----------------------|--------------|--------|
| `PORT`               | Yes          | Server port (default 3001). |
| `NODE_ENV`           | Yes          | Error messages, etc. |
| `FRONTEND_URL`       | Yes          | Redirect URLs, etc. |
| `JWT_SECRET`         | Yes          | Auth tokens. |
| `CORS_ORIGIN`        | Yes          | Allowed origins (comma-separated). |
| `SPORTS_API_*`       | Yes          | The Odds API. |
| `CASINO_*`           | Yes          | Slotegrator (games, launch, callback). |
| `DATABASE_URL`, `DB_*` | **No**     | Main app uses **SQLite** (`server/data/betting_platform.db`). Only used by scripts like `update-passwords.js` if you use PostgreSQL. |
| `BCRYPT_ROUNDS`      | No           | Code uses hardcoded rounds (10 or 12). |
| `RATE_LIMIT_*`       | No           | Rate limiter is commented out in code. |

So your DB and security vars are **optional / for other scripts**; the main server does not depend on them.

## Casino (Slotegrator)

- `CASINO_CALLBACK_URL` and `CASINO_RETURN_URL` must be **public** (e.g. ngrok) and configured in the Slotegrator merchant dashboard so the Play/Start button works.

**Summary:** Your `.env` is compatible. The server loads `server/.env` when `server/env` is missing. No Pragmatic vars needed.
