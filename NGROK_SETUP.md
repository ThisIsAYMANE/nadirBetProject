# 🔗 ngrok Setup Guide for Casino Integration

## Quick Start

### 1. Install ngrok

**Windows (PowerShell as Admin):**
```powershell
# Using Chocolatey
choco install ngrok

# Or download from: https://ngrok.com/download
# Extract to a folder in your PATH
```

**Mac:**
```bash
brew install ngrok
```

**Linux:**
```bash
# Download from: https://ngrok.com/download
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

### 2. Get ngrok Auth Token

1. Sign up at https://ngrok.com (free account works)
2. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy your authtoken

### 3. Configure ngrok

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

### 4. Start ngrok Tunnels

You need **TWO separate terminal windows** for two tunnels:

#### Terminal 1: Backend Tunnel (Port 3001)
```bash
# For reserved domain (if you have one)
ngrok http 3001 --domain=mazencallback.ngrok.app

# OR for free/random domain
ngrok http 3001
```

**Copy the HTTPS URL** (e.g., `https://mazencallback.ngrok.app` or `https://abc123.ngrok-free.app`)

#### Terminal 2: Frontend Tunnel (Port 3002)
```bash
# For reserved domain (if you have one)
ngrok http 3002 --domain=mazenapp.ngrok.app

# OR for free/random domain
ngrok http 3002
```

**Copy the HTTPS URL** (e.g., `https://mazenapp.ngrok.app` or `https://xyz789.ngrok-free.app`)

### 5. Update Environment Variables

Edit `server/.env`:

```env
# Backend callback URL (for Slotegrator to send callbacks)
CASINO_CALLBACK_URL=https://mazencallback.ngrok.app/api/casino/callback

# Frontend return URL (where users return after game)
CASINO_RETURN_URL=https://mazenapp.ngrok.app/casino
```

**Important Notes:**
- The callback URL **MUST** end with `/api/casino/callback`
- The return URL should point to your casino page
- If using free ngrok, URLs change each time you restart ngrok
- For production, use reserved domains or static IPs

### 6. Restart Backend Server

After updating `.env`, restart your backend:

```bash
cd server
npm start
```

---

## Verification

### Check Backend is Accessible

```bash
curl https://mazencallback.ngrok.app/health
```

Should return: `{"status":"OK","timestamp":"..."}`

### Check Callback Endpoint

```bash
curl https://mazencallback.ngrok.app/api/casino/callback
```

Should return: `{"error":"..."}` (expected, since it requires POST with auth)

### Check Frontend is Accessible

Open in browser: `https://mazenapp.ngrok.app`

Should load your user portal.

---

## Troubleshooting

### Issue: "ngrok: command not found"

**Solution:**
- Add ngrok to your PATH
- Or use full path: `C:\path\to\ngrok.exe http 3001`

### Issue: "authtoken is required"

**Solution:**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

### Issue: "domain already in use"

**Solution:**
- Another ngrok instance is using that domain
- Kill other ngrok processes
- Or use a different domain

### Issue: "tunnel not accessible"

**Solution:**
- Check backend is running on port 3001
- Check firewall isn't blocking
- Verify ngrok is running: `ngrok status`

### Issue: "URL changes every restart"

**Solution:**
- Use reserved domains (paid ngrok plan)
- Or update `.env` each time you restart
- Or use ngrok config file for static domains

---

## ngrok Web Interface

When ngrok is running, you can access:

**Local:** http://localhost:4040

This shows:
- Request inspector (see all requests)
- Response inspector
- Replay requests
- API documentation

---

## Production Considerations

For production, consider:

1. **Reserved Domains** (ngrok paid plan)
   - Static URLs that don't change
   - Better for Slotegrator configuration

2. **Static IP** (ngrok paid plan)
   - More reliable for callbacks
   - Better security

3. **Custom Domain** (ngrok paid plan)
   - Use your own domain
   - More professional

4. **Alternative Solutions:**
   - Deploy to cloud (AWS, Heroku, etc.)
   - Use cloudflare tunnels
   - Use other tunneling services

---

## Quick Commands Reference

```bash
# Start backend tunnel
ngrok http 3001

# Start frontend tunnel  
ngrok http 3002

# Check status
ngrok status

# View web interface
# Open: http://localhost:4040

# Stop ngrok
# Press Ctrl+C in terminal
```

---

## Testing Callback Endpoint

Once ngrok is running, test the callback:

```bash
# Using the test script
cd server
node scripts/test-casino-callback.js balance USER_ID 0
```

Or manually:

```bash
curl -X POST https://mazencallback.ngrok.app/api/casino/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=balance&player_id=TEST&transaction_id=TEST001&game_uuid=TEST&amount=0&currency=EUR"
```

---

**Last Updated:** 2025-01-24
