# Vercel Deployment Guide

This guide will help you deploy the frontend (nadir-user) to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your project connected to a Git repository (GitHub, GitLab, or Bitbucket)
3. Your RapidAPI key for the sportsbook API

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the `nadir-user` folder as the **Root Directory**
   - Framework Preset: **Next.js** (should be auto-detected)

3. **Configure Environment Variables**
   - In the Vercel project settings, go to **Settings** → **Environment Variables**
   - Add the following variables:
   
   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `NEXT_PUBLIC_RAPIDAPI_KEY` | Your RapidAPI key | Required for sportsbook API |
   | `NEXT_PUBLIC_API_URL` | Your backend API URL (optional) | Only if you have a deployed backend API |

4. **Deploy**
   - Click **Deploy**
   - Vercel will automatically build and deploy your Next.js app

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to the frontend directory**
   ```bash
   cd nadir-user
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No** (for first deployment)
   - Project name? `nadir-user` (or your preferred name)
   - Directory? `./` (current directory)
   - Override settings? **No**

5. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_RAPIDAPI_KEY
   vercel env add NEXT_PUBLIC_API_URL
   ```
   
   Enter the values when prompted.

6. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

## Environment Variables

### Required Variables

- **NEXT_PUBLIC_RAPIDAPI_KEY**: Your RapidAPI key for the sportsbook API
  - Get it from [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
  - Used in `lib/sportsbookApi.ts`

### Optional Variables

- **NEXT_PUBLIC_API_URL**: Your backend API URL
  - Default: `http://localhost:3001/api`
  - Only needed if you have a separate backend API deployed
  - Used in `lib/api.ts` for Pragmatic Play casino games

## Important Notes

1. **Root Directory**: Make sure to set the root directory to `nadir-user` in Vercel project settings if deploying from the monorepo root.

2. **Build Settings**: 
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **API Routes**: Your Next.js API routes (`app/api/*`) will automatically work as serverless functions on Vercel.

4. **Image Optimization**: Currently disabled in `next.config.js` (`images: { unoptimized: true }`). If you want to enable Vercel's image optimization, you can remove this setting.

5. **Backend Services**: 
   - The PostgreSQL database from `docker-compose.yml` is NOT deployed to Vercel
   - If your app needs database access, you'll need to:
     - Use a cloud database service (e.g., Supabase, PlanetScale, Neon)
     - Or deploy your backend separately and set `NEXT_PUBLIC_API_URL`

## Post-Deployment

1. **Verify Deployment**
   - Visit your Vercel deployment URL
   - Check that the app loads correctly
   - Test API routes if applicable

2. **Custom Domain** (Optional)
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Environment Variables for Different Environments**
   - You can set different values for Production, Preview, and Development
   - Go to **Settings** → **Environment Variables** to configure

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (Vercel uses Node 18.x by default)

### API Routes Not Working
- Ensure environment variables are set correctly
- Check that API routes don't require local database connections
- Review serverless function logs in Vercel dashboard

### Environment Variables Not Working
- Ensure variable names start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables
- Check that variables are set for the correct environment (Production/Preview/Development)

## Next Steps

After successful deployment:
1. Set up automatic deployments from your Git repository
2. Configure preview deployments for pull requests
3. Set up monitoring and analytics
4. Configure custom domain if needed

