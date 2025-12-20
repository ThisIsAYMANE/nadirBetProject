# Quick Vercel Deployment

## 🚀 Fast Track (5 minutes)

### Step 1: Push to Git
```bash
git add .
git commit -m "Ready for Vercel"
git push
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. **Important**: Set **Root Directory** to `nadir-user`
4. Click **Deploy**

### Step 3: Add Environment Variables
After first deployment, go to **Settings** → **Environment Variables** and add:

```
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here
```

(Optional) If you have a backend API:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

### Step 4: Redeploy
Click **Redeploy** in the Vercel dashboard to apply environment variables.

## ✅ That's it!

Your app will be live at `https://your-project.vercel.app`

For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

