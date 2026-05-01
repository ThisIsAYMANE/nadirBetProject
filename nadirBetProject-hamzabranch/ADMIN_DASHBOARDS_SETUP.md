# 🔐 Admin Dashboards Setup for Client Access

## Overview

You have **3 portals** that need to be accessible via ngrok:

1. **User Portal** (port 3002) - ✅ Already set up: `https://mazenapp.ngrok.app`
2. **Executive Portal** (port 5173) - For Owner/Super Admin
3. **Management Portal** (port 5174) - For Admin/Broker

---

## Step 1: Set Up ngrok Tunnels

You need **3 separate ngrok tunnels** running simultaneously. Open **3 separate terminal windows**:

### Terminal 1: User Portal (Already Running)
```powershell
ngrok http 3002 --domain=mazenapp.ngrok.app
```

### Terminal 2: Executive Portal (NEW)
```powershell
ngrok http 5173 --domain=YOUR_EXECUTIVE_DOMAIN.ngrok.app
```

**Note:** Replace `YOUR_EXECUTIVE_DOMAIN` with your ngrok domain. If you don't have a reserved domain, use:
```powershell
ngrok http 5173
```
This will give you a random URL like `https://abc123.ngrok-free.app`

### Terminal 3: Management Portal (NEW)
```powershell
ngrok http 5174 --domain=YOUR_MANAGEMENT_DOMAIN.ngrok.app
```

**Or without reserved domain:**
```powershell
ngrok http 5174
```

---

## Step 2: Update Backend CORS

**File:** `server/env`

Update the `CORS_ORIGIN` line to include your new admin portal ngrok URLs:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3002,https://mazenapp.ngrok.app,https://YOUR_EXECUTIVE_DOMAIN.ngrok.app,https://YOUR_MANAGEMENT_DOMAIN.ngrok.app
```

**Important:** Restart your backend server after updating!

---

## Step 3: Environment Files Created ✅

I've already created the `.env` files for both admin portals:

- ✅ `admin-portal-executive/.env` - Points to `https://mazencallback.ngrok.app/api`
- ✅ `admin-portal-management/.env` - Points to `https://mazencallback.ngrok.app/api`

Both portals are now configured to use your ngrok backend URL.

---

## Step 4: Start All Services

### Terminal 1: Backend Server
```powershell
cd server
npm start
```

### Terminal 2: User Portal
```powershell
cd nadir-user
npm run dev
```

### Terminal 3: Executive Portal
```powershell
cd admin-portal-executive
npm run dev
```

### Terminal 4: Management Portal
```powershell
cd admin-portal-management
npm run dev
```

### Terminal 5-7: ngrok Tunnels
(As described in Step 1)

---

## Step 5: Access URLs

Once everything is running, your client can access:

### User Portal
```
https://mazenapp.ngrok.app
```
- Public access
- Sports betting, casino, user features

### Executive Portal
```
https://YOUR_EXECUTIVE_DOMAIN.ngrok.app
```
- **Access:** Owner, Super Admin roles only
- **Features:** Full system overview, revenue charts, broker management

### Management Portal
```
https://YOUR_MANAGEMENT_DOMAIN.ngrok.app
```
- **Access:** Admin, Broker roles only
- **Features:** User management, transaction monitoring, cashout queue

---

## Step 6: Test Access

### Test Executive Portal:
1. Open: `https://YOUR_EXECUTIVE_DOMAIN.ngrok.app`
2. Login with Owner/Super Admin credentials
3. Verify dashboard loads
4. Check browser console (F12) for errors

### Test Management Portal:
1. Open: `https://YOUR_MANAGEMENT_DOMAIN.ngrok.app`
2. Login with Admin/Broker credentials
3. Verify dashboard loads
4. Check browser console (F12) for errors

---

## Troubleshooting

### Issue: CORS Error in Admin Portals

**Error:** `Access to fetch at 'https://mazencallback.ngrok.app/api/...' has been blocked by CORS`

**Solution:**
1. Check `server/env` includes the admin portal ngrok URLs in `CORS_ORIGIN`
2. Restart backend server
3. Clear browser cache

### Issue: API Calls Fail (404 or Network Error)

**Solution:**
1. Verify backend is running: `curl https://mazencallback.ngrok.app/health`
2. Check `.env` files in admin portals have correct `VITE_API_URL`
3. Restart admin portal dev servers
4. Check browser console for exact error

### Issue: Port Already in Use

**Error:** `Port 5173 is already in use`

**Solution:**
1. Find and kill the process using the port:
   ```powershell
   # Find process
   netstat -ano | findstr :5173
   # Kill process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```
2. Or change the port in `vite.config.ts` and update ngrok accordingly

### Issue: ngrok Free Tier Limitations

**Problem:** Free ngrok only allows 1 tunnel at a time

**Solutions:**
1. **Use ngrok's paid plan** for multiple reserved domains
2. **Use a single ngrok tunnel** with a reverse proxy (nginx) to route to different ports
3. **Share one portal at a time** with your client

---

## Quick Reference

### Ports:
- **User Portal:** 3002
- **Executive Portal:** 5173
- **Management Portal:** 5174
- **Backend API:** 3001

### ngrok URLs:
- **User Frontend:** `https://mazenapp.ngrok.app`
- **Backend API:** `https://mazencallback.ngrok.app`
- **Executive Portal:** `https://YOUR_EXECUTIVE_DOMAIN.ngrok.app` (to be set)
- **Management Portal:** `https://YOUR_MANAGEMENT_DOMAIN.ngrok.app` (to be set)

### Files Updated:
1. ✅ `admin-portal-executive/.env` - VITE_API_URL
2. ✅ `admin-portal-management/.env` - VITE_API_URL
3. ⚠️ `server/env` - CORS_ORIGIN (needs your ngrok URLs)

---

## Alternative: Single ngrok with Subdomains

If you have ngrok paid plan, you can use subdomains:

```powershell
# User portal
ngrok http 3002 --domain=user.mazenapp.ngrok.app

# Executive portal  
ngrok http 5173 --domain=executive.mazenapp.ngrok.app

# Management portal
ngrok http 5174 --domain=management.mazenapp.ngrok.app
```

This requires a reserved domain in ngrok.

---

**Last Updated:** 2025-01-24
