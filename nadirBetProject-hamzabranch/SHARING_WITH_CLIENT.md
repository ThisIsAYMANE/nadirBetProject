# 🌐 Sharing Your Work with Clients via ngrok

## Quick Setup Guide

### Step 1: Update Backend CORS Configuration ✅

**File:** `server/env` - Already updated!

The `CORS_ORIGIN` now includes:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3002,https://mazenapp.ngrok.app
```

**Important:** Restart your backend server if you haven't already!

### Step 2: Frontend Environment File ✅

**File:** `nadir-user/.env.local` - Already created!

Contains:
```env
NEXT_PUBLIC_BACKEND_URL=https://mazencallback.ngrok.app
```

**Note:** The frontend points to the **backend ngrok URL** (mazencallback.ngrok.app), so the browser can make API calls through ngrok.

### Step 3: Restart Services

1. **Stop** your frontend (Ctrl+C)
2. **Restart** your backend (to load new CORS settings)
3. **Restart** your frontend (to load new environment variables)

```powershell
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend  
cd nadir-user
npm run dev
```

### Step 4: Verify Everything Works

1. **Test Backend Health:**
   ```powershell
   curl https://mazencallback.ngrok.app/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

2. **Test Frontend:**
   Open in browser: `https://mazenapp.ngrok.app`
   - Should load your casino page
   - Should be able to see games
   - Should be able to login/register

3. **Test API Connection:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Navigate the site
   - Check that API calls go to `https://mazencallback.ngrok.app/api/...`
   - No CORS errors should appear

### Step 5: Share with Client

**Send your client this URL:**
```
https://mazenapp.ngrok.app
```

**What they can do:**
- ✅ View the casino page
- ✅ Browse games
- ✅ Register/Login
- ✅ Place bets (sports betting)
- ✅ Play casino games (if logged in)
- ✅ View their profile

**What they need to know:**
- This is a **development/demo** environment
- The URL may change if ngrok restarts (if using free tier)
- For production, you'll need a permanent domain

---

## Troubleshooting

### Issue: CORS Error in Browser

**Error:** `Access to fetch at 'https://mazencallback.ngrok.app/api/...' from origin 'https://mazenapp.ngrok.app' has been blocked by CORS policy`

**Solution:**
1. Check `server/env` has the frontend ngrok URL in `CORS_ORIGIN`
2. Restart backend server
3. Clear browser cache

### Issue: API Calls Fail (404 or Network Error)

**Error:** `Failed to fetch` or `404 Not Found`

**Solution:**
1. Verify backend is running: `curl https://mazencallback.ngrok.app/health`
2. Check `nadir-user/.env.local` has correct `NEXT_PUBLIC_BACKEND_URL`
3. Restart frontend
4. Check browser console for exact error

### Issue: ngrok URL Changed

**Problem:** Free ngrok URLs change on restart

**Solution:**
1. Update `server/env` with new callback URL
2. Update `server/env` with new return URL  
3. Update `nadir-user/.env.local` with new backend URL
4. Update `server/env` CORS_ORIGIN with new frontend URL
5. Restart both services

**Better Solution:** Use ngrok reserved domains (paid plan) for stable URLs

### Issue: Games Not Loading

**Check:**
1. Backend API is accessible: `curl https://mazencallback.ngrok.app/api/casino/games?perPage=10`
2. Frontend environment variable is set correctly
3. Browser console for errors
4. Network tab shows API calls going to ngrok URL

---

## Production Considerations

For production deployment, you'll need:

1. **Permanent Domain** (not ngrok)
   - Register a domain (e.g., `yourdomain.com`)
   - Point DNS to your server
   - Use SSL certificate (Let's Encrypt is free)

2. **Stable URLs**
   - Backend: `https://api.yourdomain.com`
   - Frontend: `https://yourdomain.com`
   - Callback: `https://api.yourdomain.com/api/casino/callback`

3. **Environment Variables**
   - Update all URLs in production `.env` files
   - Never commit `.env` files to git
   - Use environment-specific configs

---

## Quick Reference

### Current ngrok URLs:
- **Frontend:** `https://mazenapp.ngrok.app`
- **Backend:** `https://mazencallback.ngrok.app`

### Files to Update:
1. `server/env` - CORS_ORIGIN, CASINO_CALLBACK_URL, CASINO_RETURN_URL
2. `nadir-user/.env.local` - NEXT_PUBLIC_BACKEND_URL

### Commands:
```powershell
# Test backend
curl https://mazencallback.ngrok.app/health

# Test casino API
curl https://mazencallback.ngrok.app/api/casino/games?perPage=10
```

---

**Last Updated:** 2025-01-24
