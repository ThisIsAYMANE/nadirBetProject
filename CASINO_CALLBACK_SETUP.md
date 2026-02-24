# Casino Play Button – Callback Setup

If the **Play** button (slots) or **Start** button (live games) is not clickable, Slotegrator cannot reach your callback endpoint.

## What was fixed in code

1. **Lobby games** – Lobby response is now parsed correctly when the API returns `lobby` as an array of tables (first open table is used for `lobby_data`).
2. **Balance callback** – Balance requests now return only `{ balance }` immediately, without creating a transaction (per API doc).

## What you must do

**Use a public callback URL.** Slotegrator’s servers send balance/bet/win requests to your server. If your URL is `http://localhost:3001/...`, they cannot reach it, so the game disables Play/Start.

1. **Expose your backend publicly**, e.g.:
   - **Local dev:** run ngrok: `ngrok http 3001` and use the HTTPS URL (e.g. `https://abc123.ngrok.io`).
   - **Production:** use your real domain (e.g. `https://api.yoursite.com`).

2. **Set in your server env** (e.g. `server/env`):
   ```bash
   CASINO_CALLBACK_URL=https://YOUR-PUBLIC-HOST/api/casino/callback
   ```

3. **Configure the same URL in Slotegrator** in the merchant/callback settings so they know where to send balance and bet callbacks.

4. Restart the server and try again. The Play/Start button should become clickable once callbacks are reachable and respond within 3 seconds.
